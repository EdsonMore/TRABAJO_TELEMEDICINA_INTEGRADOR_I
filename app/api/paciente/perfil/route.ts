// app/api/paciente/perfil/route.ts
// MediLink+ - API para obtener perfil completo del paciente
// Endpoint que retorna toda la información personal y médica del paciente

import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    // Obtener información completa del paciente con datos del usuario y ubicación
    const result = await pool.query(
      `
  SELECT 
    p.*,
    u.nombre, u.apellido, u.email, u.telefono, u.fecha_registro, u.ultima_conexion, u.avatar_url,
    ub.departamento, ub.provincia, ub.distrito
  FROM pacientes p
  JOIN usuarios u ON p.id_usuario = u.id
  LEFT JOIN ubicaciones ub ON p.id_ubicacion = ub.id
  WHERE p.id_usuario = $1
  `,
      [usuario.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Perfil de paciente no encontrado" },
        { status: 404 }
      );
    }

    const paciente = result.rows[0];

    // Calcular edad
    const fechaNacimiento = new Date(paciente.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const m = hoy.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    // Calcular IMC si hay peso y altura
    let imc = null;
    if (paciente.peso_kg && paciente.altura_cm) {
      const alturaM = paciente.altura_cm / 100;
      imc = (paciente.peso_kg / (alturaM * alturaM)).toFixed(1);
    }

    return NextResponse.json({
      id: paciente.id,
      usuario: {
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        email: paciente.email,
        telefono: paciente.telefono,
        avatar_url: paciente.avatar_url,
        fecha_registro: paciente.fecha_registro,
        ultima_conexion: paciente.ultima_conexion,
      },
      informacion_personal: {
        dni: paciente.dni,
        fecha_nacimiento: paciente.fecha_nacimiento,
        edad: edad,
        sexo: paciente.sexo,
        tipo_sangre: paciente.tipo_sangre,
        direccion: paciente.direccion,
        ubicacion: {
          departamento: paciente.departamento,
          provincia: paciente.provincia,
          distrito: paciente.distrito,
        },
      },
      informacion_medica: {
        peso_kg: paciente.peso_kg,
        altura_cm: paciente.altura_cm,
        imc: imc,
        alergias: paciente.alergias,
        enfermedades_cronicas: paciente.enfermedades_cronicas,
        seguro_medico: paciente.seguro_medico,
        numero_seguro: paciente.numero_seguro,
      },
      contacto_emergencia: {
        nombre: paciente.contacto_emergencia_nombre,
        telefono: paciente.contacto_emergencia_telefono,
      },
      fecha_actualizacion: paciente.fecha_actualizacion,
    });
  } catch (error) {
    console.error("Error obteniendo perfil del paciente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      telefono,
      direccion,
      departamento,
      provincia,
      distrito,
      peso_kg,
      altura_cm,
      tipo_sangre,
      alergias,
      enfermedades_cronicas,
      seguro_medico,
      contacto_emergencia_nombre,
      contacto_emergencia_telefono,
    } = body;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Actualizar información del usuario (teléfono)
      if (telefono !== undefined) {
        await client.query("UPDATE usuarios SET telefono = $1 WHERE id = $2", [
          telefono,
          usuario.id,
        ]);
      }

      // Buscar o crear ubicación
      let ubicacionId = null;
      if (departamento && provincia && distrito) {
        const ubicacionResult = await client.query(
          `INSERT INTO ubicaciones (departamento, provincia, distrito) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (departamento, provincia, distrito) 
           DO UPDATE SET departamento = EXCLUDED.departamento 
           RETURNING id`,
          [departamento, provincia, distrito]
        );
        ubicacionId = ubicacionResult.rows[0].id;
      }

      // Actualizar información del paciente
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (direccion !== undefined) {
        updateFields.push(`direccion = $${paramCount}`);
        updateValues.push(direccion);
        paramCount++;
      }

      // ✅ CORREGIDO: usar id_ubicacion en lugar de ubicacion_id
      if (ubicacionId) {
        updateFields.push(`id_ubicacion = $${paramCount}`);
        updateValues.push(ubicacionId);
        paramCount++;
      }

      if (peso_kg !== undefined && peso_kg !== "") {
        updateFields.push(`peso_kg = $${paramCount}`);
        updateValues.push(Number.parseFloat(peso_kg) || null);
        paramCount++;
      }

      if (altura_cm !== undefined && altura_cm !== "") {
        updateFields.push(`altura_cm = $${paramCount}`);
        updateValues.push(Number.parseInt(altura_cm) || null);
        paramCount++;
      }

      if (tipo_sangre !== undefined) {
        updateFields.push(`tipo_sangre = $${paramCount}`);
        updateValues.push(tipo_sangre || null);
        paramCount++;
      }

      if (alergias !== undefined) {
        updateFields.push(`alergias = $${paramCount}`);
        updateValues.push(alergias || null);
        paramCount++;
      }

      if (enfermedades_cronicas !== undefined) {
        updateFields.push(`enfermedades_cronicas = $${paramCount}`);
        updateValues.push(enfermedades_cronicas || null);
        paramCount++;
      }

      if (seguro_medico !== undefined) {
        updateFields.push(`seguro_medico = $${paramCount}`);
        updateValues.push(seguro_medico || null);
        paramCount++;
      }

      if (contacto_emergencia_nombre !== undefined) {
        updateFields.push(`contacto_emergencia_nombre = $${paramCount}`);
        updateValues.push(contacto_emergencia_nombre || null);
        paramCount++;
      }

      if (contacto_emergencia_telefono !== undefined) {
        updateFields.push(`contacto_emergencia_telefono = $${paramCount}`);
        updateValues.push(contacto_emergencia_telefono || null);
        paramCount++;
      }

      // Siempre actualizar fecha de actualización
      updateFields.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);

      if (updateFields.length > 0) {
        const updateQuery = `
          UPDATE pacientes 
          SET ${updateFields.join(", ")} 
          WHERE id_usuario = $${paramCount}
        `;
        updateValues.push(usuario.id);

        await client.query(updateQuery, updateValues);
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Perfil actualizado correctamente",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error actualizando perfil del paciente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
