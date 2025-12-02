// hooks/useWebRTC.js
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

export const useWebRTC = (roomId, userData) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [streamInitialized, setStreamInitialized] = useState(false);
  const [mediaState, setMediaState] = useState({
    audio: true,
    video: true,
  });
  const [errors, setErrors] = useState([]);
  const [sessionEnded, setSessionEnded] = useState(false);

  const peerConnections = useRef(new Map());
  const localStreamRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isCleaningUp = useRef(false);

  // Configuración WebRTC mejorada con useMemo
  const rtcConfig = useMemo(
    () => ({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    }),
    []
  );

  // Función para agregar errores
  const addError = useCallback((error) => {
    console.error("WebRTC Error:", error);
    setErrors((prev) => [
      ...prev.slice(-9),
      {
        timestamp: new Date(),
        message: error.message || String(error),
        type: error.name || "UnknownError",
      },
    ]);
  }, []);

  // Determinar si se debe reconectar
  const shouldReconnect = useCallback((closeEvent) => {
    // No reconectar si fue cierre intencional o limpieza
    if (closeEvent.code === 1000 || isCleaningUp.current) return false;

    // No reconectar si el usuario salió de la sala
    if (closeEvent.code === 4001) return false; // Código personalizado para salida

    return reconnectAttempts.current < maxReconnectAttempts;
  }, []);

  // Limpiar recursos - MOVIDA AL INICIO
  const cleanup = useCallback(() => {
    console.log("🧹 Iniciando limpieza de recursos...");
    isCleaningUp.current = true;

    // Cerrar conexiones peer
    peerConnections.current.forEach((pc, userId) => {
      try {
        pc.close();
      } catch (error) {
        console.error("Error cerrando peer connection:", error);
      }
    });
    peerConnections.current.clear();

    // Detener stream local
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
          console.error("Error deteniendo track:", error);
        }
      });
      localStreamRef.current = null;
    }

    // Cerrar WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, "Cleanup");
      wsRef.current = null;
    }

    setLocalStream(null);
    setStreamInitialized(false);
    setRemoteStreams(new Map());
    setParticipants([]);
    setMessages([]);
    setIsConnected(false);
    setConnectionStatus("disconnected");
    setWs(null);
    setMediaState({ audio: true, video: true });
    reconnectAttempts.current = 0;

    console.log("✅ Limpieza completada");
  }, []);

  // Función para salir de la sala correctamente - USANDO cleanup QUE YA ESTÁ DEFINIDA
  const leaveRoom = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "leave-room",
          roomId,
          userId: userData.id,
        })
      );
    }
    cleanup();
  }, [roomId, userData.id, cleanup]); // ✅ Ahora cleanup está definida

  // hooks/useWebRTC.js - CORREGIR la función connectWebSocket
  const connectWebSocket = useCallback(() => {
    if (isCleaningUp.current) return;

    try {
      // CORRECCIÓN: Usar el mismo puerto que tu aplicación Next.js
      let wsUrl;

      if (process.env.NODE_ENV === "development") {
        // En desarrollo, conectar al mismo puerto de Next.js (normalmente 3000 o 3001)
        const port = process.env.NEXT_PUBLIC_WS_PORT || "3002";
        wsUrl = `ws://localhost:${port}`;
      } else {
        // En producción, usar el mismo host
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${window.location.host}`;
      }

      console.log("🔗 Conectando a WebSocket:", wsUrl);
      setConnectionStatus("connecting");

      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log("✅ CONECTADO al WebSocket Server");
        setIsConnected(true);
        setConnectionStatus("connected");
        wsRef.current = websocket;
        reconnectAttempts.current = 0;

        // Enviar mensaje de unión inmediatamente
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(
            JSON.stringify({
              type: "join-room",
              roomId,
              userId: userData.id,
              userData: userData,
            })
          );
          console.log("📨 Mensaje join-room enviado a WebSocket Server");
        }
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(
            "📩 Mensaje WebSocket recibido:",
            data.type,
            "de:",
            data.from
          );
          handleSignalingMessage(data);
        } catch (error) {
          console.error(
            "❌ Error parsing WebSocket message:",
            error,
            event.data
          );
          addError(error);
        }
      };

      websocket.onclose = (event) => {
        console.log("❌ Desconectado del WebSocket:", event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus("disconnected");
        wsRef.current = null;

        if (shouldReconnect(event)) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            10000
          );
          reconnectAttempts.current++;
          console.log(
            `🔄 Intentando reconectar en ${delay}ms... (intento ${reconnectAttempts.current})`
          );
          setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          console.error(
            "❌ Máximo de intentos de reconexión alcanzado o cierre intencional"
          );
          setConnectionStatus("error");
        }
      };

      websocket.onerror = (error) => {
        console.error("❌ WebSocket error event triggered");
        console.error("WebSocket error details:", {
          event: error,
          readyState: websocket.readyState,
          url: websocket.url,
        });
        // No crear error duplicado, el onclose manejará la reconexión
      };
      setWs(websocket);
      return websocket;
    } catch (error) {
      console.error("❌ Error connecting to WebSocket:", error);
      addError(error);
      setConnectionStatus("error");
    }
  }, [roomId, userData, addError, shouldReconnect]);

  // Manejar mensajes de señalización
  const handleSignalingMessage = useCallback(
    async (data) => {
      console.log(`🎯 Procesando mensaje: ${data.type} de ${data.from}`);

      try {
        switch (data.type) {
          case "joined-room":
            console.log(
              "✅ Unido a la sala. Participantes:",
              data.participants
            );
            const otherParticipants = data.participants.filter(
              (p) => p.userId !== userData.id
            );
            setParticipants(otherParticipants);

            // Crear ofertas para participantes existentes
            for (const participant of otherParticipants) {
              console.log(`🔗 Creando oferta para: ${participant.userId}`);
              await createPeerConnection(participant.userId, true);
            }
            break;

          case "user-joined":
            console.log("👤 Nuevo usuario se unió:", data.userId);
            setParticipants((prev) => {
              const exists = prev.some((p) => p.userId === data.userId);
              if (!exists) {
                return [
                  ...prev,
                  {
                    userId: data.userId,
                    userData: data.userData,
                  },
                ];
              }
              return prev;
            });

            console.log(`🔗 Creando respuesta para: ${data.userId}`);
            await createPeerConnection(data.userId, false);
            break;

          case "user-left":
            console.log("👋 Usuario salió:", data.userId);
            setParticipants((prev) =>
              prev.filter((p) => p.userId !== data.userId)
            );
            closePeerConnection(data.userId);
            break;

          case "offer":
            console.log(`📩 Oferta recibida de ${data.from}`);
            await handleOffer(data.from, data.offer);
            break;

          case "answer":
            console.log(`📩 Respuesta recibida de ${data.from}`);
            await handleAnswer(data.from, data.answer);
            break;

          case "ice-candidate":
            console.log(`🧊 ICE candidate recibido de ${data.from}`);
            await handleIceCandidate(data.from, data.candidate);
            break;

          case "chat-message":
            console.log(
              "💬 Chat message recibido:",
              data.message,
              "de:",
              data.from
            );
            setMessages((prev) => [
              ...prev,
              {
                message: data.message,
                from: data.userData,
                isLocal: data.from === userData.id,
                timestamp: new Date(data.timestamp),
              },
            ]);
            break;

          case "media-status":
            console.log(
              "📊 Estado de medios actualizado:",
              data.userId,
              data.mediaType,
              data.enabled
            );
            // Podrías actualizar el estado UI basado en esto
            break;

          case "session-ended":
            console.log("🛑 Sesión finalizada recibida del servidor");
            setSessionEnded(true);
            break;

          case "end-session":
            console.log("🛑 Fin de sesión recibido del servidor");
            setSessionEnded(true);
            break;

          default:
            console.warn("⚠️ Tipo de mensaje desconocido:", data.type);
        }
      } catch (error) {
        console.error("❌ Error procesando mensaje de señalización:", error);
        addError(error);
      }
    },
    [userData.id, addError]
  );

  // Crear conexión peer
  const createPeerConnection = useCallback(
    async (targetUserId, isInitiator) => {
      try {
        console.log(
          `🔗 Creando PeerConnection con ${targetUserId}, iniciador: ${isInitiator}`
        );

        // Si ya existe una conexión, cerrarla primero
        if (peerConnections.current.has(targetUserId)) {
          console.log(`🔄 Cerrando conexión existente con ${targetUserId}`);
          const oldPc = peerConnections.current.get(targetUserId);
          oldPc.close();
          peerConnections.current.delete(targetUserId);
        }

        const peerConnection = new RTCPeerConnection(rtcConfig);
        peerConnections.current.set(targetUserId, peerConnection);

        // Agregar stream local si está disponible
        if (localStreamRef.current) {
          console.log(
            `🎥 Añadiendo stream local a conexión con ${targetUserId}`
          );
          localStreamRef.current.getTracks().forEach((track) => {
            try {
              peerConnection.addTrack(track, localStreamRef.current);
            } catch (error) {
              console.error(`❌ Error añadiendo track ${track.kind}:`, error);
            }
          });
        }

        // Manejar stream remoto - MEJORADO
        peerConnection.ontrack = (event) => {
          console.log(
            `🎥 Track remoto recibido de ${targetUserId}:`,
            event.track.kind,
            event.streams
          );

          if (event.streams && event.streams.length > 0) {
            const remoteStream = event.streams[0];

            // Verificar que el stream tenga tracks activos
            const activeTracks = remoteStream
              .getTracks()
              .filter((track) => track.readyState === "live");
            if (activeTracks.length === 0) {
              console.warn(
                `⚠️ Stream de ${targetUserId} no tiene tracks activos`
              );
              return;
            }

            // Escuchar cambios en los tracks
            event.track.onended = () => {
              console.log(
                `⏹️ Track ${event.track.kind} de ${targetUserId} terminó`
              );
            };

            event.track.onmute = () => {
              console.log(
                `🔇 Track ${event.track.kind} de ${targetUserId} muteado`
              );
            };

            setRemoteStreams((prev) => {
              const newStreams = new Map(prev);
              const existingData = newStreams.get(targetUserId);
              newStreams.set(targetUserId, {
                stream: remoteStream,
                userData:
                  existingData?.userData ||
                  participants.find((p) => p.userId === targetUserId)?.userData,
              });
              console.log(
                `✅ Stream remoto actualizado para ${targetUserId}, tracks activos:`,
                activeTracks.length
              );
              return newStreams;
            });
          }
        };

        // Manejar ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (
            event.candidate &&
            wsRef.current &&
            wsRef.current.readyState === WebSocket.OPEN
          ) {
            console.log(`🧊 Enviando ICE candidate a ${targetUserId}`);
            wsRef.current.send(
              JSON.stringify({
                type: "ice-candidate",
                roomId,
                userId: userData.id,
                targetUserId: targetUserId,
                candidate: event.candidate,
              })
            );
          }
        };

        // Manejar cambios de estado
        peerConnection.onconnectionstatechange = () => {
          const state = peerConnection.connectionState;
          console.log(`🔌 Estado conexión con ${targetUserId}: ${state}`);

          if (state === "connected") {
            console.log(`✅ Conexión establecida con ${targetUserId}`);
          } else if (state === "failed" || state === "disconnected") {
            console.log(
              `❌ Conexión ${state} con ${targetUserId}, manejando...`
            );
            // El timeout de desconexión se manejará en el efecto separado
          }
        };

        peerConnection.oniceconnectionstatechange = () => {
          const state = peerConnection.iceConnectionState;
          console.log(`🧊 ICE state con ${targetUserId}: ${state}`);
        };

        peerConnection.onsignalingstatechange = () => {
          console.log(
            `📡 Signaling state con ${targetUserId}:`,
            peerConnection.signalingState
          );
        };

        // Crear oferta si es el iniciador
        if (isInitiator) {
          try {
            console.log(`📤 Creando oferta para ${targetUserId}`);
            const offer = await peerConnection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });

            await peerConnection.setLocalDescription(offer);
            console.log(`📤 Oferta local establecida para ${targetUserId}`);

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: "offer",
                  roomId,
                  userId: userData.id,
                  targetUserId: targetUserId,
                  offer: offer,
                })
              );
              console.log(`📤 Oferta enviada a ${targetUserId}`);
            }
          } catch (error) {
            console.error(
              `❌ Error creando oferta para ${targetUserId}:`,
              error
            );
            addError(error);
          }
        }

        return peerConnection;
      } catch (error) {
        console.error(
          `❌ Error creando peer connection con ${targetUserId}:`,
          error
        );
        addError(error);
        throw error;
      }
    },
    [roomId, userData.id, participants, rtcConfig, addError]
  );

  // Manejar oferta
  const handleOffer = useCallback(
    async (fromUserId, offer) => {
      try {
        let peerConnection = peerConnections.current.get(fromUserId);

        if (!peerConnection) {
          console.log(
            `🔗 Creando nueva conexión para respuesta de ${fromUserId}`
          );
          peerConnection = await createPeerConnection(fromUserId, false);
        }

        if (peerConnection) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
          );

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "answer",
                roomId,
                userId: userData.id,
                targetUserId: fromUserId,
                answer: answer,
              })
            );
            console.log(`📤 Respuesta enviada a ${fromUserId}`);
          }
        }
      } catch (error) {
        console.error("Error manejando oferta:", error);
        addError(error);
      }
    },
    [createPeerConnection, roomId, userData.id, addError]
  );

  // Manejar respuesta
  const handleAnswer = useCallback(
    async (fromUserId, answer) => {
      try {
        const peerConnection = peerConnections.current.get(fromUserId);
        if (
          peerConnection &&
          peerConnection.signalingState === "have-local-offer"
        ) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          console.log(`✅ Respuesta establecida para ${fromUserId}`);
        }
      } catch (error) {
        console.error("Error manejando respuesta:", error);
        addError(error);
      }
    },
    [addError]
  );

  // Manejar ICE candidate
  const handleIceCandidate = useCallback(async (fromUserId, candidate) => {
    try {
      const peerConnection = peerConnections.current.get(fromUserId);
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Error añadiendo ICE candidate:", error);
      // No es crítico, solo loguear
      console.log("ICE candidate error (no crítico):", error);
    }
  }, []);

  // Cerrar conexión peer
  const closePeerConnection = useCallback((userId) => {
    const peerConnection = peerConnections.current.get(userId);
    if (peerConnection) {
      peerConnection.close();
      peerConnections.current.delete(userId);
    }

    setRemoteStreams((prev) => {
      const newStreams = new Map(prev);
      newStreams.delete(userId);
      return newStreams;
    });
  }, []);

  // Inicializar stream local - CORREGIDO
  const initializeLocalStream = useCallback(async () => {
    try {
      console.log("🎥 Inicializando stream local...");

      // Detener stream anterior si existe
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      console.log(
        "✅ Stream local obtenido:",
        stream.getTracks().map((t) => `${t.kind}-${t.id}`)
      );
      setLocalStream(stream);
      setStreamInitialized(true);
      localStreamRef.current = stream;

      // Reenviar stream a todas las conexiones existentes - CORREGIDO
      peerConnections.current.forEach((pc, userId) => {
        const senders = pc.getSenders();
        stream.getTracks().forEach((track) => {
          const sender = senders.find(
            (s) => s.track && s.track.kind === track.kind
          );
          if (sender) {
            console.log(
              `🔄 Reemplazando ${track.kind} track en conexión con ${userId}`
            );
            sender
              .replaceTrack(track)
              .catch((err) => console.error("Error reemplazando track:", err));
          } else {
            console.log(
              `➕ Añadiendo ${track.kind} track en conexión con ${userId}`
            );
            // CORREGIDO: No usar .catch() en addTrack ya que no devuelve Promise
            try {
              pc.addTrack(track, stream);
            } catch (err) {
              console.error("Error añadiendo track:", err);
            }
          }
        });
      });

      return stream;
    } catch (error) {
      console.error("❌ Error accediendo a medios:", error);
      setStreamInitialized(false);
      addError(error);
      throw error;
    }
  }, [addError]);

  // Toggle medios - MEJORADO
  const toggleMedia = useCallback(
    (mediaType, enabled) => {
      try {
        if (localStreamRef.current) {
          const tracks =
            mediaType === "audio"
              ? localStreamRef.current.getAudioTracks()
              : localStreamRef.current.getVideoTracks();

          console.log(
            `🔊 Toggling ${mediaType}: enabled=${enabled}, tracks found: ${tracks.length}`
          );

          tracks.forEach((track) => {
            track.enabled = enabled;
            console.log(
              `✅ ${mediaType} track (${track.kind}): ${
                enabled ? "ACTIVADO" : "DESACTIVADO"
              }`
            );
          });

          // Actualizar estado
          setMediaState((prev) => ({
            ...prev,
            [mediaType]: enabled,
          }));

          // Notificar a otros usuarios que cambió el estado
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "media-status",
                roomId,
                userId: userData.id,
                mediaType,
                enabled: enabled,
                userData: userData,
              })
            );
          }
        }
      } catch (error) {
        console.error(`❌ Error toggling ${mediaType}:`, error);
        addError(error);
      }
    },
    [roomId, userData, addError]
  );

  // Enviar mensaje de chat
  const sendMessage = useCallback(
    (message) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("💬 Enviando mensaje:", message);

        // Guardar el mensaje localmente primero
        const newMessage = {
          message: message,
          from: userData,
          isLocal: true,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);

        // Enviar al servidor
        wsRef.current.send(
          JSON.stringify({
            type: "chat-message",
            roomId,
            userId: userData.id,
            message: message,
            userData: userData,
            timestamp: newMessage.timestamp.toISOString(),
          })
        );
      } else {
        console.error("❌ WebSocket no está conectado");
        addError(new Error("WebSocket no conectado al enviar mensaje"));
      }
    },
    [roomId, userData, addError]
  );

  // Efecto para detectar participantes desconectados
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      peerConnections.current.forEach((pc, userId) => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          console.log(`👋 Participante ${userId} desconectado (timeout)`);
          closePeerConnection(userId);
          setParticipants((prev) => prev.filter((p) => p.userId !== userId));
        }
      });
    }, 10000); // Verificar cada 10 segundos

    return () => clearInterval(interval);
  }, [isConnected, closePeerConnection]);

  // Efectos principales
  useEffect(() => {
    if (roomId && userData && !isCleaningUp.current) {
      const websocket = connectWebSocket();
      return () => {
        if (websocket) {
          websocket.close(1000, "Component unmount");
        }
      };
    }
  }, [roomId, userData, connectWebSocket]);

  // En hooks/useWebRTC.js, agrega este efecto
  useEffect(() => {
    // Manejar errores de permisos de medios
    const handleMediaError = (error) => {
      console.error("Error de medios:", error);
      addError(new Error(`Error de cámara/micrófono: ${error.message}`));
    };

    // Escuchar errores globales de medios
    window.addEventListener("mediaerror", handleMediaError);

    return () => {
      window.removeEventListener("mediaerror", handleMediaError);
    };
  }, [addError]);

  // Reset cleanup flag cuando se monta de nuevo
  useEffect(() => {
    isCleaningUp.current = false;
  }, []);

  return {
    localStream,
    remoteStreams,
    isConnected,
    participants,
    messages,
    connectionStatus,
    streamInitialized,
    mediaState,
    errors,
    sessionEnded,
    initializeLocalStream,
    sendMessage,
    toggleMedia,
    cleanup,
    leaveRoom, // Nueva función para salir correctamente
    ws,
  };
};
