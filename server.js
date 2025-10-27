const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebRTCSignalingServer = require('./lib/websocket-server');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3001;

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    // Inicializar WebSocket Server
    const signalingServer = new WebRTCSignalingServer(server);

    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
        console.log(`📡 WebSocket Signaling Server activo en puerto ${PORT}`);
    });
});