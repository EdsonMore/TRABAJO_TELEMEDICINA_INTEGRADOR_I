// app/dashboard/medico/recetas/page.tsx
"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { RecetasMedicoSection } from "@/components/medico/recetas-medico-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function RecetasPage() {
  return (
    <ProtectedRoute allowedRoles={["medico"]}>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mis Recetas Médicas</h1>
            <p className="text-gray-600 text-sm sm:text-base">Recetas prescritas a pacientes</p>
          </div>
          <Card className="bg-white shadow-sm border-0 sm:border">
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Mis Recetas Médicas
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Recetas prescritas a pacientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecetasMedicoSection />
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
