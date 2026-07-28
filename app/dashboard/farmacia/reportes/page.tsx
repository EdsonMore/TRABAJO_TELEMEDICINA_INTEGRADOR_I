"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import ReportesFarmacia from "@/components/farmacia/reportes-farmacia";

export default function ReportesPage() {
  const { token } = useAuth();
  const router = useRouter();

  if (!token) return null;

  return (
    <ReportesFarmacia
      onVolver={() => router.push("/dashboard/farmacia")}
    />
  );
}
