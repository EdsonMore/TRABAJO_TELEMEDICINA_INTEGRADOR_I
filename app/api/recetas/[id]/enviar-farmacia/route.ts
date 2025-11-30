// app/api/recetas/[id]/enviar-farmacia/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(
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
    const body = await request.json();
    const { farmacia_id, tipo_entrega, direccion_entrega, costo_entrega } =
      body;

    if (!recetaId || !farmacia_id) {
      return NextResponse.json(
        { error: "ID de receta y farmacia son requeridos" },
        { status: 400 }
      );
    }

    // Validar tipo de entrega
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
      `SELECT r.* 
       FROM recetas r
       JOIN citas c ON r.id_cita = c.id
       JOIN pacientes p ON c.id_paciente = p.id
       WHERE r.id = $1 AND p.id_usuario = $2`,
      [recetaId, usuario.id]
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

    // Actualizar receta con la farmacia seleccionada y opciones de entrega
    // Nota: estado debe permanecer como 'activa', solo se actualiza estado_envio a 'enviada'
    // CRÍTICO: Usar farmacia_seleccionada_id (no id_farmacia_dispensadora)
    await client.query(
      `UPDATE recetas 
       SET farmacia_seleccionada_id = $1,
           fecha_envio_farmacia = NOW(),
           estado_envio = 'enviada',
           tipo_entrega = $2,
           direccion_entrega = $3,
           costo_entrega = $4
       WHERE id = $5`,
      [
        farmacia_id,
        tipo_entrega || "recojo",
        direccion_entrega || null,
        costo_entrega || 0,
        recetaId,
      ]
    );

    // Crear notificación para el paciente directamente en BD
    try {
      const recetaData = recetaResult.rows[0];
      const codigoReceta = recetaData.codigo_receta;
      const pacienteId = recetaData.paciente_id;

      // Obtener usuario_id del paciente
      const usuarioIdResult = await pool.query(
        "SELECT id_usuario FROM pacientes WHERE id = $1",
        [pacienteId]
      );

      if (usuarioIdResult.rows.length > 0) {
        const usuarioId = usuarioIdResult.rows[0].id_usuario;
        const titulo = "🏥 Receta Lista en Farmacia";
        const mensaje = `Tu receta (${codigoReceta}) está lista para retirar en la farmacia`;

        const notifResult = await pool.query(
          `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
           VALUES ($1, $2, $3, 'farmacia', $4, false, NOW())
           RETURNING id`,
          [usuarioId, titulo, mensaje, recetaId]
        );

        console.log("✅ Notificación de receta en farmacia creada:", {
          id: notifResult.rows[0].id,
          titulo,
        });
      }
    } catch (notifError) {
      console.error("❌ Error al crear notificación:", notifError);
      // No fallar la operación si la notificación falla
    }

    return NextResponse.json({
      success: true,
      message: "Receta enviada a la farmacia correctamente",
    });
  } catch (error: any) {
    console.error("Error enviando receta a farmacia:", error);
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
