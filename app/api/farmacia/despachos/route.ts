// app/api/farmacia/despachos/route.ts
// DEPRECATED: Este endpoint ha sido migrado
// Los despachos ahora se manejan a través de /api/farmacia/recetas/{id}/procesar
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Este endpoint ha sido deprecado",
      message: "Use /api/farmacia/recetas en su lugar para obtener recetas en diferentes estados",
    },
    { status: 410 }
  );
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Este endpoint ha sido deprecado",
      message: "Use /api/farmacia/recetas/{id}/procesar en su lugar para procesar recetas",
    },
    { status: 410 }
  );
}