// components/notificaciones/centro-notificaciones.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotificaciones } from "@/contexts/notificaciones-context";
import {
  Bell,
  X,
  CheckCircle2,
  Trash2,
  Calendar,
  Pill,
  TestTube,
  AlertCircle,
  FileText,
} from "lucide-react";

interface CentroNotificacionesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CentroNotificaciones({
  isOpen,
  onClose,
}: CentroNotificacionesProps) {
  const {
    notificaciones,
    marcarComoLeida,
    marcarTodosComoLeidos,
    eliminarNotificacion,
    limpiarTodas,
  } = useNotificaciones();

  const noLeidas = notificaciones.filter((n) => !n.leida);

  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case "cita":
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case "receta":
        return <Pill className="w-5 h-5 text-green-600" />;
      case "receta_nueva":
        return <FileText className="w-5 h-5 text-cyan-600" />;
      case "resultado":
        return <TestTube className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getColorByType = (tipo: string) => {
    switch (tipo) {
      case "cita":
        return "bg-blue-50 border-blue-200";
      case "receta":
        return "bg-green-50 border-green-200";
      case "receta_nueva":
        return "bg-cyan-50 border-cyan-200";
      case "resultado":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Centro de Notificaciones
              </DialogTitle>
              <DialogDescription>
                {notificaciones.length === 0
                  ? "No tienes notificaciones"
                  : `${notificaciones.length} notificaciones (${noLeidas.length} sin leer)`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {notificaciones.length > 0 && (
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => marcarTodosComoLeidos()}
              disabled={noLeidas.length === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Marcar todo como leído
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => limpiarTodas()}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpiar todas
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {notificaciones.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            notificaciones.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 border rounded-lg transition-colors ${
                  notif.leida ? "bg-white" : `${getColorByType(notif.tipo)} border-2`
                } ${!notif.leida ? "border-current" : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getIconByType(notif.tipo)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {notif.titulo}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notif.mensaje}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.timestamp).toLocaleDateString("es-PE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!notif.leida && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => marcarComoLeida(notif.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Marcar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => eliminarNotificacion(notif.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
