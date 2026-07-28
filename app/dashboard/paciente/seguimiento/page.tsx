"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SeguimientoRecetasPaciente from "@/components/paciente/SeguimientoRecetasPaciente";

export default function SeguimientoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <Card className="bg-white shadow-sm border-0 sm:border">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              📦 Seguimiento de Recetas
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Estado de tus recetas en la farmacia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeguimientoRecetasPaciente />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
