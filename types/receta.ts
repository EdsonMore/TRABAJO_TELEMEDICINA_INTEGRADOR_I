// types/receta.ts - NUEVO
export interface MedicamentoReceta {
  id: string;
  medicamento_id: number;
  nombre_comercial: string;
  nombre_generico: string;
  forma_farmaceutica?: string;
  concentracion?: string;
  cantidad: number;
  dosis: string;
  frecuencia: string;
  duracion_dias: number;
  via_administracion?: string;
  instrucciones_especiales?: string;
  dispensado: boolean;
}

export interface Receta {
  id: string;
  codigo_receta: string;
  diagnostico_principal_texto: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  observaciones?: string;
  estado: "activa" | "dispensada" | "vencida" | "cancelada";
  paciente_id: string;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  paciente_edad: number;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  total_medicamentos: number;
  sello_temporal: string;
}

export interface Cita {
  id: string;
  paciente_id: string;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  paciente_edad: number;
  fecha_cita: string;
  motivo_consulta: string;
  estado: string;
  tipo_cita: string;
  sexo?: string;
  tipo_sangre?: string;
}
