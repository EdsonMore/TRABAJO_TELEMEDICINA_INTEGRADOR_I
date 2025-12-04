// components/paciente/evaluacion-cita-modal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EvaluacionExistente {
  id: string;
  calificacion: number;
  comentarios: string | null;
  recomendaria: boolean | null;
}

interface EvaluacionCitaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  citaId: string;
  medicoNombre?: string;
  medicoApellido?: string;
  onSuccess?: () => void;
  token?: string;
}

export function EvaluacionCitaModal({
  open,
  onOpenChange,
  citaId,
  medicoNombre = "El médico",
  medicoApellido = "",
  onSuccess,
  token,
}: EvaluacionCitaModalProps) {
  const [calificacion, setCalificacion] = useState<number>(0);
  const [hoverCalificacion, setHoverCalificacion] = useState<number>(0);
  const [comentarios, setComentarios] = useState("");
  const [recomendaria, setRecomendaria] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluacionExistente, setEvaluacionExistente] = useState<EvaluacionExistente | null>(null);
  const [cargando, setCargando] = useState(true);
  const { toast } = useToast();

  // Cargar evaluación existente cuando se abre el modal
  useEffect(() => {
    if (open && citaId && token) {
      cargarEvaluacionExistente();
    }
  }, [open, citaId, token]);

  const cargarEvaluacionExistente = async () => {
    try {
      setCargando(true);
      const response = await fetch(`/api/evaluaciones?cita_id=${citaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.evaluacion) {
        setEvaluacionExistente(data.evaluacion);
        setCalificacion(data.evaluacion.calificacion);
        setComentarios(data.evaluacion.comentarios || "");
        setRecomendaria(data.evaluacion.recomendaria);
      } else {
        setEvaluacionExistente(null);
      }
    } catch (error) {
      console.error("Error cargando evaluación:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async () => {
    if (calificacion === 0) {
      toast({
        title: "Validación",
        description: "Por favor selecciona una calificación",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/evaluaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cita_id: citaId,
          calificacion: calificacion,
          comentarios: comentarios || null,
          recomendaria: recomendaria,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "No se pudo guardar la evaluación",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Éxito",
        description: "Tu evaluación ha sido registrada",
        variant: "default",
      });

      // Reset form
      setCalificacion(0);
      setComentarios("");
      setRecomendaria(null);
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Error al guardar la evaluación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (cargando) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Evalúa tu cita médica</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Si ya existe evaluación, mostrar como lectura
  if (evaluacionExistente) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tu evaluación</DialogTitle>
            <DialogDescription>
              Ya has evaluado tu cita con {medicoNombre} {medicoApellido}. Aquí se muestra tu evaluación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Calificación */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Tu experiencia general
              </Label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={40}
                    className={`${
                      star <= calificacion
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Calificación: {calificacion} de 5 estrellas
              </p>
            </div>

            {/* Recomendación */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                ¿Recomendarías este médico?
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={recomendaria === true ? "default" : "outline"}
                  disabled
                  className="flex-1"
                >
                  Sí
                </Button>
                <Button
                  variant={recomendaria === false ? "default" : "outline"}
                  disabled
                  className="flex-1"
                >
                  No
                </Button>
                <Button
                  variant={recomendaria === null ? "default" : "outline"}
                  disabled
                  className="flex-1"
                >
                  Indeciso
                </Button>
              </div>
            </div>

            {/* Comentarios */}
            {comentarios && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Tu comentario
                </Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{comentarios}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Modo edición - nueva evaluación
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Evalúa tu cita médica</DialogTitle>
          <DialogDescription>
            Tu opinión nos ayuda a mejorar. Haz una evaluación honesta de tu
            experiencia con {medicoNombre} {medicoApellido}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Calificación con estrellas */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              ¿Cómo fue tu experiencia general?
            </Label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setCalificacion(star)}
                  onMouseEnter={() => setHoverCalificacion(star)}
                  onMouseLeave={() => setHoverCalificacion(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={`transition-colors ${
                      star <= (hoverCalificacion || calificacion)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {calificacion > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Calificación: {calificacion} de 5 estrellas
              </p>
            )}
          </div>

          {/* Pregunta sobre recomendación */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              ¿Recomendarías este médico?
            </Label>
            <div className="flex gap-2">
              <Button
                variant={recomendaria === true ? "default" : "outline"}
                onClick={() => setRecomendaria(true)}
                className="flex-1"
              >
                Sí
              </Button>
              <Button
                variant={recomendaria === false ? "default" : "outline"}
                onClick={() => setRecomendaria(false)}
                className="flex-1"
              >
                No
              </Button>
              <Button
                variant={recomendaria === null ? "default" : "outline"}
                onClick={() => setRecomendaria(null)}
                className="flex-1"
              >
                Indeciso
              </Button>
            </div>
          </div>

          {/* Comentarios */}
          <div className="space-y-2">
            <Label htmlFor="comentarios" className="text-base font-semibold">
              Comentarios (opcional)
            </Label>
            <Textarea
              id="comentarios"
              placeholder="Cuéntanos tu experiencia, qué salió bien, qué podría mejorar..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {comentarios.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Enviar Evaluación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
