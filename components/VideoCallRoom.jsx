// components/VideoCallRoom.jsx - VERSIÓN CON BOTÓN DE RECETA Y GESTIÓN DE CITA
"use client";

import { useEffect, useRef, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import ModalCrearReceta from "./medico/ModalCrearReceta";
import GestionCitaMedicoModal from "./medico/gestion-cita-medico-modal"; // Importamos el nuevo modal
import { useAuth } from "@/contexts/auth-context";

export default function VideoCallRoom({ roomId, sessionUUID, userData, onLeave, citaData, citaId }) {
  // Agregamos citaData como prop
  const [hasPermission, setHasPermission] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSessionEndedModal, setShowSessionEndedModal] = useState(false);
  const [showRecetaModal, setShowRecetaModal] = useState(false);
  const [showGestionCitaModal, setShowGestionCitaModal] = useState(false); // Nuevo estado para gestión de cita
  const [citaParaModal, setCitaParaModal] = useState(null);
  const [citaParaReceta, setCitaParaReceta] = useState(null);
  const [loadingCita, setLoadingCita] = useState(false);
  const [loadingReceta, setLoadingReceta] = useState(false);

  const localVideoRef = useRef();
  const messagesEndRef = useRef(null);

  const { token, usuario } = useAuth();

  const {
    localStream,
    remoteStreams,
    isConnected,
    participants,
    messages,
    connectionStatus,
    streamInitialized,
    mediaState,
    initializeLocalStream,
    sendMessage,
    toggleMedia,
    cleanup,
    leaveRoom,
    ws,
    sessionEnded,
  } = useWebRTC(roomId, userData);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    const initCall = async () => {
      try {
        console.log("🎬 Inicializando llamada...");
        await initializeLocalStream();
        setHasPermission(true);
        console.log("✅ Llamada inicializada correctamente");
      } catch (error) {
        console.error("❌ Error inicializando llamada:", error);
        setHasPermission(false);
      }
    };

    initCall();

    return () => {
      console.log("🧹 Limpiando componente VideoCallRoom");
      cleanup();
    };
  }, [initializeLocalStream, cleanup]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log("🎥 Actualizando video local");
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!isChatOpen && messages.length > 0) {
      const newMessages = messages.slice(-1)[0];
      if (!newMessages.isLocal) {
        setUnreadMessages((prev) => prev + 1);
      }
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadMessages(0);
    }
  }, [isChatOpen]);

  // Sincronizar estado local con el estado del hook
  useEffect(() => {
    setIsAudioMuted(!mediaState.audio);
    setIsVideoOff(!mediaState.video);
  }, [mediaState]);

  // 🔥 ESCUCHAR CUANDO EL MÉDICO FINALIZA LA SESIÓN (desde useWebRTC)
  useEffect(() => {
    if (sessionEnded) {
      console.log("🛑 Sesión finalizada detectada");
      setShowSessionEndedModal(true);
      
      // Desconectar después de mostrar el modal (3000ms para que sea visible)
      setTimeout(() => {
        console.log("🛑 Cerrando modal y desconectando paciente...");
        leaveRoom();
        window.close();
      }, 10000);
    }
  }, [sessionEnded, leaveRoom]);

  const handleToggleAudio = () => {
    const newMutedState = !isAudioMuted;
    console.log("🎤 Toggle audio - Nuevo estado muted:", newMutedState);
    toggleMedia("audio", !newMutedState);
    setIsAudioMuted(newMutedState);
  };

  const handleToggleVideo = () => {
    const newOffState = !isVideoOff;
    console.log("📷 Toggle video - Nuevo estado off:", newOffState);
    toggleMedia("video", !newOffState);
    setIsVideoOff(newOffState);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      console.log("💬 Enviando mensaje:", chatMessage);
      sendMessage(chatMessage.trim());
      setChatMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeaveCall = () => {
    console.log("👋 Mostrando modal de salida");
    setShowExitModal(true);
  };

  const confirmLeaveCall = async () => {
    console.log("👋 Finalizando consulta...");
    
    // 🔥 SI ES MÉDICO, ACTUALIZAR ESTADO A "COMPLETADA"
    if (esMedico && roomId) {
      try {
        console.log("🏥 Médico finalizando consulta. Actualizando estado a 'completada'...");
        
        if (!token) {
          console.error("❌ No hay token para actualizar sesión");
          leaveRoom();
          setShowExitModal(false);
          window.close();
          return;
        }

        // 🔥 ENVIAR MENSAJE AL WEBSOCKET PARA NOTIFICAR AL PACIENTE
        console.log("🔍 WebSocket details:", {
          exists: !!ws,
          readyState: ws?.readyState,
          OPEN: WebSocket.OPEN,
          isOpen: ws?.readyState === WebSocket.OPEN,
        });
        
        if (ws && ws.readyState === WebSocket.OPEN) {
          console.log("📢 Enviando notificación de fin de sesión al WebSocket...");
          const mensaje = JSON.stringify({
            type: "end-session",
            roomId: roomId,
            userId: usuario?.id,
          });
          console.log("📤 Mensaje a enviar:", mensaje);
          ws.send(mensaje);
          console.log("✅ Mensaje enviado al WebSocket");
        } else {
          console.warn("⚠️ WebSocket NO está disponible o no está OPEN");
          console.warn("   State:", ws?.readyState, "Expected:", WebSocket.OPEN);
        }

        const updateResponse = await fetch("/api/telemedicina/sesiones", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sesionId: sessionUUID,
            estado: "completada",
          }),
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          console.log("✅ Consulta finalizada en BD:", updateData);
          console.log("📢 Sesión actualizada a completada, desconectando...");
        } else {
          console.error("❌ Error al finalizar consulta:", updateResponse.status);
        }
      } catch (error) {
        console.error("⚠️ Error al actualizar sesión:", error);
        // Continuar de todas formas
      }
    }

    // Desconectar y cerrar para todos
    leaveRoom();
    setShowExitModal(false);
    window.close();
  };

  const handleCloseWindow = async () => {
    // 🔥 HACER QUE "CERRAR VENTANA" SEA IGUAL A "SÍ, FINALIZAR"
    // Solo cierra, pero ahora primero intenta finalizar como médico
    await confirmLeaveCall();
  };

  const cancelLeaveCall = () => {
    console.log("❌ Cancelando salida");
    setShowExitModal(false);
  };

  const handleRetryCamera = async () => {
    console.log("🔄 Reintentando cámara...");
    try {
      await initializeLocalStream();
      setHasPermission(true);
    } catch (error) {
      console.error("❌ Error al reintentar cámara:", error);
      setHasPermission(false);
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      alert("Enlace copiado al portapapeles");
    });
  };

  // Función para abrir el modal de receta (async)
  const handleAbrirRecetaModal = async () => {
    console.log("📝 Abriendo modal de receta médica");
    const cita = await cargarCitaParaReceta();
    if (cita) {
      setShowRecetaModal(true);
    }
  };

  // Función para cerrar el modal de receta
  const handleCerrarRecetaModal = () => {
    setShowRecetaModal(false);
    setCitaParaReceta(null);
  };

  // En el VideoCallRoom.jsx, modifica la función handleAbrirGestionCitaModal:
  const handleAbrirGestionCitaModal = async () => {
    console.log("🩺 Abriendo modal de gestión de cita");
    try {
      const citaCargada = await cargarCitaParaModal();

      // ✅ ENRIQUECER la cita con el roomId para que el modal pueda buscar la cita real
      const citaConRoomId = {
        ...citaCargada,
        sesionId: roomId, // ← ESTO ES LO QUE FALTA
        roomId: roomId, // ← Y ESTO TAMBIÉN
      };

      setCitaParaModal(citaConRoomId);
      setShowGestionCitaModal(true);
    } catch (error) {
      console.error("❌ Error al abrir modal de gestión:", error);
      // Cita de emergencia con roomId
      const citaEmergencia = {
        id: `emergency-${Date.now()}`,
        paciente: { nombre: "Paciente", apellido: "En Consulta" },
        fecha_cita: new Date().toISOString(),
        hora_cita: "08:00",
        tipo_cita: "virtual",
        estado: "en_curso",
        sesionId: roomId, // ← AQUÍ TAMBIÉN
        roomId: roomId, // ← AQUÍ TAMBIÉN
      };
      setCitaParaModal(citaEmergencia);
      setShowGestionCitaModal(true);
    }
  };

  // Función para cerrar el modal de gestión de cita
  const handleCerrarGestionCitaModal = () => {
    console.log("🗑️ Cerrando modal de gestión de cita");
    setShowGestionCitaModal(false);
    // No limpiar citaParaModal inmediatamente para evitar flickering
    setTimeout(() => setCitaParaModal(null), 500);
  };

  // Función cuando se actualiza la cita
  const handleCitaActualizada = () => {
    console.log("✅ Cita actualizada exitosamente");
    // Puedes agregar aquí notificaciones o acciones adicionales
  };

  // Función cuando se crea una receta exitosamente
  const handleRecetaCreada = () => {
    console.log("✅ Receta creada exitosamente");
    // Puedes agregar aquí notificaciones o acciones adicionales
  };

  // Obtener datos del paciente desde los participantes
  const obtenerDatosPaciente = () => {
    // Buscar paciente entre los participantes remotos
    const paciente = Array.from(remoteStreams.values()).find(
      (stream) => stream.userData?.rol === "paciente"
    )?.userData;

    // Si no se encuentra en los streams, buscar en los participantes
    if (!paciente) {
      const participantePaciente = participants.find(
        (p) => p.userData?.rol === "paciente"
      );
      if (participantePaciente) {
        return participantePaciente.userData;
      }
    }

    // Si tenemos citaData, usar esos datos
    if (citaData?.paciente) {
      return citaData.paciente;
    }

    // Datos de ejemplo si no se encuentra paciente
    return (
      paciente || {
        id: 1,
        nombre: "Paciente",
        apellido: "En Consulta",
        dni: "00000000",
        edad: 30,
      }
    );
  };

  // Función para obtener la cita REAL desde la base de datos
  const obtenerCitaReal = async () => {
    if (!token) {
      console.log("⚠️ No hay token, usando datos de sesión");
      return null;
    }

    try {
      console.log("🔍 Buscando cita real en BD...");

      const response = await fetch(`/api/citas/medico/buscar-cita-actual`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: roomId,
          medicoId: userData?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cita) {
          console.log("✅ Cita real encontrada:", data.cita.id);

          // ✅ GARANTIZAR QUE SIEMPRE TIENE hora_cita formateada
          if (!data.cita.hora_cita || data.cita.hora_cita === "") {
            data.cita.hora_cita = new Date().toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            });
          } else if (
            data.cita.hora_cita &&
            !data.cita.hora_cita.includes(":")
          ) {
            // Si viene como número, convertir a formato HH:MM
            const horaNum = parseInt(data.cita.hora_cita);
            data.cita.hora_cita = `${horaNum.toString().padStart(2, "0")}:00`;
          }

          // Enriquecer con datos del paciente si es necesario
          if (data.cita.id_paciente) {
            try {
              const perfilResponse = await fetch(
                `/api/pacientes/${data.cita.id_paciente}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (perfilResponse.ok) {
                const perfilData = await perfilResponse.json();
                data.cita.paciente = {
                  ...data.cita.paciente,
                  ...perfilData.paciente,
                };
              }
            } catch (error) {
              console.log("⚠️ No se pudo obtener perfil completo del paciente");
            }
          }

          return data.cita;
        }
      }
      return null;
    } catch (error) {
      console.error("❌ Error buscando cita real:", error);
      return null;
    }
  };

  const cargarCitaParaModal = async () => {
    setLoadingCita(true);
    try {
      console.log("🔄 Cargando datos para modal de gestión...");
      console.log("🔍 Room ID:", roomId);

      // ✅ EXTRAER el codigo_acceso del roomId
      // roomId = "medilink-GMMI1RI9NJ", necesitamos "GMMI1RI9NJ"
      const codigoAcceso = roomId.includes("medilink-") 
        ? roomId.split("medilink-")[1] 
        : roomId;

      console.log("🔍 Código de acceso para búsqueda:", codigoAcceso);

      // ✅ PRIMERO: Buscar cita por sesión usando el codigo_acceso
      const response = await fetch(
        `/api/telemedicina/sesiones?codigo_acceso=${codigoAcceso}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.sesiones && data.sesiones.length > 0) {
          const sesion = data.sesiones[0];
          console.log("✅ Sesión encontrada:", sesion);

          // ✅ AHORA BUSCAR LA CITA COMPLETA usando el id_cita REAL
          const citaResponse = await fetch(`/api/citas/${sesion.id_cita}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (citaResponse.ok) {
            const citaData = await citaResponse.json();
            console.log("🎯 CITA REAL ENCONTRADA:", {
              id: citaData.cita?.id,
              fecha: citaData.cita?.fecha_cita,
              hora: citaData.cita?.hora_cita,
              estado: citaData.cita?.estado,
            });

            if (citaData.cita) {
              // ✅ ENRIQUECER con datos del paciente Y EL ROOMID
              const citaCompleta = {
                ...citaData.cita,
                sesionId: roomId,
                roomId: roomId,
                codigo_acceso: sesion.codigo_acceso,
                id_sesion: sesion.id,
                paciente: {
                  id: sesion.paciente_id,
                  nombre: sesion.paciente_nombre,
                  apellido: sesion.paciente_apellido,
                  dni: sesion.paciente_dni,
                  ...(citaData.cita.paciente || {}),
                },
              };

              console.log("📋 Cita completa para modal:", citaCompleta);
              setCitaParaModal(citaCompleta);
              return citaCompleta;
            }
          }
        }
      }

      // ✅ SEGUNDO: Si no se encuentra por sesión, usar citaData de props
      if (citaData && citaData.id && !citaData.id.startsWith("temp-")) {
        console.log("✅ Usando citaData REAL de props:", citaData.id);
        const citaConRoomId = {
          ...citaData,
          sesionId: roomId,
          roomId: roomId,
        };
        setCitaParaModal(citaConRoomId);
        return citaConRoomId;
      }

      // ✅ TERCERO: Si todo falla, crear temporal CON ROOMID
      console.log("⚠️ Creando cita temporal para modal");
      const paciente = obtenerDatosPaciente();
      const citaTemporal = {
        id: `temp-${roomId}-${Date.now()}`,
        paciente: paciente,
        fecha_cita: new Date().toISOString(),
        hora_cita: new Date().toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        tipo_cita: "virtual",
        estado: "en_curso",
        motivo_consulta: "Consulta virtual en curso",
        sesionId: roomId,
        roomId: roomId,
        codigo_acceso: codigoAcceso,
      };

      setCitaParaModal(citaTemporal);
      return citaTemporal;
    } catch (error) {
      console.error("❌ Error cargando cita para modal:", error);
      // Cita de emergencia CON ROOMID
      const codigoAcceso = roomId.includes("medilink-") 
        ? roomId.split("medilink-")[1] 
        : roomId;
      
      const citaEmergencia = {
        id: `emergency-${Date.now()}`,
        paciente: { nombre: "Paciente", apellido: "En Consulta" },
        fecha_cita: new Date().toISOString(),
        hora_cita: "08:00",
        tipo_cita: "virtual",
        estado: "en_curso",
        sesionId: roomId,
        roomId: roomId,
        codigo_acceso: codigoAcceso,
      };
      setCitaParaModal(citaEmergencia);
      return citaEmergencia;
    } finally {
      setLoadingCita(false);
    }
  };


  const cargarCitaParaReceta = async () => {
    setLoadingReceta(true);
    try {
      console.log("📝 Cargando cita REAL para receta...");
      console.log("🔍 citaId disponible:", citaId);
      
      // ✅ SI tenemos el citaId directamente, usarlo primero
      if (citaId) {
        console.log("✅ Usando citaId directo:", citaId);
        
        const response = await fetch(`/api/citas/${citaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.cita) {
            console.log("✅ Cita REAL obtenida directamente:", citaId);
            
            // ✅ TRANSFORMAR los datos del paciente a formato esperado
            const citaTransformada = {
              ...data.cita,
              paciente: {
                id: data.cita.id_paciente,
                nombre: data.cita.nombre_paciente,
                apellido: data.cita.apellido_paciente,
                dni: data.cita.dni,
                telefono: data.cita.telefono_paciente,
                fecha_nacimiento: data.cita.fecha_nacimiento,
                tipo_sangre: data.cita.tipo_sangre,
                alergias: data.cita.alergias,
                peso: data.cita.peso,
                altura: data.cita.altura,
              },
            };
            
            setCitaParaReceta(citaTransformada);
            return citaTransformada;
          }
        }
      }
      
      // ✅ FALLBACK: OBTENER SOLO LA CITA REAL - ABSOLUTAMENTE NECESARIA PARA RECETA
      const response = await fetch(`/api/citas/medico/buscar-cita-actual`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: roomId,
          medicoId: userData?.id || null,
        }),
      });

      if (!response.ok) {
        console.error("❌ Error en respuesta del servidor:", response.status);
        alert("Error al obtener la cita. Intenta de nuevo.");
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.cita) {
        console.log("✅ Cita REAL obtenida para receta:", data.cita.id);
        setCitaParaReceta(data.cita);
        return data.cita;
      } else {
        console.error("❌ No se encontró cita real para crear receta");
        alert("No se pudo obtener la información de la cita. Asegúrate de que la cita está registrada en el sistema.");
        return null;
      }
    } catch (error) {
      console.error("❌ Error cargando cita para receta:", error);
      alert("Error al cargar la información de la cita: " + error.message);
      return null;
    } finally {
      setLoadingReceta(false);
    }
  };

  // Función corregida para crear cita para modal
  const crearCitaParaModal = async () => {
    const paciente = obtenerDatosPaciente();

    // ✅ PRIMERO: Intentar obtener cita REAL de la base de datos
    try {
      console.log("🔍 Buscando cita REAL en BD...");

      const response = await fetch(`/api/citas/medico/buscar-cita-actual`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: roomId,
          medicoId: userData?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cita) {
          console.log("🎯 Cita REAL encontrada:", data.cita.id);

          // ✅ ENRQUECER los datos del paciente desde el perfil real
          const perfilPacienteResponse = await fetch(
            `/api/pacientes/${data.cita.id_paciente}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          let pacienteCompleto = paciente;
          if (perfilPacienteResponse.ok) {
            const perfilData = await perfilPacienteResponse.json();
            if (perfilData.paciente) {
              pacienteCompleto = {
                ...paciente,
                id: perfilData.paciente.id,
                nombre: perfilData.paciente.usuario.nombre,
                apellido: perfilData.paciente.usuario.apellido,
                email: perfilData.paciente.usuario.email,
                telefono: perfilData.paciente.usuario.telefono,
                dni: perfilData.paciente.informacion_personal.dni,
                edad: perfilData.paciente.informacion_personal.edad,
                sexo: perfilData.paciente.informacion_personal.sexo,
                tipo_sangre: perfilData.paciente.informacion_medica.tipo_sangre,
                alergias: perfilData.paciente.informacion_medica.alergias,
                enfermedades_cronicas:
                  perfilData.paciente.informacion_medica.enfermedades_cronicas,
                fecha_nacimiento:
                  perfilData.paciente.informacion_personal.fecha_nacimiento,
              };
            }
          }

          return {
            ...data.cita,
            paciente: pacienteCompleto,
            // Campos adicionales para compatibilidad
            paciente_nombre: pacienteCompleto.nombre,
            paciente_apellido: pacienteCompleto.apellido,
            paciente_dni: pacienteCompleto.dni,
            paciente_edad: pacienteCompleto.edad,
            alergias: pacienteCompleto.alergias,
            tipo_sangre: pacienteCompleto.tipo_sangre,
          };
        }
      }
    } catch (error) {
      console.error("❌ Error obteniendo cita real:", error);
    }

    // ✅ SEGUNDO: Si tenemos citaData real (prop), usarla
    if (citaData && citaData.id) {
      console.log("📋 Usando citaData de props:", citaData.id);
      return {
        ...citaData,
        paciente: paciente,
        paciente_nombre: paciente.nombre,
        paciente_apellido: paciente.apellido,
        paciente_dni: paciente.dni,
        paciente_edad: paciente.edad,
      };
    }

    // ✅ TERCERO: Cita simulada como último recurso
    console.log("⚠️ Usando cita simulada (sin ID real)");
    return {
      id: `cita-temporal-${roomId}-${Date.now()}`,
      id_paciente: paciente.id || 1, // ✅ IMPORTANTE para modal
      paciente: paciente,
      paciente_nombre: paciente.nombre,
      paciente_apellido: paciente.apellido,
      paciente_dni: paciente.dni,
      paciente_edad: paciente.edad,
      fecha_cita: new Date().toISOString(),
      motivo_consulta: "Consulta virtual - Videollamada",
      tipo_cita: "virtual",
      estado: "en_curso",
    };
  };

  // Verificar si el usuario es médico
  const esMedico = userData?.rol === "medico";

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
      {/* Modal de gestión de cita médica */}
      {showGestionCitaModal && (
        <GestionCitaMedicoModal
          cita={citaParaModal}
          isOpen={showGestionCitaModal}
          onClose={handleCerrarGestionCitaModal}
          onCitaActualizada={handleCitaActualizada}
        />
      )}

      {/* Modal de receta médica */}
      {showRecetaModal && esMedico && citaParaReceta && (
        <ModalCrearReceta
          cita={citaParaReceta} // ✅ Usa el estado, no llamada directa
          isOpen={showRecetaModal}
          onClose={handleCerrarRecetaModal}
          onRecetaCreada={handleRecetaCreada}
        />
      )}

      {/* Loading indicator opcional */}
      {loadingCita && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">
                Cargando información de la cita...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de salida */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 sm:p-8 max-w-md w-full border-4 border-red-800 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">
                ¿Finalizar consulta?
              </h3>
              <p className="text-red-100 mb-6 text-sm sm:text-base">
                La llamada se terminará para todos los participantes. Esta
                acción no se puede deshacer.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={cancelLeaveCall}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-colors border-2 border-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmLeaveCall}
                  className="flex-1 bg-white hover:bg-gray-200 text-red-700 px-6 py-3 rounded-lg font-bold transition-colors border-2 border-red-300"
                >
                  Sí, Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 Modal de sesión finalizada */}
      {showSessionEndedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 sm:p-8 max-w-md w-full border-4 border-orange-700 shadow-2xl">
            <div className="text-center">
              <div className="text-5xl mb-4">🛑</div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                Consulta Finalizada
              </h3>
              <p className="text-orange-100 mb-6 text-sm sm:text-base">
                El médico ha finalizado la videollamada. La conexión se cerrará
                automáticamente.
              </p>

              <button
                onClick={() => {
                  setShowSessionEndedModal(false);
                  leaveRoom();
                  onLeave();
                }}
                className="w-full bg-white hover:bg-gray-200 text-orange-700 px-6 py-3 rounded-lg font-bold transition-colors border-2 border-orange-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 sm:p-4 lg:p-6 border-b-4 border-blue-800 shadow-lg flex-shrink-0">
        <div className="flex justify-between items-start sm:items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
              MediLink+ Consulta Virtual
            </h1>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm lg:text-base">
              <div className="flex items-center gap-1 sm:gap-2">
                <span
                  className={`inline-block w-3 sm:w-4 h-3 sm:h-4 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-400"
                      : connectionStatus === "connecting"
                      ? "bg-yellow-400"
                      : "bg-red-400"
                  } animate-pulse`}
                ></span>
                <span className="font-semibold">
                  {connectionStatus === "connected"
                    ? "Conectado"
                    : connectionStatus === "connecting"
                    ? "Conectando..."
                    : "Desconectado"}
                </span>
              </div>
              <span className="hidden sm:inline">
                Participantes: {participants.length + 1}
              </span>
              <button
                onClick={copyRoomLink}
                className="text-blue-200 hover:text-white underline text-xs"
                title="Copiar enlace de la sala"
              >
                Copiar enlace
              </button>
            </div>
          </div>

          {/* Botones de médico (solo para médicos) */}
          {esMedico && (
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleAbrirGestionCitaModal}
                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl transition-colors font-bold text-xs sm:text-sm lg:text-base shadow-lg transform hover:scale-105 flex items-center gap-2"
                title="Gestionar cita médica"
              >
                <span>🩺</span>
                <span className="hidden sm:inline">Gestionar Cita</span>
              </button>

              <button
                onClick={handleAbrirRecetaModal}
                className="bg-green-500 hover:bg-green-600 active:bg-green-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl transition-colors font-bold text-xs sm:text-sm lg:text-base shadow-lg transform hover:scale-105 flex items-center gap-2"
                title="Generar receta médica"
              >
                <span>📝</span>
                <span className="hidden sm:inline">Receta</span>
              </button>
            </div>
          )}

          <button
            onClick={handleLeaveCall}
            className="bg-red-500 hover:bg-red-600 active:bg-red-700 px-4 sm:px-6 lg:px-8 py-2 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl transition-colors font-bold text-sm sm:text-base lg:text-lg shadow-lg transform hover:scale-105"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2 sm:p-3 lg:p-6 gap-2 sm:gap-3 lg:gap-4">
        {/* Área de video */}
        <div className="flex-1 flex flex-col gap-2 sm:gap-3 lg:gap-4 overflow-hidden min-w-0">
          {/* Contenedor de videos - Grid responsivo */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 overflow-auto pb-2">
            {/* Video local */}
            <div className="bg-black rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden relative shadow-lg border-2 sm:border-3 lg:border-4 border-blue-500 min-h-40 sm:min-h-48 lg:min-h-64">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 bg-black bg-opacity-80 px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-bold border-2 border-blue-400">
                <span className="flex items-center gap-1 sm:gap-2">
                  <span>Tú</span>
                  {isAudioMuted && (
                    <span className="text-lg sm:text-xl">🔇</span>
                  )}
                  {!isAudioMuted && (
                    <span className="text-lg sm:text-xl">🎤</span>
                  )}
                  {isVideoOff && (
                    <span className="text-lg sm:text-xl">📷❌</span>
                  )}
                  {!isVideoOff && (
                    <span className="text-lg sm:text-xl">📷</span>
                  )}
                </span>
              </div>
              {!streamInitialized && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-red-400 text-xs sm:text-sm lg:text-lg font-bold block">
                      ❌ Cámara no disponible
                    </span>
                    <button
                      onClick={handleRetryCamera}
                      className="mt-2 bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-white text-xs"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Videos remotos */}
            {Array.from(remoteStreams.entries()).map(
              ([userId, { stream, userData: remoteUserData }]) => (
                <RemoteVideo
                  key={userId}
                  stream={stream}
                  userData={remoteUserData}
                />
              )
            )}

            {/* Placeholder para participantes sin stream */}
            {participants
              .filter((p) => !remoteStreams.has(p.userId))
              .map((participant) => (
                <div
                  key={participant.userId}
                  className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden relative min-h-40 sm:min-h-48 lg:min-h-64 flex items-center justify-center border-2 sm:border-3 lg:border-4 border-gray-600 shadow-lg"
                >
                  <div className="text-center p-4">
                    <div className="w-12 sm:w-16 lg:w-20 h-12 sm:h-16 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <span className="text-2xl sm:text-3xl lg:text-4xl">
                        👤
                      </span>
                    </div>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-white">
                      {participant.userData?.nombre || "Usuario"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">
                      Conectando...
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {/* Controles */}
          <div className="flex justify-center gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 lg:p-6 bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl border-2 sm:border-3 lg:border-4 border-gray-700 shadow-lg flex-wrap flex-shrink-0">
            <button
              onClick={handleToggleAudio}
              className={`p-3 sm:p-4 lg:p-5 rounded-full transition-all transform hover:scale-110 text-2xl sm:text-3xl lg:text-4xl font-bold shadow-lg border-2 sm:border-2 lg:border-2 ${
                isAudioMuted
                  ? "bg-red-500 border-red-600 ring-2 sm:ring-3 lg:ring-4 ring-red-300"
                  : "bg-green-500 border-green-600 hover:bg-green-600"
              }`}
              title={isAudioMuted ? "Activar micrófono" : "Silenciar micrófono"}
            >
              {isAudioMuted ? "🔇" : "🎤"}
            </button>

            <button
              onClick={handleToggleVideo}
              className={`p-3 sm:p-4 lg:p-5 rounded-full transition-all transform hover:scale-110 text-2xl sm:text-3xl lg:text-4xl font-bold shadow-lg border-2 sm:border-2 lg:border-2 ${
                isVideoOff
                  ? "bg-red-500 border-red-600 ring-2 sm:ring-3 lg:ring-4 ring-red-300"
                  : "bg-green-500 border-green-600 hover:bg-green-600"
              }`}
              title={isVideoOff ? "Activar cámara" : "Apagar cámara"}
            >
              {isVideoOff ? "📷❌" : "📷"}
            </button>

            <button
              onClick={handleRetryCamera}
              className="p-3 sm:p-4 lg:p-5 rounded-full bg-yellow-500 hover:bg-yellow-600 border-2 sm:border-2 lg:border-2 border-yellow-600 transition-all transform hover:scale-110 text-2xl sm:text-3xl lg:text-4xl font-bold shadow-lg"
              title="Reintentar cámara"
            >
              🔄
            </button>

            {/* Botones de médico en controles también (solo para médicos) */}
            {esMedico && (
              <>
                <button
                  onClick={handleAbrirGestionCitaModal}
                  disabled={loadingCita}
                  className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl transition-colors font-bold text-xs sm:text-sm lg:text-base shadow-lg transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Gestionar cita médica"
                >
                  {loadingCita ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Cargando...</span>
                    </>
                  ) : (
                    <>
                      <span>🩺</span>
                      <span className="hidden sm:inline">Gestionar Cita</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleAbrirRecetaModal}
                  disabled={loadingReceta}
                  className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl transition-colors font-bold text-xs sm:text-sm lg:text-base shadow-lg transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Gestionar cita médica"
                >
                  {loadingReceta ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Cargando...</span>
                    </>
                  ) : (
                    <>
                      <span>📝</span>
                      <span className="hidden sm:inline">Crear Receta</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-3 sm:p-4 lg:p-5 rounded-full transition-all transform hover:scale-110 text-2xl sm:text-3xl lg:text-4xl font-bold shadow-lg border-2 sm:border-2 lg:border-2 relative ${
                isChatOpen
                  ? "bg-blue-500 border-blue-600 ring-2 sm:ring-3 lg:ring-4 ring-blue-300"
                  : "bg-purple-500 border-purple-600 hover:bg-purple-600"
              }`}
              title={isChatOpen ? "Cerrar chat" : "Abrir chat"}
            >
              💬
              {unreadMessages > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 sm:w-6 h-5 sm:h-6 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Chat */}
        {isChatOpen && (
          <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-gradient-to-br from-purple-700 to-purple-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl overflow-hidden border-2 sm:border-3 lg:border-4 border-purple-600 flex-shrink-0">
            {/* Header Chat */}
            <div className="p-3 sm:p-4 lg:p-6 border-b-2 sm:border-b-3 lg:border-b-4 border-purple-600 bg-gradient-to-r from-purple-700 to-purple-900 flex-shrink-0">
              <div className="flex justify-between items-center gap-2">
                <h3 className="font-bold text-lg sm:text-xl lg:text-2xl">
                  💬 Chat Médico
                </h3>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="lg:hidden text-xl sm:text-2xl hover:bg-purple-600 p-1 sm:p-2 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs sm:text-sm text-purple-200 mt-1">
                Mensajes en tiempo real
              </p>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto space-y-2 sm:space-y-3 lg:space-y-4 bg-gradient-to-b from-purple-800 to-purple-900 min-h-0">
              {messages.length === 0 ? (
                <div className="text-center text-purple-300 text-base sm:text-lg py-8 sm:py-12">
                  <p>📭</p>
                  <p className="mt-2">Sin mensajes aún</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm lg:text-base ${
                      message.isLocal
                        ? "bg-blue-500 ml-auto text-white shadow-lg border-2 border-blue-400 max-w-xs"
                        : "bg-white text-gray-900 shadow-lg border-2 border-gray-300 max-w-xs"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1 sm:mb-2">
                      <span className="font-bold">
                        {message.isLocal
                          ? "👤 Tú"
                          : `👥 ${
                              message.from?.nombre ||
                              message.from?.userId ||
                              "Usuario"
                            }`}
                      </span>
                      <span
                        className={`text-xs opacity-70 whitespace-nowrap ${
                          message.isLocal ? "text-blue-100" : "text-gray-600"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="break-words font-medium">
                      {message.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Chat */}
            <div className="p-3 sm:p-4 lg:p-6 border-t-2 sm:border-t-3 lg:border-t-4 border-purple-600 bg-gradient-to-r from-purple-800 to-purple-900 flex-shrink-0">
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe aquí..."
                  className="flex-1 bg-white text-gray-900 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm lg:text-base font-semibold focus:outline-none focus:ring-2 sm:focus:ring-3 lg:focus:ring-4 focus:ring-purple-400 transition"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl transition-colors font-bold text-sm sm:text-base lg:text-lg border-2 border-green-600 shadow-lg"
                >
                  ✓
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para video remoto
function RemoteVideo({ stream, userData }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-black rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden relative shadow-lg border-2 sm:border-3 lg:border-4 border-gray-600 min-h-40 sm:min-h-48 lg:min-h-64">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 left-2 sm:left-3 lg:left-4 bg-black bg-opacity-85 px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-bold border-2 border-green-400">
        {userData?.nombre || "Usuario"}{" "}
        {userData?.rol === "medico" ? "👨‍⚕️" : "👤"}
      </div>
    </div>
  );
}
