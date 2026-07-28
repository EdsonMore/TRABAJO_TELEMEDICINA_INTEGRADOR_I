"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { GestionBoletas } from "@/components/farmacia/gestion-boletas";

export default function BoletasPage() {
  const { token } = useAuth();
  const router = useRouter();

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              Gestión de Boletas
            </h1>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/farmacia")}
            >
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GestionBoletas />
      </main>
    </div>
  );
}
