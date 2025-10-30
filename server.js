// scripts/start-websocket.js - Debe usar WebRTCSignalingServer
const { createServer } = require("http");
const WebRTCSignalingServer = require("../lib/websocket-server");

const PORT = process.env.WS_PORT || 3002;

// Crear servidor HTTP para WebSocket
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket Server Running");
});

// Inicializar WebSocket Server
new WebRTCSignalingServer(server);

server.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`🚀 WebSocket Server ejecutándose en puerto ${PORT}`);
  console.log(`✅ WebSocket Server listo en puerto ${PORT}`);
});
