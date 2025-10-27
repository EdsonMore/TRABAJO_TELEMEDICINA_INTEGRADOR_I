// lib/api/utils.ts
import { NextResponse } from "next/server";

export function handleApiError(error: any, context: string = "") {
  console.error(`API Error [${context}]:`, error);

  // Errores de validación Zod
  if (error.name === "ZodError") {
    return NextResponse.json(
      {
        error: "Datos de entrada inválidos",
        details: error.errors.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Errores de base de datos PostgreSQL
  if (error.code) {
    switch (error.code) {
      case "23505": // Unique violation
        return NextResponse.json(
          { error: "El recurso ya existe" },
          { status: 409 }
        );
      case "23503": // Foreign key violation
        return NextResponse.json(
          { error: "Referencia inválida" },
          { status: 400 }
        );
      case "23502": // Not null violation
        return NextResponse.json(
          { error: "Campos requeridos faltantes" },
          { status: 400 }
        );
      case "22P02": // Invalid text representation
        return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
  }

  // Error genérico
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}

export function validateIdParam(id: string): boolean {
  return /^\d+$/.test(id);
}

export function buildPaginationResponse(
  data: any[],
  totalCount: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
