/**
 * lib/cita-utils.ts
 * Utilidades centralizadas para lógica de citas y permisos de acciones
 * Soporta: virtual, presencial, domicilio
 */

export interface Cita {
  id: string;
  tipo_cita: "virtual" | "presencial" | "domicilio";
  estado: "confirmada" | "programada" | "completada" | "cancelada" | "iniciada";
  fecha_cita: string;
  hora_cita: string;
  motivo_consulta?: string;
  paciente?: {
    id?: string;
    nombre?: string;
    apellido?: string;
    edad?: number;
    telefono?: string;
    email?: string;
  };
}

/**
 * Verifica si el médico puede unirse a una videollamada
 * Solo aplica para citas VIRTUALES, en estados válidos y con fecha actual/futura
 */
export function puedeUnirseAVideollamada(cita: Cita): boolean {
  if (!cita) return false;

  const esVirtual = cita.tipo_cita === "virtual";
  const estadoValido = ["confirmada", "programada", "iniciada"].includes(
    cita.estado
  );
  
  // Validación correcta de fecha
  const hoyDate = new Date();
  hoyDate.setHours(0, 0, 0, 0);
  
  // Parsear fecha_cita (formato: "2025-11-15")
  const [año, mes, día] = cita.fecha_cita.split("-");
  const fechaCitaDate = new Date(parseInt(año), parseInt(mes) - 1, parseInt(día));
  fechaCitaDate.setHours(0, 0, 0, 0);
  
  const esFechaValida = fechaCitaDate >= hoyDate;

  return esVirtual && estadoValido && esFechaValida;
}

/**
 * Verifica si se puede crear receta para esta cita
 * Aplica para cualquier tipo de cita, si está en estado completada, confirmada o iniciada
 */
export function puedeCrearReceta(cita: Cita): boolean {
  if (!cita) return false;

  // Se puede crear receta en cualquier tipo de cita que esté activa o completada
  const estadoValido = [
    "confirmada",
    "programada",
    "iniciada",
    "completada",
  ].includes(cita.estado);

  // No se puede crear receta si la cita fue cancelada
  if (cita.estado === "cancelada") return false;

  return estadoValido;
}

/**
 * Verifica si se pueden solicitar exámenes
 * Aplica para cualquier tipo de cita en estado válido
 */
export function puedeSolicitarExamenes(cita: Cita): boolean {
  if (!cita) return false;

  const estadoValido = [
    "confirmada",
    "programada",
    "iniciada",
    "completada",
  ].includes(cita.estado);

  if (cita.estado === "cancelada") return false;

  return estadoValido;
}

/**
 * Verifica si se puede ver el perfil del paciente
 * Siempre permite (no hay restricción)
 */
export function puedeVerPerfilPaciente(cita: Cita): boolean {
  return !!(cita && cita.paciente?.id);
}

/**
 * Verifica si se puede ver el historial del paciente
 * Se puede ver si hay una cita confirmada/completada/iniciada
 */
export function puedeVerHistorialPaciente(cita: Cita): boolean {
  if (!cita) return false;

  const estadoValido = ["confirmada", "iniciada", "completada"].includes(
    cita.estado
  );

  return estadoValido && !!cita.paciente?.id;
}

/**
 * Calcula el estilo/color de badge para el tipo de cita
 */
export function getEstiloCita(
  tipo: string
): "blue" | "green" | "purple" | "default" {
  switch (tipo) {
    case "virtual":
      return "blue";
    case "presencial":
      return "green";
    case "domicilio":
      return "purple";
    default:
      return "default";
  }
}

/**
 * Retorna etiqueta legible para tipo de cita
 */
export function getEtiquetaCita(tipo: string): string {
  switch (tipo) {
    case "virtual":
      return "Consulta Virtual";
    case "presencial":
      return "Consulta Presencial";
    case "domicilio":
      return "Visita a Domicilio";
    default:
      return "Cita Médica";
  }
}

/**
 * Retorna descripción breve del tipo de cita
 */
export function getDescripcionCita(tipo: string): string {
  switch (tipo) {
    case "virtual":
      return "Consulta por videollamada";
    case "presencial":
      return "Consulta en consultorio";
    case "domicilio":
      return "Visita médica a domicilio";
    default:
      return "Cita médica";
  }
}

/**
 * Retorna las acciones permitidas para una cita
 * Útil para renderizar menús dinámicos
 */
export function getAccionesCita(cita: Cita): {
  videollamada: boolean;
  receta: boolean;
  examenes: boolean;
  perfil: boolean;
  historial: boolean;
} {
  return {
    videollamada: puedeUnirseAVideollamada(cita),
    receta: puedeCrearReceta(cita),
    examenes: puedeSolicitarExamenes(cita),
    perfil: puedeVerPerfilPaciente(cita),
    historial: puedeVerHistorialPaciente(cita),
  };
}

/**
 * Verifica si la cita está próxima (próximas 24 horas)
 */
export function estaCitaProxima(cita: Cita): boolean {
  if (!cita) return false;

  const ahora = new Date();
  const fechaCita = new Date(cita.fecha_cita + " " + cita.hora_cita);
  const diferencia = fechaCita.getTime() - ahora.getTime();
  const proximaEn24h = diferencia > 0 && diferencia <= 24 * 60 * 60 * 1000;

  return proximaEn24h;
}

/**
 * Retorna el texto de tooltip para una acción deshabilitada
 */
export function getTooltipAccionDeshabilitada(
  accion: string,
  cita: Cita
): string {
  switch (accion) {
    case "videollamada":
      if (cita.tipo_cita !== "virtual")
        return "Solo disponible para consultas virtuales";
      if (!["confirmada", "programada", "iniciada"].includes(cita.estado))
        return "La cita debe estar confirmada o en progreso";
      return "La fecha de la cita debe ser hoy o posterior";

    case "receta":
    case "examenes":
      if (cita.estado === "cancelada")
        return "No se pueden crear recetas en citas canceladas";
      return "No disponible en este momento";

    case "historial":
      if (cita.estado === "programada")
        return "Ver historial solo después de iniciar la cita";
      return "No disponible";

    default:
      return "No disponible";
  }
}
