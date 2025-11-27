// lib/cita-enriquecimiento.ts - Funciones para enriquecer datos de cita
import { pool } from "@/lib/database";

/**
 * Enriquece una cita con datos completos del paciente desde la base de datos
 * @param citaId - ID de la cita
 * @param token - Token de autenticación
 * @returns Cita enriquecida con datos del paciente
 */
export async function enriquecerCitaConDatosPaciente(
  citaId: string | number,
  token: string
) {
  try {
    const response = await fetch(`/api/citas/${citaId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ No se pudo enriquecer cita ${citaId}`);
      return null;
    }

    const data = await response.json();
    return data.cita;
  } catch (error) {
    console.error("Error enriqueciendo cita:", error);
    return null;
  }
}

/**
 * Obtiene datos completos del paciente
 * @param pacienteId - ID del paciente
 * @param token - Token de autenticación
 * @returns Datos completos del paciente
 */
export async function obtenerDatosCompletoPaciente(
  pacienteId: string | number,
  token: string
) {
  try {
    const response = await fetch(`/api/pacientes/${pacienteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ No se pudo obtener datos del paciente ${pacienteId}`);
      return null;
    }

    const data = await response.json();
    return data.paciente;
  } catch (error) {
    console.error("Error obteniendo datos del paciente:", error);
    return null;
  }
}

/**
 * Valida que una cita sea válida para crear una receta
 * @param cita - Datos de la cita
 * @returns true si es válida, false en caso contrario
 */
export function validarCitaParaReceta(cita: any): boolean {
  if (!cita) {
    console.warn("❌ Cita es nula");
    return false;
  }

  if (!cita.id) {
    console.warn("❌ Cita no tiene ID");
    return false;
  }

  if (!cita.paciente && !cita.id_paciente) {
    console.warn("❌ Cita no tiene información del paciente");
    return false;
  }

  return true;
}

/**
 * Normaliza datos de cita para asegurar que sean consistentes
 */
export function normalizarCita(cita: any): any {
  return {
    ...cita,
    // Asegurar que hay ID de paciente
    id_paciente: cita.id_paciente || cita.paciente?.id || null,
    // Asegurar que la información del paciente está disponible
    paciente: cita.paciente || {
      id: cita.id_paciente,
      nombre: "No disponible",
      apellido: "No disponible",
    },
    // Asegurar que hay fecha de cita
    fecha_cita: cita.fecha_cita || new Date().toISOString().split("T")[0],
    // Asegurar que hay hora
    hora_cita: cita.hora_cita || "00:00",
  };
}
