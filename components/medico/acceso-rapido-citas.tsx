/**
 * components/medico/acceso-rapido-citas.tsx
 * Componente de acceso rápido a gestión de citas
 * Se integra en el dashboard principal
 */

"use client";

import Link from "next/link";
import { Grid3x3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AccesoRapidoCitas() {
  return (
    <Card className="shadow-sm border-0 sm:border bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Grid3x3 className="w-5 h-5 text-blue-600" />
          Gestión Avanzada de Citas
        </CardTitle>
        <CardDescription className="text-sm">
          Vista completa del calendario, filtros inteligentes y estadísticas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/dashboard/medico/citas">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
            Ir al Calendario
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
