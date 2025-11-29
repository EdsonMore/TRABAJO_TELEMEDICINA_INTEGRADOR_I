// app/api/paciente/recetas/[id]/historial/route.ts
// MediLink+ - API para obtener historial de cambios de estado de una receta
// Proporciona tracking detallado para el paciente

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verificarToken(token);

    if (!payload || payload.rol !== "paciente") {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    const { id: recetaId } = await params;

    client = await pool.connect();

    // Obtener ID del paciente
    const pacienteResult = await client.query(
      "SELECT id FROM pacientes WHERE id_usuario = $1",
      [payload.userId]
    );

    if (pacienteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const pacienteId = pacienteResult.rows[0].id;

    // Verificar que la receta pertenece al paciente
    const recetaResult = await client.query(
      `SELECT r.id, r.codigo_receta, r.estado, r.estado_envio, r.tipo_entrega,
              r.direccion_entrega, r.costo_entrega, r.fecha_emision,
              f.nombre_comercial as farmacia_nombre
       FROM recetas r
       JOIN citas c ON r.id_cita = c.id
       LEFT JOIN farmacias f ON r.farmacia_seleccionada_id = f.id
       WHERE r.id = $1 AND c.id_paciente = $2`,
      [recetaId, pacienteId]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada o no pertenece al paciente" },
        { status: 404 }
      );
    }

    const receta = recetaResult.rows[0];

    // Obtener historial completo de cambios ordenado cronológicamente
    const historialResult = await client.query(
      `SELECT 
        h.id,
        h.estado_anterior,
        h.estado_nuevo,
        h.fecha_cambio,
        h.descripcion,
        h.detalles,
        h.notificado,
        f.nombre_comercial as farmacia_nombre,
        u.nombre as usuario_nombre,
        u.apellido as usuario_apellido,
        u.rol as usuario_rol
       FROM historial_cambios_estado_receta h
       LEFT JOIN farmacias f ON h.farmacia_id = f.id
       LEFT JOIN usuarios u ON h.usuario_id = u.id
       WHERE h.receta_id = $1
       ORDER BY h.fecha_cambio ASC`,
      [recetaId]
    );

    // Formatear historial para respuesta
    const historial = historialResult.rows.map((item: any) => ({
      id: item.id,
      fecha: item.fecha_cambio,
      estado_anterior: item.estado_anterior,
      estado_nuevo: item.estado_nuevo,
      descripcion: item.descripcion || getDescripcionEstado(item.estado_nuevo),
      farmacia: item.farmacia_nombre,
      usuario: item.usuario_nombre
        ? `${item.usuario_nombre} ${item.usuario_apellido}`
        : null,
      usuario_rol: item.usuario_rol,
      detalles: item.detalles || {},
      notificado: item.notificado,
    }));

    // Calcular estadísticas del proceso
    const tiempos = calcularTiemposEstados(historialResult.rows);

    return NextResponse.json({
      success: true,
      receta: {
        id: receta.id,
        codigo_receta: receta.codigo_receta,
        estado_actual: receta.estado_envio || receta.estado,
        farmacia: receta.farmacia_nombre,
        tipo_entrega: receta.tipo_entrega,
        direccion_entrega: receta.direccion_entrega,
        costo_entrega: receta.costo_entrega,
        fecha_emision: receta.fecha_emision,
      },
      historial,
      estadisticas: {
        total_cambios: historial.length,
        tiempo_total:
          historial.length > 0
            ? calcularDiferenciaTiempo(
                historial[0].fecha,
                historial[historial.length - 1].fecha
              )
            : null,
        tiempos_por_estado: tiempos,
      },
    });
  } catch (error) {
    console.error("Error obteniendo historial de receta:", error);
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

// Funciones auxiliares
function getDescripcionEstado(estado: string): string {
  const descripciones: Record<string, string> = {
    enviada: "Receta enviada a farmacia",
    recibida: "Farmacia aceptó la receta",
    en_proceso: "Farmacia está preparando los medicamentos",
    dispensada: "Medicamentos listos para entrega",
    rechazada: "Farmacia rechazó la receta",
  };
  return descripciones[estado] || "Estado actualizado";
}

function calcularTiemposEstados(historial: any[]): Record<string, string> {
  const tiempos: Record<string, string> = {};

  for (let i = 0; i < historial.length - 1; i++) {
    const actual = historial[i];
    const siguiente = historial[i + 1];

    const tiempo = calcularDiferenciaTiempo(
      actual.fecha_cambio,
      siguiente.fecha_cambio
    );
    tiempos[actual.estado_nuevo] = tiempo;
  }

  return tiempos;
}

function calcularDiferenciaTiempo(
  fechaInicio: Date | string,
  fechaFin: Date | string
): string {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diffMs = fin.getTime() - inicio.getTime();

  const minutos = Math.floor(diffMs / (1000 * 60));
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (dias > 0) {
    return `${dias} día${dias !== 1 ? "s" : ""}`;
  } else if (horas > 0) {
    return `${horas} hora${horas !== 1 ? "s" : ""}`;
  } else if (minutos > 0) {
    return `${minutos} minuto${minutos !== 1 ? "s" : ""}`;
  } else {
    return "menos de 1 minuto";
  }
}
