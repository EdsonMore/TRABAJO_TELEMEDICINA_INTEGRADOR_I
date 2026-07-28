"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import AlertasSistema from "@/components/farmacia/alertas-sistema";

export default function AlertasPage() {
  const { token } = useAuth();
  const router = useRouter();

  if (!token) return null;

  return (
    <AlertasSistema
      onVolver={() => router.push("/dashboard/farmacia")}
    />
  );
}
