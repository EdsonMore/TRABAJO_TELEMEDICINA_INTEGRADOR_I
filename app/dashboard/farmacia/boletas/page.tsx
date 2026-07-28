"use client";

import { useAuth } from "@/contexts/auth-context";
import { GestionBoletas } from "@/components/farmacia/gestion-boletas";

export default function BoletasPage() {
  const { token } = useAuth();

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Boletas</h1>
        </div>
        <GestionBoletas />
      </main>
    </div>
  );
}
