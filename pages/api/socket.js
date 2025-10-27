// pages/api/socket.js
import { configureSocketServer } from '@/lib/socketServer';

export default function SocketHandler(req, res) {
    if (res.socket.server.io) {
        console.log('Socket ya está ejecutándose');
    } else {
        console.log('Inicializando socket server...');
        const io = configureSocketServer(res.socket.server);
        res.socket.server.io = io;
    }
    res.end();
}