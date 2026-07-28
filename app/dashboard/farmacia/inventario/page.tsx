"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import GestionInventario from "@/components/farmacia/gestion-inventario";

export default function InventarioPage() {
  const { token } = useAuth();
  const router = useRouter();

  if (!token) return null;

  return (
    <GestionInventario
      onVolver={() => router.push("/dashboard/farmacia")}
    />
  );
}
