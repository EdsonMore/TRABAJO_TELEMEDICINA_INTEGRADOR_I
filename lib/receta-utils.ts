// lib/receta-utils.ts
import { pool } from "./database";

export interface UsuarioPayload {
  id: string;
  userId: string;
  email: string;
  rol: string;
  nombre: string;
  apellido: string;
}

export async function verificarPermisosReceta(
  usuario: UsuarioPayload,
  recetaId: string,
  client?: any
): Promise<any> {
  const useExternalClient = !!client;
  const dbClient = client || (await pool.connect());

  try {
    let query = "";
    let params: any[] = [recetaId];

    switch (usuario.rol) {
      case "paciente":
        query = `
          SELECT r.* 
          FROM recetas r
          JOIN citas c ON r.id_cita = c.id
          JOIN pacientes p ON c.id_paciente = p.id
          WHERE r.id = $1 AND p.id_usuario = $2
        `;
        params.push(usuario.id);
        break;

      case "medico":
        query = `
          SELECT r.* 
          FROM recetas r
          JOIN citas c ON r.id_cita = c.id
          JOIN medicos m ON c.id_medico = m.id
          WHERE r.id = $1 AND m.id_usuario = $2
        `;
        params.push(usuario.id);
        break;

      case "farmacia":
        query = `
          SELECT r.* 
          FROM recetas r
          WHERE r.id = $1 AND (
            r.id_farmacia_dispensadora = $2 OR 
            r.id_farmacia_dispensadora IS NULL
          )
        `;
        // Para farmacias, necesitamos obtener el ID de la farmacia
        const farmaciaResult = await dbClient.query(
          "SELECT id FROM farmacias WHERE id_usuario = $1",
          [usuario.id]
        );
        if (farmaciaResult.rows.length === 0) {
          return null;
        }
        params.push(farmaciaResult.rows[0].id);
        break;

      case "administrador":
        query = `SELECT * FROM recetas WHERE id = $1`;
        break;

      default:
        return null;
    }

    const result = await dbClient.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error verificando permisos de receta:", error);
    return null;
  } finally {
    if (!useExternalClient) {
      dbClient.release();
    }
  }
}
