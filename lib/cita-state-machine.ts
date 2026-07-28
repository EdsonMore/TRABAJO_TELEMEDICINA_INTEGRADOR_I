/**
 * lib/cita-state-machine.ts
 * 
 * ✅ MÁQUINA DE ESTADOS PROFESIONAL PARA CITAS
 * 
 * Estados válidos de una cita:
 * - programada  → Estado inicial después de crear cita (pago pendiente)
 * - confirmada  → Pago completado
 * - en_curso    → La cita está sucediendo ahora (solo para VIRTUAL)
 * - completada  → Finalizada exitosamente
 * - cancelada   → Cancelada por paciente o médico
 * - no_asistio  → Paciente no presentó
 * 
 * TIPOS DE CITA:
 * - virtual    → Videollamada (requiere "En progreso")
 * - domicilio  → A domicilio (sin "En progreso")
 * - presencial → En clínica (sin "En progreso")
 * 
 * DIAGRAMA DE TRANSICIONES POR TIPO:
 * 
 * VIRTUAL:
 *         ┌────────────────────┐
 *         │   PROGRAMADA       │
 *         └─────────┬──────────┘
 *                   │ (pago completado)
 *                   ↓
 *         ┌────────────────────┐
 *         │   CONFIRMADA       │
 *         └─────────┬──────────┘
 *                   │ (inicia videollamada)
 *                   ↓
 *         ┌────────────────────┐
 *         │   EN_CURSO         │
 *         └─────────┬──────────┘
 *                   │ (termina videollamada)
 *                   ↓
 *         ┌────────────────────┐
 *         │   COMPLETADA       │
 *         └────────────────────┘
 *
 * DOMICILIO / PRESENCIAL:
 *         ┌────────────────────┐
 *         │   PROGRAMADA       │
 *         └─────────┬──────────┘
 *                   │ (pago completado)
 *                   ↓
 *         ┌────────────────────┐
 *         │   CONFIRMADA       │
 *         └─────────┬──────────┘
 *                   │ (cita realizada)
 *                   ↓
 *         ┌────────────────────┐
 *         │   COMPLETADA       │
 *         └────────────────────┘
 */

export type EstadoCita = 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio';
export type TipoCita = 'virtual' | 'domicilio' | 'presencial';

export interface TransicionValidada {
  esValida: boolean;
  razon?: string;
  motivo_rechazo?: string;
}

/**
 * MÁQUINA DE ESTADOS: Validación de transiciones
 * Define qué transiciones son permitidas desde cada estado
 * 
 * ⚠️ IMPORTANTE: Para VIRTUAL, "En progreso" es OBLIGATORIO
 *                Para DOMICILIO/PRESENCIAL, se salta "En progreso"
 */
const TRANSICIONES_PERMITIDAS: Record<EstadoCita, EstadoCita[]> = {
  programada: [
    'confirmada',      // Pago completado
    'cancelada',       // Cancelar antes de confirmar
    'no_asistio'       // Paciente no se presentó (raro, pero posible)
  ],
  
  confirmada: [
    'en_curso',        // Para VIRTUAL: Cita en progreso
    'completada',      // Para DOMICILIO/PRESENCIAL: Completar directamente
    'cancelada',       // Cancelar antes de que ocurra
    'no_asistio'       // Paciente no se presentó
  ],
  
  en_curso: [
    'completada',      // Finalizar cita (solo VIRTUAL)
    'no_asistio'       // Paciente se desconectó/no asistió
  ],
  
  completada: [
    // Una cita completada no puede cambiar a otro estado (es terminal)
  ],
  
  cancelada: [
    // Una cita cancelada no puede cambiar a otro estado (es terminal)
  ],
  
  no_asistio: [
    // Un "no asistió" no puede cambiar a otro estado (es terminal)
  ]
};

/**
 * Validar si una transición de estado es permitida
 * CONSIDERANDO EL TIPO DE CITA
 * 
 * @param estadoActual - Estado actual de la cita
 * @param nuevoEstado - Nuevo estado propuesto
 * @param tipoCita - Tipo de cita (virtual, domicilio, presencial)
 * @returns {TransicionValidada} Objeto con validación y razón si es inválida
 * 
 * EJEMPLOS:
 * ✅ (virtual) confirmada → en_curso (permitido)
 * ✅ (domicilio) confirmada → completada (permitido)
 * ❌ (virtual) confirmada → completada (NO permitido - debe pasar por en_curso)
 * ❌ (domicilio) confirmada → en_curso (NO permitido)
 */
