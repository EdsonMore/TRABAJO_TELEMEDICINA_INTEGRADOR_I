// app/api/recetas/crear/route.ts - VERSIÓN COMPLETAMENTE CORREGIDA
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let client;
  try {
    // ===== 1. VERIFICAR AUTENTICACIÓN =====
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "medico") {
      return NextResponse.json(
        { error: "Acceso denegado. Solo médicos pueden crear recetas." },
        { status: 403 }
      );
    }

    // ===== 2. OBTENER DATOS DEL BODY =====
    const body = await request.json();
    console.log("📝 Datos de receta recibida:", {
      id_cita: body.id_cita,
      medicamentos: body.medicamentos?.length,
      diagnostico: body.diagnostico_principal_texto?.substring(0, 50),
    });

    const {
      id_cita,
      diagnostico_principal_id,
      diagnostico_principal_texto,
      diagnosticos_secundarios = [],
      observaciones = "",
      fecha_vencimiento,
      medicamentos = [],
      firma_medico,
    } = body;

    // ===== 3. VALIDACIONES =====
    if (!id_cita) {
      return NextResponse.json(
        { error: "ID de cita es requerido" },
        { status: 400 }
      );
    }

    if (!diagnostico_principal_texto || !diagnostico_principal_texto.trim()) {
      return NextResponse.json(
        { error: "Diagnóstico principal es requerido" },
        { status: 400 }
      );
    }

    if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
      return NextResponse.json(
        { error: "Debe incluir al menos un medicamento" },
        { status: 400 }
      );
    }

    // Validar medicamentos
    for (let i = 0; i < medicamentos.length; i++) {
      const med = medicamentos[i];
      if (!med.medicamento_id) {
        return NextResponse.json(
          {
            error: `Medicamento ${i + 1}: ID de medicamento es requerido`,
          },
          { status: 400 }
        );
      }
      if (!med.dosis || !med.dosis.trim()) {
        return NextResponse.json(
          { error: `Medicamento ${i + 1}: Dosis es requerida` },
          { status: 400 }
        );
      }
      if (!med.frecuencia || !med.frecuencia.trim()) {
        return NextResponse.json(
          { error: `Medicamento ${i + 1}: Frecuencia es requerida` },
          { status: 400 }
        );
      }
      if (!med.cantidad || med.cantidad < 1) {
        return NextResponse.json(
          { error: `Medicamento ${i + 1}: Cantidad inválida` },
          { status: 400 }
        );
      }
    }

    // ===== 4. CONECTAR A BD Y VALIDAR CITA =====
    client = await pool.connect();
    await client.query("BEGIN");

    // Obtener ID del médico del usuario autenticado
    const medicoResult = await client.query(
      "SELECT id FROM medicos WHERE id_usuario = $1",
      [usuario.id]
    );

    if (medicoResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Médico no encontrado" },
        { status: 404 }
      );
    }

    const medicoId = medicoResult.rows[0].id;

    // Verificar que la cita pertenece a este médico y obtener datos del paciente
    const citaResult = await client.query(
      "SELECT id, id_paciente, estado FROM citas WHERE id = $1 AND id_medico = $2",
      [id_cita, medicoId]
    );

    if (citaResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Cita no encontrada o no autorizada" },
        { status: 404 }
      );
    }

    const cita = citaResult.rows[0];
    const pacienteId = cita.id_paciente;

    // ===== 5. GENERAR CÓDIGO DE RECETA (VERSIÓN CORTA) =====
    const fechaHoy = new Date();
    const año = fechaHoy.getFullYear();
    const mes = String(fechaHoy.getMonth() + 1).padStart(2, "0");
    const dia = String(fechaHoy.getDate()).padStart(2, "0");

    // Código corto que cabe en VARCHAR(20)
    const timestamp = Date.now().toString().slice(-6);
    const codigoReceta = `REC-${año}${mes}${dia}-${timestamp}`;

    console.log("✅ Código de receta generado:", codigoReceta);
    console.log("📏 Longitud del código:", codigoReceta.length);

    // ===== 6. CALCULAR FECHA DE VENCIMIENTO =====
    let fechaVencimiento = fecha_vencimiento;
    if (!fechaVencimiento) {
      const fechaVenc = new Date(fechaHoy);
      fechaVenc.setDate(fechaVenc.getDate() + 30); // 30 días por defecto
      fechaVencimiento = fechaVenc.toISOString().split("T")[0];
    }

    console.log("📅 Fecha de vencimiento:", fechaVencimiento);

    // ===== 7. INSERTAR RECETA =====
    const recetaInsertResult = await client.query(
      `INSERT INTO recetas (
        id_cita,
        codigo_receta,
        diagnostico_principal_id,
        diagnostico_principal_texto,
        diagnosticos_secundarios,
        observaciones,
        fecha_emision,
        fecha_vencimiento,
        estado,
        firma_medico
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING id, codigo_receta, fecha_emision`,
      [
        id_cita,
        codigoReceta,
        diagnostico_principal_id || null,
        diagnostico_principal_texto,
        JSON.stringify(diagnosticos_secundarios),
        observaciones,
        fechaHoy.toISOString().split("T")[0],
        fechaVencimiento,
        "activa",
        firma_medico || null,
      ]
    );

    const receta = recetaInsertResult.rows[0];
    const recetaId = receta.id;

    console.log("✅ Receta creada con ID:", recetaId);

    // ===== 8. INSERTAR DETALLES DE MEDICAMENTOS =====
    console.log("💊 Insertando detalles de medicamentos...");
    for (let i = 0; i < medicamentos.length; i++) {
      const med = medicamentos[i];

      console.log(`  Medicamento ${i + 1}:`, {
        medicamento_id: med.medicamento_id,
        dosis: med.dosis,
        frecuencia: med.frecuencia,
        cantidad: med.cantidad,
      });

      try {
        const detalleResult = await client.query(
          `INSERT INTO receta_detalle (
            id_receta,
            medicamento_id,
            cantidad,
            dosis,
            frecuencia,
            duracion_dias,
            via_administracion,
            instrucciones_especiales
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          )
          RETURNING id`,
          [
            recetaId,
            med.medicamento_id,
            med.cantidad,
            med.dosis,
            med.frecuencia,
            med.duracion_dias || 7,
            med.via_administracion || "Oral",
            med.instrucciones_especiales || "",
          ]
        );

        console.log(`✅ Detalle ${i + 1} insertado:`, detalleResult.rows[0].id);
      } catch (detailError: any) {
        console.error(`❌ Error insertando medicamento ${i + 1}:`, detailError);
        throw new Error(
          `Error al insertar medicamento ${i + 1}: ${detailError.message}`
        );
      }
    }

    // ===== 9. CREAR NOTIFICACIÓN PARA EL PACIENTE =====
    try {
      const pacienteUserResult = await client.query(
        "SELECT id_usuario FROM pacientes WHERE id = $1",
        [pacienteId]
      );

      if (pacienteUserResult.rows.length > 0) {
        const usuarioIdPaciente = pacienteUserResult.rows[0].id_usuario;

        await client.query(
          `INSERT INTO notificaciones (
            usuario_id,
            titulo,
            mensaje,
            tipo,
            entidad_relacionada,
            id_entidad,
            fecha_creacion
          ) VALUES (
            $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
          )`,
          [
            usuarioIdPaciente,
            "Nueva Receta Médica",
            `Tu médico ha emitido una nueva receta. Código: ${codigoReceta}`,
            "receta",
            "receta",
            recetaId,
          ]
        );

        console.log("✅ Notificación creada para paciente");
      }
    } catch (notifError) {
      console.warn("⚠️ Error al crear notificación:", notifError);
      // No romper la transacción por error de notificación
    }

    // ===== 10. CONFIRMAR TRANSACCIÓN =====
    await client.query("COMMIT");

    console.log("🎉 Receta creada exitosamente:", {
      id: recetaId,
      codigo: codigoReceta,
      medicamentos: medicamentos.length,
    });

    return NextResponse.json({
      success: true,
      message: "Receta creada exitosamente",
      receta: {
        id: recetaId,
        codigo_receta: receta.codigo_receta,
        fecha_emision: receta.fecha_emision,
        fecha_vencimiento: fechaVencimiento,
        estado: "activa",
        total_medicamentos: medicamentos.length,
      },
    });
  } catch (error: any) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error en ROLLBACK:", rollbackError);
      }
    }

    console.error("❌ Error creando receta:", error);

    // Manejar errores específicos de DB
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe una receta con este código" },
        { status: 409 }
      );
    }

    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Referencia inválida: medicamento o cita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Error interno al crear receta",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
