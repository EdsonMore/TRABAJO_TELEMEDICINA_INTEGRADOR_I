"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import DespachoRecetas from "@/components/farmacia/despacho-recetas";

export default function DespachoPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recetaParam = searchParams?.get("receta");

  if (!token) return null;

  return (
    <DespachoRecetas
      recetaPreseleccionada={recetaParam}
      onVolver={() => router.push("/dashboard/farmacia")}
    />
  );
}
