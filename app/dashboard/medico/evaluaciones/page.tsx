// app/dashboard/medico/evaluaciones/page.tsx
"use client";

import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { EvaluacionesRecibidas } from "@/components/medico/evaluaciones-recibidas";
import { Star } from "lucide-react";

export default function EvaluacionesPage() {
  const { token } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["medico"]}>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Evaluaciones Recibidas</h1>
            <p className="text-gray-600 text-sm sm:text-base">Opiniones y calificaciones de tus pacientes</p>
          </div>
          <EvaluacionesRecibidas token={token || undefined} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
