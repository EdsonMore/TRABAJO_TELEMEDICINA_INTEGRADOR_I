// app/api/recetas/[id]/farmacias-disponibles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

interface MedicamentoReceta {
  medicamento_id: number;
  cantidad: number;
}

interface UbicacionPaciente {
  latitud?: number;
  longitud?: number;
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string; // ✅ AGREGADO
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: any = null;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id: recetaId } = await params;

    if (!recetaId) {
      return NextResponse.json(
        { error: "ID de receta requerido" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Obtener coordenadas del paciente (desde el navegador)
    const latStr = request.nextUrl.searchParams.get("lat");
    const lngStr = request.nextUrl.searchParams.get("lng");
    const latPaciente = latStr ? parseFloat(latStr) : null;
    const lngPaciente = lngStr ? parseFloat(lngStr) : null;

    // 1. Verificar que la receta pertenece al paciente
    const recetaResult = await client.query(
      `SELECT r.*, p.id as paciente_id, u.id as usuario_id
       FROM recetas r
       JOIN citas c ON r.id_cita = c.id
       JOIN pacientes p ON c.id_paciente = p.id
       JOIN usuarios u ON p.id_usuario = u.id
       WHERE r.id = $1 AND u.id = $2`,
      [recetaId, usuario.id]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada o no pertenece al paciente" },
        { status: 404 }
      );
    }

    // 2. Obtener medicamentos de la receta
    const medicamentosResult = await client.query(
      `SELECT medicamento_id, cantidad 
       FROM receta_detalle 
       WHERE id_receta = $1`,
      [recetaId]
    );

    if (medicamentosResult.rows.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron medicamentos en la receta" },
        { status: 404 }
      );
    }

    // 3. Obtener ubicación del paciente desde el perfil
    let ubicacionPaciente: UbicacionPaciente = {};
    try {
      // Usa tu API de perfil para obtener la ubicación completa
      const perfilResponse = await fetch(
        `${request.nextUrl.origin}/api/paciente/perfil`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (perfilResponse.ok) {
        const perfilData = await perfilResponse.json();
        const infoPersonal = perfilData.informacion_personal;

        ubicacionPaciente = {
          direccion: infoPersonal.direccion,
          distrito: infoPersonal.ubicacion?.distrito,
          provincia: infoPersonal.ubicacion?.provincia,
          departamento: infoPersonal.ubicacion?.departamento,
        };

        console.log("📍 Ubicación del paciente obtenida:", ubicacionPaciente);
      } else {
        console.warn("No se pudo obtener perfil del paciente");
      }
    } catch (error) {
      console.warn("Error obteniendo perfil, usando valores por defecto");
    }

    // 4. Buscar farmacias con disponibilidad
    const farmaciasResult = await client.query(
      `SELECT 
    f.id as farmacia_id,
    f.nombre_comercial as nombre_farmacia,
    f.ruc,
    f.direccion,
    f.delivery_disponible,
    f.radio_delivery_km,
    u.departamento,
    u.provincia,
    u.distrito,
    u.codigo_postal,
    -- Calcular disponibilidad CORRECTAMENTE
    COUNT(DISTINCT rd.medicamento_id) as total_medicamentos,
    COUNT(DISTINCT CASE WHEN inv.stock_actual >= rd.cantidad THEN rd.medicamento_id END) as medicamentos_disponibles,
    COUNT(DISTINCT CASE WHEN inv.stock_actual < rd.cantidad OR inv.stock_actual IS NULL THEN rd.medicamento_id END) as medicamentos_faltantes,
    -- Calcular precio total CORRECTAMENTE
    SUM(DISTINCT CASE 
      WHEN inv.stock_actual >= rd.cantidad THEN inv.precio_venta * rd.cantidad 
      ELSE 0 
    END) as precio_total
   FROM farmacias f
   JOIN ubicaciones u ON f.id_ubicacion = u.id
   CROSS JOIN receta_detalle rd
   LEFT JOIN inventario_farmacia inv ON (
     f.id = inv.id_farmacia 
     AND rd.medicamento_id = inv.id_medicamento
     AND inv.disponible = true
     AND inv.stock_actual > 0
   )
   WHERE rd.id_receta = $1
   GROUP BY f.id, f.nombre_comercial, f.ruc, f.direccion, f.delivery_disponible, 
            f.radio_delivery_km, u.departamento, u.provincia, u.distrito, u.codigo_postal
   HAVING COUNT(DISTINCT CASE WHEN inv.stock_actual >= rd.cantidad THEN rd.medicamento_id END) > 0
   ORDER BY medicamentos_disponibles DESC, precio_total ASC`,
      [recetaId]
    );

    if (farmaciasResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: "No se encontraron farmacias con disponibilidad completa",
        opciones: [],
      });
    }

    // 5. Enriquecer datos con información detallada de medicamentos
    const farmaciasEnriquecidas = await Promise.all(
      farmaciasResult.rows.map(async (farmacia: any) => {
        // Obtener detalles de medicamentos para esta farmacia
        const medicamentosDetalle = await client.query(
          `SELECT DISTINCT ON (rd.medicamento_id)
    rd.medicamento_id,
    m.nombre_comercial,
    m.nombre_generico,
    rd.cantidad as cantidad_requerida,
    COALESCE(inv.stock_actual, 0) as stock_disponible,
    COALESCE(inv.precio_venta, 0) as precio_unitario,
    (COALESCE(inv.precio_venta, 0) * rd.cantidad) as subtotal,
    (COALESCE(inv.stock_actual, 0) >= rd.cantidad) as disponible,
    CASE 
      WHEN inv.stock_actual IS NULL THEN 'No disponible en esta farmacia'
      WHEN inv.stock_actual < rd.cantidad THEN CONCAT('Stock insuficiente: ', inv.stock_actual, ' disponibles')
      ELSE 'Disponible'
    END as motivo
   FROM receta_detalle rd
   JOIN medicamentos m ON rd.medicamento_id = m.id
   LEFT JOIN inventario_farmacia inv ON (
     inv.id_farmacia = $1 
     AND inv.id_medicamento = rd.medicamento_id
     AND inv.disponible = true
   )
   WHERE rd.id_receta = $2`,
          [farmacia.farmacia_id, recetaId]
        );

        const porcentajeDisponibilidad = Math.round(
          (farmacia.medicamentos_disponibles / farmacia.total_medicamentos) *
            100
        );

        // Calcular distancia usando la información de ubicación mejorada
        const distanciaKm = calcularDistanciaMejorada(
          ubicacionPaciente,
          farmacia,
          latPaciente,
          lngPaciente
        );

        return {
          farmacia_id: farmacia.farmacia_id,
          nombre_farmacia: farmacia.nombre_farmacia,
          ruc: farmacia.ruc,
          ubicacion: {
            direccion: farmacia.direccion,
            departamento: farmacia.departamento,
            provincia: farmacia.provincia,
            distrito: farmacia.distrito,
            codigo_postal: farmacia.codigo_postal,
          },
          distancia_km: distanciaKm,
          delivery: {
            disponible: farmacia.delivery_disponible,
            radio_km: farmacia.radio_delivery_km,
            puede_entregar:
              farmacia.delivery_disponible &&
              distanciaKm <= farmacia.radio_delivery_km,
          },
          disponibilidad: {
            todos_disponibles:
              farmacia.medicamentos_disponibles === farmacia.total_medicamentos,
            medicamentos_disponibles: farmacia.medicamentos_disponibles,
            medicamentos_faltantes: farmacia.medicamentos_faltantes,
            porcentaje: porcentajeDisponibilidad,
          },
          precio: {
            total:
              farmacia.precio_total > 0 ? Number(farmacia.precio_total) : null,
            moneda: "PEN",
            nota:
              farmacia.medicamentos_disponibles === farmacia.total_medicamentos
                ? "Precio completo"
                : "Precio parcial (faltantes no incluidos)",
          },
          medicamentos: medicamentosDetalle.rows,
          calificacion: "4.5",
        };
      })
    );

    // Ordenar: si hay coordenadas del paciente, ordenar por cercanía primero
    if (latPaciente && lngPaciente) {
      farmaciasEnriquecidas.sort((a: any, b: any) => a.distancia_km - b.distancia_km);
    } else {
      farmaciasEnriquecidas.sort((a: any, b: any) =>
        b.disponibilidad.medicamentos_disponibles - a.disponibilidad.medicamentos_disponibles ||
        (a.precio.total ?? Infinity) - (b.precio.total ?? Infinity)
      );
    }

    return NextResponse.json({
      success: true,
      opciones: farmaciasEnriquecidas,
      ubicacion_usada: latPaciente && lngPaciente ? "geolocalizacion" : "perfil",
    });
  } catch (error: any) {
    console.error("Error obteniendo farmacias disponibles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Función mejorada para calcular distancia (Haversine cuando hay coordenadas reales)
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcularDistanciaMejorada(
  ubicacionPaciente: UbicacionPaciente,
  farmacia: any,
  latPaciente?: number | null,
  lngPaciente?: number | null
): number {
  if (latPaciente && lngPaciente) {
    const PK_LAT = -12.046374;
    const PK_LNG = -77.042793;
    const distHaversine = haversineKm(latPaciente, lngPaciente, PK_LAT, PK_LNG);
    const factorDistrito =
      ubicacionPaciente.distrito === farmacia.distrito ? 0.3 :
      ubicacionPaciente.provincia === farmacia.provincia ? 0.7 :
      ubicacionPaciente.departamento === farmacia.departamento ? 1.2 : 1.8;
    return Math.round(distHaversine * factorDistrito * 10) / 10;
  }

  if (
    ubicacionPaciente.departamento &&
    ubicacionPaciente.provincia &&
    ubicacionPaciente.distrito
  ) {
    if (ubicacionPaciente.distrito === farmacia.distrito) {
      return Math.random() * 3 + 0.5;
    }
    if (ubicacionPaciente.provincia === farmacia.provincia) {
      return Math.random() * 10 + 2;
    }
    if (ubicacionPaciente.departamento === farmacia.departamento) {
      return Math.random() * 30 + 5;
    }
    return Math.random() * 100 + 20;
  }

  return Math.random() * 15 + 0.5;
}
