const { WebSocketServer } = require('ws');

class WebRTCSignalingServer {
  constructor(port = 3002) {
    this.wss = new WebSocketServer({ port });
    this.rooms = new Map();
    this.setupWebSocket();
    console.log(`📡 WebSocket Signaling Server ejecutándose en puerto ${port}`);
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, request) => {
      console.log('✅ Nuevo cliente conectado al WebSocket Server');

      // Manejar mensajes
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid JSON format'
          }));
        }
      });

      // Manejar desconexión
      ws.on('close', () => {
        this.handleDisconnection(ws);
        console.log('❌ Cliente desconectado del WebSocket Server');
      });

      // Manejar errores
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Enviar mensaje de bienvenida
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Conectado al servidor de señalización WebRTC'
      }));
    });
  }

  handleMessage(ws, data) {
    const { type, roomId, userId, targetUserId, ...payload } = data;

    console.log(`📨 Mensaje tipo: ${type}, Sala: ${roomId}, Usuario: ${userId}`);

    switch (type) {
      case 'join-room':
        this.joinRoom(ws, roomId, userId, payload.userData);
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.relayMessage(roomId, userId, targetUserId, type, payload);
        break;

      case 'chat-message':
        // CHAT GLOBAL - Enviar a todos en la sala EXCEPTO al que envió
        console.log(`💬 Mensaje de chat de ${userId}: "${payload.message}"`);
        this.broadcastToRoom(roomId, userId, {
          type: 'chat-message',
          from: userId,
          message: payload.message,
          timestamp: new Date().toISOString(),
          userData: payload.userData
        });
        console.log(`💬 Mensaje de chat de ${userId} enviado a otros usuarios en sala ${roomId}`);
        break;

      case 'media-status':
        // Notificar cambios de estado de medios
        this.broadcastToRoom(roomId, null, {
          type: 'media-status',
          userId,
          mediaType: payload.mediaType,
          enabled: payload.enabled,
          userData: payload.userData
        });
        console.log(`🔊 Estado de media actualizado: ${payload.mediaType} ${payload.enabled ? 'ON' : 'OFF'}`);
        break;

      case 'user-action':
        this.broadcastToRoom(roomId, userId, {
          type: 'user-action',
          from: userId,
          action: payload.action,
          userData: payload.userData
        });
        break;

      default:
        console.warn('Tipo de mensaje desconocido:', type);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  joinRoom(ws, roomId, userId, userData) {
    // Crear sala si no existe
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
      console.log(`🏠 Nueva sala creada: ${roomId}`);
    }

    const room = this.rooms.get(roomId);

    // Guardar conexión del usuario
    room.set(userId, { ws, userData, connectedAt: new Date() });

    // Notificar a usuario que se unió
    ws.send(JSON.stringify({
      type: 'joined-room',
      roomId,
      userId,
      participants: Array.from(room.entries())
        .filter(([id]) => id !== userId)
        .map(([id, data]) => ({
          userId: id,
          userData: data.userData
        }))
    }));

    // Notificar a otros usuarios en la sala
    this.broadcastToRoom(roomId, userId, {
      type: 'user-joined',
      userId,
      userData,
      participants: Array.from(room.entries())
        .map(([id, data]) => ({
          userId: id,
          userData: data.userData
        }))
    });

    console.log(`👤 Usuario ${userId} se unió a sala ${roomId}. Participantes: ${room.size}`);
  }

  relayMessage(roomId, fromUserId, targetUserId, type, payload) {
    const room = this.rooms.get(roomId);
    if (!room) {
      console.warn(`Sala ${roomId} no encontrada`);
      return;
    }

    if (targetUserId) {
      // Mensaje dirigido a usuario específico
      const targetUser = room.get(targetUserId);
      if (targetUser && targetUser.ws.readyState === WebSocket.OPEN) {
        targetUser.ws.send(JSON.stringify({
          type,
          from: fromUserId,
          ...payload
        }));
        console.log(`📤 Mensaje ${type} enviado a ${targetUserId}`);
      } else {
        console.warn(`Usuario objetivo ${targetUserId} no encontrado o desconectado`);
      }
    } else {
      // Broadcast a todos excepto al remitente
      this.broadcastToRoom(roomId, fromUserId, {
        type,
        from: fromUserId,
        ...payload
      });
    }
  }

  broadcastToRoom(roomId, excludeUserId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    let sentCount = 0;
    room.forEach((userData, userId) => {
      // Si excludeUserId es null, enviar a todos. Si no, excluir ese usuario
      if ((excludeUserId === null || userId !== excludeUserId) && userData.ws.readyState === WebSocket.OPEN) {
        userData.ws.send(JSON.stringify(message));
        sentCount++;
      }
    });
    console.log(`📢 Broadcast enviado a ${sentCount} usuarios en sala ${roomId}`);
  }

  handleDisconnection(ws) {
    // Encontrar usuario desconectado en todas las salas
    for (const [roomId, room] of this.rooms.entries()) {
      for (const [userId, userData] of room.entries()) {
        if (userData.ws === ws) {
          room.delete(userId);
          console.log(`👋 Usuario ${userId} desconectado de sala ${roomId}`);

          // Notificar a otros usuarios
          this.broadcastToRoom(roomId, null, {
            type: 'user-left',
            userId,
            participants: Array.from(room.entries()).map(([id, data]) => ({
              userId: id,
              userData: data.userData
            }))
          });

          // Eliminar sala si está vacía
          if (room.size === 0) {
            this.rooms.delete(roomId);
            console.log(`🗑️ Sala ${roomId} eliminada (vacía)`);
          }
          return;
        }
      }
    }
  }
}

// Iniciar servidor si se ejecuta directamente
if (require.main === module) {
  const PORT = process.env.WS_PORT || 3002;
  new WebRTCSignalingServer(PORT);
}

module.exports = WebRTCSignalingServer;