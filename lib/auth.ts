// lib/auth.ts
// MediLink+ - Sistema de autenticación con JWT
// Manejo de sesiones, tokens y verificación de roles

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "./database";
import type { Usuario } from "./database";

const JWT_SECRET = process.env.JWT_SECRET || "medilink-plus-secret-key-2024";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "100d";

// Interfaz para el payload del JWT
export interface JWTPayload {
  userId: string;
  email: string;
  rol: string;
  nombre: string;
  apellido: string;
}

// Función para generar hash de contraseña
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Función para verificar contraseña
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Función para generar token JWT
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Función para verificar y decodificar token JWT
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error("Error verificando token JWT:", error);
    return null;
  }
}

export async function verificarToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    // Validaciones básicas del token
    if (!token || typeof token !== "string" || token.length < 10) {
      console.warn("Token inválido o muy corto");
      return null;
    }

    // Verificar formato básico del JWT (debe tener 3 partes separadas por puntos)
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      console.warn("Token JWT mal formado - no tiene 3 partes");
      return null;
    }

    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Verificar que el usuario aún existe y está activo
    const result = await query(
      "SELECT id, nombre, apellido, email, rol FROM usuarios WHERE id = $1 AND activo = true",
      [payload.userId]
    );

    if (result.rows.length === 0) {
      console.warn("Usuario no encontrado o inactivo");
      return null;
    }

    const usuario = result.rows[0];

    return {
      id: usuario.id,
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
    };
  } catch (error: any) {
    console.error("Error verificando token JWT:", error.message);

    // Manejar diferentes tipos de errores
    if (error.name === "JsonWebTokenError") {
      console.warn("Token JWT inválido:", error.message);
    } else if (error.name === "TokenExpiredError") {
      console.warn("Token JWT expirado");
    } else if (error.name === "NotBeforeError") {
      console.warn("Token JWT no activo aún");
    }

    return null;
  }
}

export function debugToken(token: string): void {
  if (!token) {
    console.log("❌ No hay token");
    return;
  }

  console.log("🔍 Debug del Token:");
  console.log("Longitud:", token.length);
  console.log("Primeros 10 caracteres:", token.substring(0, 10) + "...");

  try {
    const parts = token.split(".");
    console.log("Partes del token:", parts.length);

    if (parts.length === 3) {
      const header = JSON.parse(Buffer.from(parts[0], "base64").toString());
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

      console.log("Header:", header);
      console.log("Payload:", {
        ...payload,
        exp: new Date(payload.exp * 1000).toISOString(),
        iat: new Date(payload.iat * 1000).toISOString(),
      });
    }
  } catch (error) {
    console.log("❌ No se pudo decodificar el token");
  }
}

// Función para autenticar usuario (login)
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: Usuario; token: string } | null> {
  try {
    // Buscar usuario por email
    const result = await query(
      "SELECT * FROM usuarios WHERE email = $1 AND activo = true",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    // Verificar contraseña usando la función de PostgreSQL
    const passwordResult = await query(
      "SELECT (password_hash = crypt($1, password_hash)) as password_match FROM usuarios WHERE id = $2",
      [password, user.id]
    );

    if (!passwordResult.rows[0].password_match) {
      return null;
    }

    // Actualizar última conexión
    await query(
      "UPDATE usuarios SET ultima_conexion = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Generar token JWT
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      apellido: user.apellido,
    };

    const token = generateToken(tokenPayload);

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        activo: user.activo,
        fecha_registro: user.fecha_registro,
        ultima_conexion: user.ultima_conexion,
        avatar_url: user.avatar_url,
        verificado: user.verificado,
      },
      token,
    };
  } catch (error) {
    console.error("Error autenticando usuario:", error);
    return null;
  }
}