export function validarTransicion(
  estadoActual: EstadoCita,
  nuevoEstado: EstadoCita,
  tipoCita?: TipoCita
): TransicionValidada {
  // No cambiar si es el mismo estado
  if (estadoActual === nuevoEstado) {
    return {
      esValida: true,
      razon: 'El estado ya es el mismo'
    };
  }

  // Obtener estados permitidos considerando el tipo de cita
  const estadosPermitidos = obtenerEstadosPermitidos(estadoActual, tipoCita);
  
  if (!estadosPermitidos.includes(nuevoEstado)) {
    return {
      esValida: false,
      razon: `No se puede pasar de "${estadoActual}" a "${nuevoEstado}"`,
      motivo_rechazo: getMotivoPorTransicionInvalida(estadoActual, nuevoEstado, tipoCita)
    };
  }

  return {
    esValida: true,
    razon: `Transición válida: ${estadoActual} → ${nuevoEstado}`
  };
}

/**
 * Obtener descripción del motivo por el cual una transición es inválida
 */
function getMotivoPorTransicionInvalida(
  estadoActual: EstadoCita,
  nuevoEstado: EstadoCita,
  tipoCita?: TipoCita
): string {
  // Estados terminales
  if (estadoActual === 'completada') {
    return 'Una cita completada no puede cambiar de estado (es terminal)';
  }
  if (estadoActual === 'cancelada') {
    return 'Una cita cancelada no puede cambiar de estado (es terminal)';
  }
  if (estadoActual === 'no_asistio') {
    return 'Un "no asistió" no puede cambiar de estado (es terminal)';
  }

  // Transiciones ilógicas específicas por tipo de cita
  if (tipoCita === 'virtual') {
    if (estadoActual === 'confirmada' && nuevoEstado === 'completada') {
      return 'Para citas VIRTUALES, debe pasar por "En progreso" antes de completar. Inicie la videollamada primero.';
    }
  }

  if ((tipoCita === 'domicilio' || tipoCita === 'presencial') && estadoActual === 'confirmada' && nuevoEstado === 'en_curso') {
    return `Para citas a ${tipoCita}, no se requiere pasar por "En progreso". Marque como completada directamente.`;
  }

  // Transiciones ilógicas generales
  if (estadoActual === 'programada' && nuevoEstado === 'en_curso') {
    return 'La cita debe ser confirmada antes de poder iniciarla';
  }
  if (estadoActual === 'programada' && nuevoEstado === 'completada') {
    return 'La cita debe ser confirmada antes de poder completarla';
  }

  return 'Transición no permitida según la máquina de estados';
}

/**
 * Obtener los estados permitidos desde el estado actual
 * CONSIDERANDO EL TIPO DE CITA
 * 
 * @param estadoActual - Estado actual de la cita
 * @param tipoCita - Tipo de cita (virtual, domicilio, presencial)
 * @returns Estados permitidos para transicionar
 */
export function obtenerEstadosPermitidos(
  estadoActual: EstadoCita,
  tipoCita?: TipoCita
): EstadoCita[] {
  const estadosBasicos = TRANSICIONES_PERMITIDAS[estadoActual] || [];
  
  // Si no se especifica tipo de cita, retornar todos (compatibilidad hacia atrás)
  if (!tipoCita) {
    return estadosBasicos;
  }

  // Lógica inteligente por tipo de cita
  if (tipoCita === 'virtual') {
    // Para VIRTUAL: Se requiere pasar por "En progreso"
    // No permitir ir directo a "Completada" desde "Confirmada"
    if (estadoActual === 'confirmada') {
      return estadosBasicos.filter(
        estado => estado !== 'completada' // Excluir completada directa
      );
    }
  } else if (tipoCita === 'domicilio' || tipoCita === 'presencial') {
    // Para DOMICILIO/PRESENCIAL: No se puede ir a "En progreso"
    // Permitir ir directo a "Completada" desde "Confirmada"
    if (estadoActual === 'confirmada') {
      return estadosBasicos.filter(
        estado => estado !== 'en_curso' // Excluir "En progreso"
      );
    }
  }

  return estadosBasicos;
}

/**
 * Describir un estado en lenguaje natural
 */
