// lib/database.ts
// MediLink+ - Configuración de conexión a PostgreSQL
// Utilidades para conectar y ejecutar consultas en la base de datos

import { Pool, type PoolClient } from "pg"

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.POSTGRES_USER || "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  database: process.env.POSTGRES_DB || "medilink_plus",
  password: process.env.POSTGRES_PASSWORD || "password",
  port: Number.parseInt(process.env.POSTGRES_PORT || "5432"),
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20, // Máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // Tiempo de espera antes de cerrar conexiones inactivas
  connectionTimeoutMillis: 2000, // Tiempo máximo para establecer conexión
})

export { pool }

// Función para ejecutar consultas SQL
export async function query(text: string, params?: any[]): Promise<any> {
  const client: PoolClient = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } catch (error) {
    console.error("Error ejecutando consulta SQL:", error)
    throw error
  } finally {
    client.release()
  }
}

// Función para ejecutar transacciones
export async function transaction(callback: (client: PoolClient) => Promise<any>): Promise<any> {
  const client: PoolClient = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error en transacción:", error)
    throw error
  } finally {
    client.release()
  }
}

// Función para verificar la conexión a la base de datos
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query("SELECT NOW() as current_time")
    console.log("Conexión a PostgreSQL exitosa:", result.rows[0].current_time)
    return true
  } catch (error) {
    console.error("Error conectando a PostgreSQL:", error)
    return false
  }
}

// Función para cerrar el pool de conexiones
export async function closePool(): Promise<void> {
  await pool.end()
}

// Tipos TypeScript para las entidades principales
export interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  rol: "paciente" | "medico" | "farmacia" | "laboratorio" | "administrador"
  activo: boolean
  fecha_registro: Date
  ultima_conexion?: Date
  avatar_url?: string
  verificado: boolean
}

export interface Paciente {
  id: string
  id_usuario: string
  fecha_nacimiento: Date
  sexo: "masculino" | "femenino" | "otro"
  direccion: string
  dni: string
  tipo_sangre?: string
  alergias?: string
  enfermedades_cronicas?: string
  contacto_emergencia_nombre?: string
  contacto_emergencia_telefono?: string
  seguro_medico?: string
  peso_kg?: number
  altura_cm?: number
  // Datos del usuario relacionado
  usuario?: Usuario
}

export interface Medico {
  id: string
  id_usuario: string
  id_especialidad: number
  numero_colegiatura: string
  anos_experiencia: number
  direccion_consultorio?: string
  horario_atencion?: any
  tarifa_consulta?: number
  calificacion_promedio: number
  total_consultas: number
  biografia?: string
  // Datos relacionados
  usuario?: Usuario
  especialidad?: string
}

export interface Cita {
  id: string
  id_paciente: string
  id_medico: string
  fecha_cita: Date
  hora_cita: string
  tipo_cita: "presencial" | "virtual" | "domicilio"
  estado: "programada" | "confirmada" | "en_curso" | "completada" | "cancelada" | "no_asistio"
  motivo_consulta: string
  observaciones_paciente?: string
  diagnostico?: string
  tratamiento?: string
  observaciones_medico?: string
  costo?: number
  pagado: boolean
  // Datos relacionados
  paciente?: Paciente
  medico?: Medico
}

export interface Medicamento {
  id: number
  nombre: string
  nombre_generico?: string
  laboratorio?: string
  presentacion?: string
  principio_activo?: string
  categoria?: string
  requiere_receta: boolean
  dosis_recomendada?: string
  codigo_digemid?: string
}

export interface AlertaSalud {
  id: string
  titulo: string
  descripcion: string
  tipo_alerta: "brote" | "epidemia" | "prevencion" | "vacunacion" | "emergencia"
  nivel_gravedad: "bajo" | "medio" | "alto" | "critico"
  fecha_inicio: Date
  fecha_fin?: Date
  activa: boolean
  total_afectados: number
  medidas_preventivas?: string
}
