"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import RecetasRecibidas from "@/components/farmacia/recetas-recibidas";

export default function RecetasPage() {
  const { token } = useAuth();
  const router = useRouter();

  if (!token) return null;

  return (
    <RecetasRecibidas
      onAceptarReceta={() => router.push("/dashboard/farmacia/despacho")}
    />
  );
}
