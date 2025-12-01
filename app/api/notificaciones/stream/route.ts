// app/api/notificaciones/stream/route.ts
// Endpoint para notificaciones en TIEMPO REAL usando Server-Sent Events (SSE)
// Versión simplificada sin ReadableStream (problemas con NextJS)

import { type NextRequest } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Obtener token de query param
    const token = request.nextUrl.searchParams.get("token");
    
    if (!token) {
      return new Response("Token requerido", { status: 401 });
    }

    const payload = await verificarToken(token);
    if (!payload) {
      return new Response("Token inválido", { status: 401 });
    }

    const usuarioId = payload.id || payload.userId;
    console.log(`📡 Cliente SSE conectado: ${usuarioId}`);

    // Almacenar notificaciones ya enviadas
    const notificacionesEnviadas = new Set<string>();

    // Función para generar evento SSE
    const generarEvento = (datos: any) => {
      return `data: ${JSON.stringify(datos)}\n\n`;
    };

    // Crear respuesta con streaming
    let contador = 0;
    const maxTiempoSegundos = 25; // NextJS timeout típico es 30s
    const startTime = Date.now();

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          // Enviar comentario inicial (ping)
          controller.enqueue(new TextEncoder().encode(": conectado\n\n"));

          // Poll cada 2 segundos
          const pollInterval = setInterval(async () => {
            const elapsed = (Date.now() - startTime) / 1000;

            // Si pasó mucho tiempo, cerrar conexión y forzar reconexión
            if (elapsed > maxTiempoSegundos) {
              console.log(`⏱️ Cerrando SSE por timeout para ${usuarioId}`);
              clearInterval(pollInterval);
              controller.close();
              return;
            }

            try {
              const client = await pool.connect();
              try {
                // Obtener última notificación NO LEÍDA
                const result = await client.query(
                  `SELECT id, titulo, mensaje, tipo, id_relacionado, created_at
                   FROM notificaciones
                   WHERE id_usuario = $1 AND leida = false
                   ORDER BY created_at DESC
                   LIMIT 1`,
                  [usuarioId]
                );

                if (result.rows.length > 0) {
                  const notif = result.rows[0];

                  // Deduplicar
                  if (!notificacionesEnviadas.has(notif.id)) {
                    notificacionesEnviadas.add(notif.id);

                    const evento = generarEvento({
                      id: notif.id,
                      titulo: notif.titulo,
                      mensaje: notif.mensaje,
                      tipo: notif.tipo,
                      id_relacionado: notif.id_relacionado,
                      created_at: notif.created_at,
                    });

                    controller.enqueue(new TextEncoder().encode(evento));
                    console.log(`📨 Notificación enviada a ${usuarioId}:`, notif.titulo);
                  }
                }
              } finally {
                client.release();
              }
            } catch (error) {
              console.error("Error en poll:", error);
            }
          }, 2000);

          // Cleanup en abort
          request.signal.addEventListener("abort", () => {
            clearInterval(pollInterval);
            controller.close();
            console.log(`❌ SSE abortado: ${usuarioId}`);
          });
        } catch (error) {
          console.error("Error en start:", error);
          controller.close();
        }
      },
    });

    return new Response(responseStream as any, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("❌ Error SSE:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
