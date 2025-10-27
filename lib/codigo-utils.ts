// lib/codigo-utils.ts
import { pool } from "./database";

/**
 * Genera un código único para recetas en formato: REC-YYYYMMDD-XXXXX
 */
export async function generateCodigoReceta(): Promise<string> {
  const client = await pool.connect();

  try {
    // Obtener la fecha actual en formato YYYYMMDD
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");

    // Buscar el último número secuencial del día
    const result = await client.query(
      `SELECT codigo_receta 
       FROM recetas 
       WHERE codigo_receta LIKE $1 
       ORDER BY codigo_receta DESC 
       LIMIT 1`,
      [`REC-${datePart}-%`]
    );

    let sequentialNumber = 1;

    if (result.rows.length > 0) {
      const lastCode = result.rows[0].codigo_receta;
      const lastNumber = parseInt(lastCode.split("-")[2]) || 0;
      sequentialNumber = lastNumber + 1;
    }

    // Formatear el número secuencial con ceros a la izquierda
    const sequentialPart = sequentialNumber.toString().padStart(5, "0");

    return `REC-${datePart}-${sequentialPart}`;
  } catch (error) {
    console.error("Error generando código de receta:", error);
    // Fallback: usar timestamp
    const timestamp = Date.now().toString().slice(-8);
    return `REC-EMG-${timestamp}`;
  } finally {
    client.release();
  }
}

/**
 * Genera código único para solicitudes de examen
 */
export async function generateCodigoSolicitudExamen(): Promise<string> {
  const client = await pool.connect();

  try {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");

    const result = await client.query(
      `SELECT codigo_solicitud 
       FROM solicitudes_examenes 
       WHERE codigo_solicitud LIKE $1 
       ORDER BY codigo_solicitud DESC 
       LIMIT 1`,
      [`EXM-${datePart}-%`]
    );

    let sequentialNumber = 1;

    if (result.rows.length > 0) {
      const lastCode = result.rows[0].codigo_solicitud;
      const lastNumber = parseInt(lastCode.split("-")[2]) || 0;
      sequentialNumber = lastNumber + 1;
    }

    const sequentialPart = sequentialNumber.toString().padStart(5, "0");
    return `EXM-${datePart}-${sequentialPart}`;
  } catch (error) {
    console.error("Error generando código de examen:", error);
    const timestamp = Date.now().toString().slice(-8);
    return `EXM-EMG-${timestamp}`;
  } finally {
    client.release();
  }
}
