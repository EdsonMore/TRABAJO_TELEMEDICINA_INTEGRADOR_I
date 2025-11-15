// app/api/recetas/paciente/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  try {
    // Validar token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const usuario = await verificarToken(token);

    if (!usuario) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 403 }
      );
    }

    // ✅ PERMITIR tanto pacientes como médicos
    if (usuario.rol !== "paciente" && usuario.rol !== "medico") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta receta" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de receta requerido" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // ✅ Consulta adaptada para pacientes
    const result = await client.query(
      `
      SELECT 
        r.*,
        -- Información del paciente (verificar que es el dueño)
        p.id as paciente_id,
        p.dni,
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) as paciente_edad,
        p.tipo_sangre,
        p.sexo,
        -- Información del médico
        m.id as medico_id,
        um.nombre as medico_nombre,
        um.apellido as medico_apellido,
        m.numero_colegiatura,
        e.nombre as especialidad,
        -- Verificar que el paciente actual es el dueño de la receta
        CASE WHEN p.id_usuario = $2 THEN true ELSE false END as tiene_permiso,
        -- Medicamentos
        COALESCE(
          json_agg(
            json_build_object(
              'id', rd.id,
              'medicamento_id', rd.medicamento_id,
              'nombre_comercial', med.nombre_comercial,
              'nombre_generico', med.nombre_generico,
              'forma_farmaceutica', med.forma_farmaceutica,
              'concentracion', med.concentracion,
              'cantidad', rd.cantidad,
              'dosis', rd.dosis,
              'frecuencia', rd.frecuencia,
              'duracion_dias', rd.duracion_dias,
              'via_administracion', rd.via_administracion,
              'instrucciones_especiales', rd.instrucciones_especiales,
              'dispensado', rd.dispensado
            ) ORDER BY rd.created_at
          ) FILTER (WHERE rd.id IS NOT NULL), '[]'
        ) as medicamentos
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios up ON p.id_usuario = up.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios um ON m.id_usuario = um.id
      JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
      LEFT JOIN medicamentos med ON rd.medicamento_id = med.id
      WHERE r.id = $1
      GROUP BY r.id, p.id, up.id, m.id, um.id, e.id
      `,
      [id, usuario.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const receta = result.rows[0];

    // ✅ Verificar que el paciente tiene permisos sobre su propia receta
    if (!receta.tiene_permiso && usuario.rol === "paciente") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta receta" },
        { status: 403 }
      );
    }

    // Generar HTML para el PDF (usar la misma función que el otro endpoint)
    const htmlContent = generarHTMLReceta(receta);

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="receta_${receta.codigo_receta}.html"`,
      },
    });
  } catch (error: any) {
    console.error("Error generando PDF para paciente:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        detalles:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// ✅ CORRECCIÓN: Función mejorada con manejo de errores
function generarHTMLReceta(receta: any): string {
  try {
    const fechaEmision = receta.fecha_emision
      ? new Date(receta.fecha_emision).toLocaleDateString("es-PE")
      : "No especificada";

    const fechaVencimiento = receta.fecha_vencimiento
      ? new Date(receta.fecha_vencimiento).toLocaleDateString("es-PE")
      : "No especificada";

    // ✅ CORRECCIÓN: Manejo seguro de medicamentos
    const medicamentos = Array.isArray(receta.medicamentos)
      ? receta.medicamentos
      : [];

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receta Médica - ${receta.codigo_receta || "N/A"}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 30px;
            position: relative;
        }
        .header {
            text-align: center;
            border-bottom: 3px double #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
        }
        .header .codigo {
            font-size: 16px;
            color: #666;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background: #2563eb;
            color: white;
            padding: 8px 15px;
            margin-bottom: 15px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 16px;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }
        .info-item {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            color: #555;
            display: inline-block;
            width: 120px;
        }
        .medicamento {
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 6px;
            background: #f8fafc;
        }
        .medicamento-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        .medicamento-nombre {
            font-weight: bold;
            font-size: 16px;
            color: #1e40af;
        }
        .medicamento-datos {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 14px;
        }
        .instrucciones {
            background: #f1f5f9;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
            font-style: italic;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .firma {
            margin-top: 50px;
            border-top: 1px solid #333;
            width: 300px;
            text-align: center;
            padding-top: 10px;
            margin-left: auto;
            margin-right: auto;
        }
        .sello {
            text-align: right;
            font-size: 11px;
            color: #888;
            margin-top: 20px;
        }
        @media print {
            body { margin: 0; }
            .container { border: none; padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RECETA MÉDICA</h1>
            <div class="codigo">Código: ${receta.codigo_receta || "N/A"}</div>
            <div style="margin-top: 10px;">
                <strong>Fecha de Emisión:</strong> ${fechaEmision} | 
                <strong>Válido hasta:</strong> ${fechaVencimiento}
            </div>
        </div>

        <!-- Información del Médico -->
        <div class="section">
            <div class="section-title">INFORMACIÓN DEL MÉDICO PRESCRIPTOR</div>
            <div class="grid-2">
                <div class="info-item">
                    <span class="info-label">Médico:</span>
                    Dr. ${receta.medico_nombre || "N/A"} ${
      receta.medico_apellido || ""
    }
                </div>
                <div class="info-item">
                    <span class="info-label">Colegiatura:</span>
                    ${receta.numero_colegiatura || "N/A"}
                </div>
                <div class="info-item">
                    <span class="info-label">Especialidad:</span>
                    ${receta.especialidad || "No especificada"}
                </div>
            </div>
        </div>

        <!-- Información del Paciente -->
        <div class="section">
            <div class="section-title">INFORMACIÓN DEL PACIENTE</div>
            <div class="grid-2">
                <div class="info-item">
                    <span class="info-label">Paciente:</span>
                    ${receta.paciente_nombre || "N/A"} ${
      receta.paciente_apellido || ""
    }
                </div>
                <div class="info-item">
                    <span class="info-label">DNI:</span>
                    ${receta.dni || "N/A"}
                </div>
                <div class="info-item">
                    <span class="info-label">Edad:</span>
                    ${receta.paciente_edad || "N/A"} años
                </div>
                <div class="info-item">
                    <span class="info-label">Sexo:</span>
                    ${receta.sexo || "No especificado"}
                </div>
            </div>
        </div>

        <!-- Diagnóstico -->
        <div class="section">
            <div class="section-title">DIAGNÓSTICO PRINCIPAL</div>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 4px;">
                ${receta.diagnostico_principal_texto || "No especificado"}
            </div>
        </div>

        <!-- Observaciones -->
        ${
          receta.observaciones
            ? `
        <div class="section">
            <div class="section-title">OBSERVACIONES GENERALES</div>
            <div style="background: #fef3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #f59e0b;">
                ${receta.observaciones}
            </div>
        </div>
        `
            : ""
        }

        <!-- Medicamentos -->
        <div class="section">
            <div class="section-title">MEDICAMENTOS RECETADOS</div>
            ${
              medicamentos.length > 0
                ? medicamentos
                    .map(
                      (med: any) => `
                    <div class="medicamento">
                        <div class="medicamento-header">
                            <div class="medicamento-nombre">
                                ${med.nombre_comercial || "Medicamento"}
                                ${
                                  med.nombre_generico
                                    ? `<br><small>(${med.nombre_generico})</small>`
                                    : ""
                                }
                            </div>
                            <div style="font-size: 12px; color: ${
                              med.dispensado ? "#059669" : "#d97706"
                            };">
                                ${
                                  med.dispensado
                                    ? "✅ DISPENSADO"
                                    : "⏳ PENDIENTE"
                                }
                            </div>
                        </div>
                        <div class="medicamento-datos">
                            <div><strong>Dosis:</strong> ${
                              med.dosis || "No especificada"
                            }</div>
                            <div><strong>Frecuencia:</strong> ${
                              med.frecuencia || "No especificada"
                            }</div>
                            <div><strong>Duración:</strong> ${
                              med.duracion_dias || "N/A"
                            } días</div>
                            <div><strong>Cantidad:</strong> ${
                              med.cantidad || "N/A"
                            } unidades</div>
                            ${
                              med.via_administracion
                                ? `<div><strong>Vía:</strong> ${med.via_administracion}</div>`
                                : ""
                            }
                            ${
                              med.forma_farmaceutica
                                ? `<div><strong>Forma:</strong> ${med.forma_farmaceutica}</div>`
                                : ""
                            }
                        </div>
                        ${
                          med.instrucciones_especiales
                            ? `
                            <div class="instrucciones">
                                <strong>Instrucciones especiales:</strong> ${med.instrucciones_especiales}
                            </div>
                        `
                            : ""
                        }
                    </div>
                `
                    )
                    .join("")
                : '<p style="text-align: center; color: #666; padding: 20px;">No se registran medicamentos</p>'
            }
        </div>

        <!-- Firmas y sellos -->
        <div class="firma">
            <div>Firma y sello del médico</div>
        </div>

        <div class="sello">
            Documento generado electrónicamente<br>
            ${new Date().toLocaleString("es-PE")}<br>
            Código de verificación: ${receta.codigo_receta || "N/A"}
        </div>

        <div class="footer">
            <p><strong>MediLink+</strong> - Sistema de Gestión Médica</p>
            <p>Este documento es válido solo con el código de verificación correspondiente</p>
            ${
              receta.codigo_receta
                ? `<p>Para verificar esta receta: https://medilink.com/recetas/verificar/${receta.codigo_receta}</p>`
                : ""
            }
        </div>
    </div>
</body>
</html>
    `;
  } catch (error) {
    console.error("Error generando HTML:", error);
    return `
      <html>
        <body>
          <h1>Error generando receta</h1>
          <p>No se pudo generar el documento de la receta médica.</p>
        </body>
      </html>
    `;
  }
}
