// MediLink+ - API de administración de usuarios
// Endpoints para gestionar médicos, farmacias y laboratorios

import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"
import { verificarToken } from "@/lib/auth"

// GET - Obtener todos los usuarios (excepto pacientes)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }
    const authResult = await verificarToken(token)
    if (!authResult || authResult.rol !== "administrador") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 })
    }

    // Consulta para obtener usuarios con información adicional según el rol
    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        u.rol,
        u.estado,
        u.fecha_registro,
        m.especialidad,
        m.numero_licencia,
        f.nombre_establecimiento as farmacia_nombre,
        f.direccion as farmacia_direccion,
        l.nombre_laboratorio,
        l.direccion as laboratorio_direccion
      FROM usuarios u
      LEFT JOIN medicos m ON u.id = m.usuario_id
      LEFT JOIN farmacias f ON u.id = f.usuario_id
      LEFT JOIN laboratorios l ON u.id = l.usuario_id
      WHERE u.rol IN ('medico', 'farmacia', 'laboratorio')
      ORDER BY u.fecha_registro DESC
    `

    const result = await pool.query(query)

    const usuarios = result.rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      telefono: row.telefono,
      rol: row.rol,
      estado: row.estado,
      fechaRegistro: row.fecha_registro,
      especialidad: row.especialidad,
      numeroLicencia: row.numero_licencia,
      nombreEstablecimiento: row.farmacia_nombre || row.nombre_laboratorio,
      direccion: row.farmacia_direccion || row.laboratorio_direccion,
    }))

    return NextResponse.json({
      success: true,
      usuarios,
    })
  } catch (error) {
    console.error("Error obteniendo usuarios:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST - Registrar nuevo usuario (médico, farmacia o laboratorio)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }
    const authResult = await verificarToken(token)
    if (!authResult || authResult.rol !== "administrador") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      nombre,
      apellido,
      email,
      password,
      telefono,
      rol,
      // Campos específicos según el rol
      especialidad,
      numeroLicencia,
      nombreEstablecimiento,
      direccion,
      nombreLaboratorio,
    } = body

    // Validaciones básicas
    if (!nombre || !apellido || !email || !password || !rol) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }

    if (!["medico", "farmacia", "laboratorio"].includes(rol)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
    }

    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      // Verificar si el email ya existe
      const emailCheck = await client.query("SELECT id FROM usuarios WHERE email = $1", [email])

      if (emailCheck.rows.length > 0) {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
      }

      // Hashear contraseña
      const bcrypt = require("bcryptjs")
      const hashedPassword = await bcrypt.hash(password, 12)

      // Insertar usuario
      const userResult = await client.query(
        `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol, estado)
         VALUES ($1, $2, $3, $4, $5, $6, 'activo')
         RETURNING id`,
        [nombre, apellido, email, hashedPassword, telefono, rol],
      )

      const userId = userResult.rows[0].id

      // Insertar información específica según el rol
      if (rol === "medico") {
        await client.query(
          `INSERT INTO medicos (usuario_id, especialidad, numero_licencia)
           VALUES ($1, $2, $3)`,
          [userId, especialidad, numeroLicencia],
        )
      } else if (rol === "farmacia") {
        await client.query(
          `INSERT INTO farmacias (usuario_id, nombre_establecimiento, direccion)
           VALUES ($1, $2, $3)`,
          [userId, nombreEstablecimiento, direccion],
        )
      } else if (rol === "laboratorio") {
        await client.query(
          `INSERT INTO laboratorios (usuario_id, nombre_laboratorio, direccion)
           VALUES ($1, $2, $3)`,
          [userId, nombreLaboratorio, direccion],
        )
      }

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        message: "Usuario registrado exitosamente",
        userId,
      })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error registrando usuario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
