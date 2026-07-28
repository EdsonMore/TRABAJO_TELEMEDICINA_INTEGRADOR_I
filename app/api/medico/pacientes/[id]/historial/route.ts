// app/api/medico/pacientes/[id]/historial/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🔍 Iniciando obtención de historial médico...");

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verificarToken(token);

    if (!payload || payload.rol !== "medico") {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    // ✅ CORREGIDO: Usar await y validar el ID
    const { id } = await params;
    const pacienteId = id;

    console.log("📋 Paciente ID recibido:", pacienteId);

    // Validar que el pacienteId sea un UUID válido
    if (
      !pacienteId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        pacienteId
      )
    ) {
      return NextResponse.json(
        { error: "ID de paciente inválido" },
        { status: 400 }
      );
    }

    // Verificar que el médico existe
    const medicoResult = await query(
      "SELECT id FROM medicos WHERE id_usuario = $1",
      [payload.userId]
    );
    if (medicoResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Médico no encontrado" },
        { status: 404 }
      );
    }

    const medicoId = medicoResult.rows[0].id;
    console.log("👨‍⚕️ Médico ID:", medicoId);

    // Requerir el parámetro de consulta `cita_id` para validar acceso temporal
    const url = new URL(request.url);
    const citaId = url.searchParams.get("cita_id");

    if (!citaId) {
      return NextResponse.json(
        { error: "Se requiere cita_id para acceder al historial" },
        { status: 400 }
      );
    }

    // ✅ Si es cita temporal (comienza con "temp-"), permitir acceso directo
    // Sin validar en BD
    const esTemportal = citaId.startsWith("temp-");
    
    if (!esTemportal) {
      // Verificar que la cita pertenece al médico y al paciente (solo si es real en BD)
      const citaResult = await query(
        "SELECT id, fecha_cita FROM citas WHERE id = $1 AND id_medico = $2 AND id_paciente = $3",
        [citaId, medicoId, pacienteId]
      );

      if (citaResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Cita no encontrada o no autorizada" },
          { status: 403 }
        );
      }

      // Parsear fecha de forma segura (formato "YYYY-MM-DD" de BD)
      const fechaCitaRaw = citaResult.rows[0].fecha_cita;
      const fechaCitaStr = typeof fechaCitaRaw === 'string' 
        ? fechaCitaRaw 
        : new Date(fechaCitaRaw).toISOString().split('T')[0];
      
      const [año, mes, día] = fechaCitaStr.split("-").map(Number);
      const fechaCita = new Date(año, mes - 1, día);
      
      const ahora = new Date();
      ahora.setHours(0, 0, 0, 0);
      fechaCita.setHours(0, 0, 0, 0);

      // Acceso permitido:
      // 1. ANTES de la cita (para revisar antecedentes del paciente)
      // 2. DESPUÉS de la cita durante 7 días
      const diffMs = ahora.getTime() - fechaCita.getTime();
      const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;

      // Si la cita ya pasó más de 7 días, rechazar
      if (diffMs > sieteDiasMs) {
        return NextResponse.json(
          { error: "El acceso al historial de este paciente expiró para esta cita" },
          { status: 403 }
        );
      }
      // Si no, permitir (cita futura o dentro de 7 días después)
    }

    // Obtener información básica del paciente
    const pacienteResult = await query(
      `
      SELECT 
        p.*, 
        u.nombre, u.apellido, u.email, u.telefono, u.avatar_url,
        ub.departamento, ub.provincia, ub.distrito
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id
      LEFT JOIN ubicaciones ub ON p.id_ubicacion = ub.id
      WHERE p.id = $1
      `,
      [pacienteId]
    );

    if (pacienteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const paciente = pacienteResult.rows[0];
    console.log("✅ Paciente encontrado:", paciente.nombre, paciente.apellido);

    // Obtener historial de citas con todos los médicos
    const citasResult = await query(
      `
      SELECT 
        c.*,
        u_medico.nombre as medico_nombre, u_medico.apellido as medico_apellido,
        e.nombre as especialidad_nombre
      FROM citas c
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios u_medico ON m.id_usuario = u_medico.id
      JOIN especialidades e ON m.id_especialidad = e.id
      WHERE c.id_paciente = $1
      ORDER BY c.fecha_cita DESC, c.hora_cita DESC
      `,
      [pacienteId]
    );

    // Obtener recetas del paciente CON MEDICAMENTOS DESGLOSADOS
    const recetasResult = await query(
      `
      SELECT 
        r.*,
        c.fecha_cita,
        u_medico.nombre as medico_nombre, u_medico.apellido as medico_apellido
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios u_medico ON m.id_usuario = u_medico.id
      WHERE c.id_paciente = $1
      ORDER BY r.fecha_emision DESC
      `,
      [pacienteId]
    );

    // Obtener medicamentos detallados para cada receta
    let recetasConMedicamentos = [];
    for (const receta of recetasResult.rows) {
      const medicamentosResult = await query(
        `
        SELECT 
          rd.id, rd.medicamento_id, rd.cantidad, rd.dosis, rd.frecuencia, 
          rd.duracion_dias, rd.via_administracion, rd.instrucciones_especiales,
          m.nombre_comercial, m.nombre_generico, m.forma_farmaceutica, 
          m.concentracion, m.laboratorio, m.principio_activo
        FROM receta_detalle rd
        JOIN medicamentos m ON rd.medicamento_id = m.id
        WHERE rd.id_receta = $1
        `,
        [receta.id]
      );
      recetasConMedicamentos.push({
        ...receta,
        medicamentos: medicamentosResult.rows,
      });
    }

    // Obtener resultados de laboratorio
    const resultadosResult = await query(
      `
      SELECT 
        se.*,
        c.fecha_cita,
        u_medico.nombre as medico_nombre, u_medico.apellido as medico_apellido,
        lab.nombre_comercial as laboratorio_nombre
      FROM solicitudes_examenes se
      JOIN citas c ON se.id_cita = c.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios u_medico ON m.id_usuario = u_medico.id
      LEFT JOIN laboratorios lab ON se.id_laboratorio = lab.id
      WHERE c.id_paciente = $1
      ORDER BY se.fecha_solicitud DESC
      `,
      [pacienteId]
    );

    // Calcular edad
    const fechaNacimiento = new Date(paciente.fecha_nacimiento);
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();

    const historial = {
      paciente: {
        id: paciente.id,
        usuario: {
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          email: paciente.email,
          telefono: paciente.telefono,
          avatar_url: paciente.avatar_url,
        },
        informacion_personal: {
          dni: paciente.dni,
          edad: edad,
          sexo: paciente.sexo,
          tipo_sangre: paciente.tipo_sangre,
          direccion: paciente.direccion,
          ubicacion: {
            departamento: paciente.departamento,
            provincia: paciente.provincia,
            distrito: paciente.distrito,
          },
        },
        informacion_medica: {
          peso_kg: paciente.peso_kg,
          altura_cm: paciente.altura_cm,
          alergias: paciente.alergias,
          enfermedades_cronicas: paciente.enfermedades_cronicas,
          seguro_medico: paciente.seguro_medico,
          numero_seguro: paciente.numero_seguro,
          contacto_emergencia: {
            nombre: paciente.contacto_emergencia_nombre,
            telefono: paciente.contacto_emergencia_telefono,
          },
        },
      },
      historial_citas: citasResult.rows.map((cita: any) => ({
        id: cita.id,
        fecha_cita: cita.fecha_cita,
        hora_cita: cita.hora_cita,
        tipo_cita: cita.tipo_cita,
        estado: cita.estado,
        motivo_consulta: cita.motivo_consulta,
        diagnostico: cita.diagnostico,
        tratamiento: cita.tratamiento,
        observaciones_medico: cita.observaciones_medico,
        costo: cita.costo,
        medico: {
          nombre: cita.medico_nombre,
          apellido: cita.medico_apellido,
          especialidad: cita.especialidad_nombre,
        },
      })),
      recetas: recetasConMedicamentos.map((receta) => ({
        id: receta.id,
        codigo_receta: receta.codigo_receta,
        fecha_emision: receta.fecha_emision,
        fecha_vencimiento: receta.fecha_vencimiento,
        estado: receta.estado,
        medicamentos: receta.medicamentos,
        fecha_cita: receta.fecha_cita,
        medico: {
          nombre: receta.medico_nombre,
          apellido: receta.medico_apellido,
        },
      })),
      examenes_laboratorio: resultadosResult.rows.map((examen: any) => ({
        id: examen.id,
        codigo_solicitud: examen.codigo_solicitud,
        fecha_solicitud: examen.fecha_solicitud,
        estado: examen.estado,
        fecha_cita: examen.fecha_cita,
        laboratorio: examen.laboratorio_nombre,
        medico: {
          nombre: examen.medico_nombre,
          apellido: examen.medico_apellido,
        },
      })),
    };

    console.log("✅ Historial generado exitosamente");
    return NextResponse.json(historial);
  } catch (error) {
    console.error("❌ Error obteniendo historial del paciente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
