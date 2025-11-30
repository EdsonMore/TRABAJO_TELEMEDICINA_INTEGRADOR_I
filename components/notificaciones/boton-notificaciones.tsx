// components/notificaciones/boton-notificaciones.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { CentroNotificaciones } from "./centro-notificaciones";
import { useNotificaciones } from "@/contexts/notificaciones-context";

export function BotonNotificaciones() {
  const [centroOpen, setCentroOpen] = useState(false);
  const { obtenerNoLeidas } = useNotificaciones();

  const noLeidas = obtenerNoLeidas();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setCentroOpen(true)}
      >
        <Bell className="w-4 h-4" />
        {noLeidas > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {noLeidas > 9 ? "9+" : noLeidas}
          </Badge>
        )}
      </Button>

      <CentroNotificaciones isOpen={centroOpen} onClose={() => setCentroOpen(false)} />
    </>
  );
}