// Actualizar la función registerUser para incluir los nuevos campos
export async function registerUser(userData: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  rol: string;
  // ✅ AGREGAR campos para pacientes
  fechaNacimiento?: string;
  genero?: string;
  direccion?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
}): Promise<{ user: Usuario; token: string } | { error: string }> {
  try {
    // Verificar si el email ya existe
    const existingUser = await query(
      "SELECT id FROM usuarios WHERE email = $1",
      [userData.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return { error: "El email ya está registrado en el sistema" };
    }

    // Iniciar transacción para garantizar consistencia
    await query("BEGIN");

    try {
      // Insertar nuevo usuario usando la función crypt de PostgreSQL
      const userResult = await query(
        `
        INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, verificado)
        VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), $5, $6, false)
        RETURNING id, nombre, apellido, email, telefono, rol, activo, fecha_registro, verificado
      `,
        [
          userData.nombre,
          userData.apellido,
          userData.email.toLowerCase(),
          userData.password,
          userData.telefono,
          userData.rol,
        ]
      );

      const newUser = userResult.rows[0];

      // Insertar en tabla específica según el rol
      switch (userData.rol) {
        case "paciente":
          // ✅ USAR los datos reales del formulario
          await query(
            `INSERT INTO pacientes (id_usuario, fecha_nacimiento, sexo, direccion, dni)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              newUser.id,
              userData.fechaNacimiento,
              userData.genero, // Se mapea a 'sexo' en la base de datos
              userData.direccion,
              userData.numeroDocumento, // Se mapea a 'dni' en la base de datos
            ]
          );
          break;

        case "medico":
          await query(
            `INSERT INTO medicos (usuario_id, especialidad, numero_colegiatura, anos_experiencia, 
             universidad, titulo, descripcion, tarifa_consulta, disponible)
             VALUES ($1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true)`,
            [newUser.id]
          );
          break;

        case "farmacia":
          await query(
            `INSERT INTO farmacias (usuario_id, nombre_farmacia, direccion, distrito, provincia, 
             departamento, licencia, horario_atencion, telefono_farmacia, disponible)
             VALUES ($1, $2, NULL, NULL, NULL, NULL, NULL, NULL, $3, true)`,
            [newUser.id, `Farmacia ${userData.nombre}`, userData.telefono]
          );
          break;

        case "laboratorio":
          await query(
            `INSERT INTO laboratorios (usuario_id, nombre_laboratorio, direccion, distrito, provincia, 
             departamento, licencia, horario_atencion, telefono_laboratorio, disponible)
             VALUES ($1, $2, NULL, NULL, NULL, NULL, NULL, NULL, $3, true)`,
            [newUser.id, `Laboratorio ${userData.nombre}`, userData.telefono]
          );
          break;
      }

      // Confirmar transacción
      await query("COMMIT");

      // Generar token JWT
      const tokenPayload: JWTPayload = {
        userId: newUser.id,
        email: newUser.email,
        rol: newUser.rol,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
      };

      const token = generateToken(tokenPayload);

      return {
        user: newUser,
        token,
      };
    } catch (error) {
      // Revertir transacción en caso de error
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error registrando usuario:", error);
    return { error: "Error interno del servidor" };
  }
}

// Función para obtener usuario por ID
export async function getUserById(userId: string): Promise<Usuario | null> {
  try {
    const result = await query(
      "SELECT * FROM usuarios WHERE id = $1 AND activo = true",
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return null;
  }
}

// Middleware para verificar autenticación
export function requireAuth(allowedRoles?: string[]) {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de acceso requerido" });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    // Verificar roles permitidos
    if (allowedRoles && !allowedRoles.includes(payload.rol)) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para acceder a este recurso" });
    }

    req.user = payload;
    next();
  };
}

// Función para verificar si un usuario tiene un rol específico
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

// Función para cambiar contraseña
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  try {
    // Verificar contraseña actual
    const result = await query(
      "SELECT (password_hash = crypt($1, password_hash)) as password_match FROM usuarios WHERE id = $2",
      [currentPassword, userId]
    );

    if (!result.rows[0].password_match) {
      return false;
    }

    // Actualizar con nueva contraseña
    await query(
      "UPDATE usuarios SET password_hash = crypt($1, gen_salt('bf')) WHERE id = $2",
      [newPassword, userId]
    );

    return true;
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    return false;
  }
}