export function describirEstado(estado: EstadoCita): string {
  const descripciones: Record<EstadoCita, string> = {
    programada: 'Programada (esperando pago)',
    confirmada: 'Confirmada (pago completado)',
    en_curso: 'En progreso',
    completada: 'Completada',
    cancelada: 'Cancelada',
    no_asistio: 'Paciente no asistió'
  };
  return descripciones[estado] || estado;
}

/**
 * Obtener color de badge para cada estado
 */
export function obtenerColorEstado(estado: EstadoCita): string {
  const colores: Record<EstadoCita, string> = {
    programada: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    confirmada: 'bg-blue-100 text-blue-800 border-blue-300',
    en_curso: 'bg-orange-100 text-orange-800 border-orange-300',
    completada: 'bg-green-100 text-green-800 border-green-300',
    cancelada: 'bg-red-100 text-red-800 border-red-300',
    no_asistio: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return colores[estado] || 'bg-gray-100 text-gray-800';
}

/**
 * Verificar si un estado es terminal (no puede cambiar más)
 */
export function esEstadoTerminal(estado: EstadoCita): boolean {
  const estadosTerminales: EstadoCita[] = ['completada', 'cancelada', 'no_asistio'];
  return estadosTerminales.includes(estado);
}

/**
 * Verificar si un estado requiere pago
 */
export function requierePago(estado: EstadoCita): boolean {
  return estado === 'programada';
}

/**
 * Verificar si la cita está activa (puede tener acciones)
 */
export function citaActiva(estado: EstadoCita): boolean {
  const estadosActivos: EstadoCita[] = ['programada', 'confirmada', 'en_curso'];
  return estadosActivos.includes(estado);
}

/**
 * Obtener próximo estado recomendado (para flujo automático)
 * NOTA: Es solo una sugerencia, no está garantizado que sea válido
 */
export function obtenerProxEstadoRecomendado(estadoActual: EstadoCita): EstadoCita | null {
  const sugerencias: Record<EstadoCita, EstadoCita | null> = {
    programada: 'confirmada',      // Pago completado
    confirmada: 'en_curso',        // Hora de cita llegó
    en_curso: 'completada',        // Cita terminó
    completada: null,              // Terminal
    cancelada: null,               // Terminal
    no_asistio: null               // Terminal
  };
  return sugerencias[estadoActual] || null;
}

/**
 * VALIDACIÓN COMPLETA ANTES DE GUARDAR
 * Combina validación de transición + contexto
 */
export function validarCambioEstado(
  estadoActual: EstadoCita,
  nuevoEstado: EstadoCita,
  contexto?: {
    pagoPendiente?: boolean;
    citaEnPasado?: boolean;
    esAbandono?: boolean;
  }
): TransicionValidada {
  // 1. Validar transición básica
  const validacionBasica = validarTransicion(estadoActual, nuevoEstado);
  if (!validacionBasica.esValida) {
    return validacionBasica;
  }

  // 2. Validaciones de contexto
  if (nuevoEstado === 'confirmada' && contexto?.pagoPendiente) {
    return {
      esValida: false,
      razon: 'No se puede confirmar una cita con pago pendiente',
      motivo_rechazo: 'El pago debe estar completado antes de confirmar'
    };
  }

  if (nuevoEstado === 'en_curso' && contexto?.citaEnPasado) {
    return {
      esValida: false,
      razon: 'La fecha/hora de la cita ya pasó',
      motivo_rechazo: 'No se puede iniciar una cita en el pasado'
    };
  }

  // Todas las validaciones pasaron
  return validacionBasica;
}

/**
 * HISTÓRICO DE ESTADO
 * Registra transiciones para auditoría
 */
export interface RegistroTransicion {
  estadoAnterior: EstadoCita;
  estadoNuevo: EstadoCita;
  timestamp: Date;
  usuario?: string;
  razon?: string;
}

export class HistoricoEstados {
  private historial: RegistroTransicion[] = [];

  agregar(transicion: RegistroTransicion) {
    this.historial.push(transicion);
  }

  obtener(): RegistroTransicion[] {
    return [...this.historial]; // Retornar copia para evitar mutaciones
  }

  obtenerUltimo(): RegistroTransicion | undefined {
    return this.historial[this.historial.length - 1];
  }

  obtenerPor(estado: EstadoCita): RegistroTransicion[] {
    return this.historial.filter(t => t.estadoNuevo === estado);
  }

  limpiar() {
    this.historial = [];
  }
}
