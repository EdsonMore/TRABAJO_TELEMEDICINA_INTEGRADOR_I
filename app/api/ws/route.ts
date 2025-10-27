import { NextRequest } from "next/server";

// Esta ruta no se usará directamente, manejaremos WebSockets diferente
export async function GET(request: NextRequest) {
  return new Response("WebSocket endpoint", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
