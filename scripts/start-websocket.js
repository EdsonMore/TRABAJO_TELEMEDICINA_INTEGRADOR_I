// scripts/start-websocket.js
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 3002 });

console.log('🚀 WebSocket Server ejecutándose en puerto 3002');

const rooms = new Map();

wss.on('connection', function connection(ws) {
    console.log('✅ Nuevo cliente conectado al WebSocket Server');

    ws.on('message', function message(data) {
        try {
            const parsed = JSON.parse(data);
            console.log('📨 Mensaje recibido:', parsed.type, 'Sala:', parsed.roomId);

            const { type, roomId, userId, targetUserId, ...payload } = parsed;

            switch (type) {
                case 'join-room':
                    if (!rooms.has(roomId)) {
                        rooms.set(roomId, new Map());
                        console.log(`🏠 Nueva sala creada: ${roomId}`);
                    }

                    const room = rooms.get(roomId);
                    room.set(userId, { ws, userData: payload.userData });

                    // Notificar al usuario que se unió
                    ws.send(JSON.stringify({
                        type: 'joined-room',
                        roomId,
                        userId,
                        participants: Array.from(room.entries()).map(([id, data]) => ({
                            userId: id,
                            userData: data.userData
                        }))
                    }));

                    // Notificar a otros usuarios
                    broadcastToRoom(roomId, userId, {
                        type: 'user-joined',
                        userId,
                        userData: payload.userData,
                        participants: Array.from(room.entries()).map(([id, data]) => ({
                            userId: id,
                            userData: data.userData
                        }))
                    });
                    break;

                case 'offer':
                case 'answer':
                case 'ice-candidate':
                    relayToUser(roomId, userId, targetUserId, type, payload);
                    break;

                case 'chat-message':
                    broadcastToRoom(roomId, userId, {
                        type: 'chat-message',
                        from: userId,
                        message: payload.message,
                        timestamp: new Date().toISOString(),
                        userData: payload.userData
                    });
                    break;

                default:
                    // Reenviar a todos los demás en la misma sala
                    broadcastToRoom(roomId, userId, parsed);
            }
        } catch (error) {
            console.error('❌ Error procesando mensaje:', error);
        }
    });

    ws.on('close', function close() {
        console.log('❌ Cliente desconectado');
        // Limpiar salas
        for (const [roomId, room] of rooms.entries()) {
            for (const [userId, userData] of room.entries()) {
                if (userData.ws === ws) {
                    room.delete(userId);
                    console.log(`👋 Usuario ${userId} removido de sala ${roomId}`);

                    // Notificar a otros
                    broadcastToRoom(roomId, userId, {
                        type: 'user-left',
                        userId
                    });

                    // Eliminar sala vacía
                    if (room.size === 0) {
                        rooms.delete(roomId);
                        console.log(`🗑️ Sala ${roomId} eliminada`);
                    }
                    break;
                }
            }
        }
    });

    ws.on('error', function error(err) {
        console.error('❌ WebSocket error:', err);
    });

    // Mensaje de bienvenida
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Conectado al servidor de señalización WebRTC'
    }));
});

function broadcastToRoom(roomId, excludeUserId, message) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.forEach((userData, userId) => {
        if (userId !== excludeUserId && userData.ws.readyState === 1) { // 1 = OPEN
            userData.ws.send(JSON.stringify(message));
        }
    });
}

function relayToUser(roomId, fromUserId, targetUserId, type, payload) {
    const room = rooms.get(roomId);
    if (!room) return;

    const targetUser = room.get(targetUserId);
    if (targetUser && targetUser.ws.readyState === 1) {
        targetUser.ws.send(JSON.stringify({
            type,
            from: fromUserId,
            ...payload
        }));
    }
}

console.log('✅ WebSocket Server listo en puerto 3002');