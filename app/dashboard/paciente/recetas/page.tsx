"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import dynamic from "next/dynamic";

const ListaRecetasPaciente = dynamic(
  () => import("@/components/paciente/ListaRecetasPaciente"),
  { ssr: false }
);

export default function RecetasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <Card className="bg-white shadow-sm border-0 sm:border">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Mis Recetas Médicas
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Medicamentos prescritos y envío a farmacias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ListaRecetasPaciente />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
