import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
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

    const {
      receta_id,
      farmacia_id,
      metodo_pago,
      monto,
      tipo_entrega,
      direccion_entrega,
      costo_entrega,
    } = await request.json();

    if (!receta_id || !farmacia_id || !metodo_pago || !monto) {
      return NextResponse.json(
        { error: "Parámetros requeridos faltantes" },
        { status: 400 }
      );
    }

    // Validar tipo de entrega si se proporciona
    if (
      tipo_entrega &&
      !["recojo", "domicilio"].includes(tipo_entrega)
    ) {
      return NextResponse.json(
        { error: "Tipo de entrega inválido" },
        { status: 400 }
      );
    }

    // Si es domicilio, requiere dirección
    if (
      tipo_entrega === "domicilio" &&
      (!direccion_entrega || !direccion_entrega.trim())
    ) {
      return NextResponse.json(
        { error: "Dirección requerida para envío a domicilio" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Verificar que la receta pertenece al paciente
    const recetaResult = await client.query(
      `SELECT r.id 
       FROM recetas r
       JOIN citas c ON r.id_cita = c.id
       JOIN pacientes p ON c.id_paciente = p.id
       WHERE r.id = $1 AND p.id_usuario = $2`,
      [receta_id, usuario.id]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada o no pertenece al paciente" },
        { status: 404 }
      );
    }

    // Verificar que la farmacia existe
    const farmaciaResult = await client.query(
      `SELECT id FROM farmacias WHERE id = $1`,
      [farmacia_id]
    );

    if (farmaciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Farmacia no encontrada" },
        { status: 404 }
      );
    }

    // IMPORTANTE: En una aplicación real, aquí se integraría con una pasarela de pagos
    // Por ahora, simulamos que todo pago es exitoso

    // Registrar el pago en la BD
    const pagoResult = await client.query(
      `INSERT INTO pagos (usuario_id, entidad_tipo, entidad_id, monto, metodo_pago, estado, referencia_pago, fecha_pago)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [
        usuario.id,
        "medicamento", // Las recetas son consideradas medicamentos en el contexto de pagos
        receta_id,
        monto,
        metodo_pago,
        "completado",
        `${metodo_pago.toUpperCase()}-${Date.now()}`,
      ]
    );

    const pagoId = pagoResult.rows[0].id;

    // Actualizar la receta con farmacia y estado_envio = 'enviada'
    // SOLO se actualiza después de pago exitoso
    // CRÍTICO: Usar farmacia_seleccionada_id (no id_farmacia_dispensadora)
    const updateResult = await client.query(
      `UPDATE recetas 
       SET farmacia_seleccionada_id = $1,
           fecha_envio_farmacia = NOW(),
           estado_envio = 'enviada',
           tipo_entrega = $3,
           direccion_entrega = $4,
           costo_entrega = $5
       WHERE id = $2
       RETURNING codigo_receta`,
      [
        farmacia_id,
        receta_id,
        tipo_entrega || "recojo",
        direccion_entrega || null,
        costo_entrega || 0,
      ]
    );

    const codigoReceta = updateResult.rows[0]?.codigo_receta || "Receta";

    // ===== CREAR NOTIFICACIÓN PARA LA FARMACIA =====
    try {
      // Obtener nombre del paciente
      const pacienteResult = await client.query(
        `SELECT u.nombre FROM pacientes p 
         JOIN usuarios u ON p.id_usuario = u.id 
         JOIN citas c ON p.id = c.id_paciente 
         JOIN recetas r ON r.id_cita = c.id 
         WHERE r.id = $1`,
        [receta_id]
      );

      const nombrePaciente =
        pacienteResult.rows[0]?.nombre || "Paciente desconocido";

      // Obtener id_usuario de la farmacia
      const farmaciaUsuarioResult = await client.query(
        `SELECT id_usuario FROM farmacias WHERE id = $1`,
        [farmacia_id]
      );

      if (farmaciaUsuarioResult.rows.length > 0) {
        const farmaciaUsuarioId = farmaciaUsuarioResult.rows[0].id_usuario;

        // Insertar notificación para la farmacia
        await client.query(
          `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
           VALUES ($1, $2, $3, 'receta_nueva', $4, false, NOW())
           RETURNING id`,
          [
            farmaciaUsuarioId,
            "📋 Nueva Receta Recibida",
            `Has recibido una nueva receta (${codigoReceta}) del paciente ${nombrePaciente}`,
            receta_id,
          ]
        );

        console.log("✅ Notificación de receta enviada a farmacia:", {
          farmaciaId: farmacia_id,
          recetaId: receta_id,
          codigoReceta,
          paciente: nombrePaciente,
        });
      }
    } catch (farmaciaNotifError: any) {
      console.error(
        "⚠️ Error al crear notificación para farmacia:",
        farmaciaNotifError
      );
      // No romper el flujo principal si falla la notificación
    }

    return NextResponse.json({
      success: true,
      message: "Pago procesado correctamente y receta enviada a farmacia",
      pago_id: pagoId,
      receta_id,
      metodo_pago,
      monto,
    });
  } catch (error: any) {
    console.error("Error procesando pago de receta:", error);
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
