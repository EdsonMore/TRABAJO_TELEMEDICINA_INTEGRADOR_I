// components/paciente/editar-perfil-modal.tsx
// MediLink+ - Modal para editar perfil del paciente
// Permite actualizar información personal y médica

"use client";

import type React from "react";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditarPerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: any;
  onPerfilActualizado: () => void;
}

export function EditarPerfilModal({
  isOpen,
  onClose,
  perfil,
  onPerfilActualizado,
}: EditarPerfilModalProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // ✅ CORREGIDO: Manejo seguro de datos del perfil
  const [formData, setFormData] = useState({
    telefono: perfil?.usuario?.telefono || "",
    direccion: perfil?.informacion_personal?.direccion || "",
    departamento: perfil?.informacion_personal?.ubicacion?.departamento || "",
    provincia: perfil?.informacion_personal?.ubicacion?.provincia || "",
    distrito: perfil?.informacion_personal?.ubicacion?.distrito || "",
    peso_kg: perfil?.informacion_medica?.peso_kg || "",
    altura_cm: perfil?.informacion_medica?.altura_cm || "",
    tipo_sangre: perfil?.informacion_personal?.tipo_sangre || "",
    alergias: perfil?.informacion_medica?.alergias || "",
    enfermedades_cronicas:
      perfil?.informacion_medica?.enfermedades_cronicas || "",
    seguro_medico: perfil?.informacion_medica?.seguro_medico || "",
    numero_seguro: perfil?.informacion_medica?.numero_seguro || "", // ✅ AGREGADO
    contacto_emergencia_nombre: perfil?.contacto_emergencia?.nombre || "",
    contacto_emergencia_telefono: perfil?.contacto_emergencia?.telefono || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ VALIDACIONES MEJORADAS
      if (
        formData.peso_kg &&
        (Number.parseFloat(formData.peso_kg) < 0 ||
          Number.parseFloat(formData.peso_kg) > 500)
      ) {
        toast({
          title: "Error",
          description: "El peso debe ser un valor válido entre 0 y 500 kg",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (
        formData.altura_cm &&
        (Number.parseInt(formData.altura_cm) < 50 ||
          Number.parseInt(formData.altura_cm) > 250)
      ) {
        toast({
          title: "Error",
          description: "La altura debe ser un valor válido entre 50 y 250 cm",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/paciente/perfil", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Perfil actualizado",
          description: "Tu información ha sido actualizada correctamente.",
        });
        onPerfilActualizado();
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo actualizar el perfil",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast({
        title: "Error",
        description: "Error de conexión. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ FUNCIÓN PARA LIMPIAR CAMPOS NUMÉRICOS
  const handleNumericChange = (field: string, value: string) => {
    // Permitir solo números y punto decimal
    const numericValue = value.replace(/[^\d.]/g, "");
    setFormData((prev) => ({ ...prev, [field]: numericValue }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Mi Perfil</DialogTitle>
          <DialogDescription>
            Actualiza tu información personal y médica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) =>
                    handleInputChange("telefono", e.target.value)
                  }
                  placeholder="Número de teléfono"
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) =>
                    handleInputChange("direccion", e.target.value)
                  }
                  placeholder="Dirección completa"
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="departamento">Departamento</Label>
                <Select
                  value={formData.departamento}
                  onValueChange={(value) =>
                    handleInputChange("departamento", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lima">Lima</SelectItem>
                    <SelectItem value="Arequipa">Arequipa</SelectItem>
                    <SelectItem value="Cusco">Cusco</SelectItem>
                    <SelectItem value="La Libertad">La Libertad</SelectItem>
                    <SelectItem value="Lambayeque">Lambayeque</SelectItem>
                    <SelectItem value="Piura">Piura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  value={formData.provincia}
                  onChange={(e) =>
                    handleInputChange("provincia", e.target.value)
                  }
                  placeholder="Provincia"
                />
              </div>
              <div>
                <Label htmlFor="distrito">Distrito</Label>
                <Input
                  id="distrito"
                  value={formData.distrito}
                  onChange={(e) =>
                    handleInputChange("distrito", e.target.value)
                  }
                  placeholder="Distrito"
                />
              </div>
            </div>
          </div>

          {/* Información Médica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Médica</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="peso_kg">Peso (kg)</Label>
                <Input
                  id="peso_kg"
                  type="text" // ✅ Cambiado a text para mejor control
                  value={formData.peso_kg}
                  onChange={(e) =>
                    handleNumericChange("peso_kg", e.target.value)
                  }
                  placeholder="Peso en kilogramos"
                />
              </div>
              <div>
                <Label htmlFor="altura_cm">Altura (cm)</Label>
                <Input
                  id="altura_cm"
                  type="text" // ✅ Cambiado a text para mejor control
                  value={formData.altura_cm}
                  onChange={(e) =>
                    handleNumericChange("altura_cm", e.target.value)
                  }
                  placeholder="Altura en centímetros"
                />
              </div>
              <div>
                <Label htmlFor="tipo_sangre">Tipo de Sangre</Label>
                <Select
                  value={formData.tipo_sangre}
                  onValueChange={(value) =>
                    handleInputChange("tipo_sangre", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seguro_medico">Seguro Médico</Label>
                <Input
                  id="seguro_medico"
                  value={formData.seguro_medico}
                  onChange={(e) =>
                    handleInputChange("seguro_medico", e.target.value)
                  }
                  placeholder="Nombre del seguro médico"
                />
              </div>
              <div>
                <Label htmlFor="numero_seguro">Número de Seguro</Label>
                <Input
                  id="numero_seguro"
                  value={formData.numero_seguro}
                  onChange={(e) =>
                    handleInputChange("numero_seguro", e.target.value)
                  }
                  placeholder="Número de póliza o seguro"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="alergias">Alergias</Label>
              <Textarea
                id="alergias"
                value={formData.alergias}
                onChange={(e) => handleInputChange("alergias", e.target.value)}
                placeholder="Describe tus alergias conocidas (separadas por comas)"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="enfermedades_cronicas">
                Enfermedades Crónicas
              </Label>
              <Textarea
                id="enfermedades_cronicas"
                value={formData.enfermedades_cronicas}
                onChange={(e) =>
                  handleInputChange("enfermedades_cronicas", e.target.value)
                }
                placeholder="Describe enfermedades crónicas o condiciones médicas (separadas por comas)"
                rows={2}
              />
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contacto_emergencia_nombre">Nombre</Label>
                <Input
                  id="contacto_emergencia_nombre"
                  value={formData.contacto_emergencia_nombre}
                  onChange={(e) =>
                    handleInputChange(
                      "contacto_emergencia_nombre",
                      e.target.value
                    )
                  }
                  placeholder="Nombre del contacto de emergencia"
                />
              </div>
              <div>
                <Label htmlFor="contacto_emergencia_telefono">Teléfono</Label>
                <Input
                  id="contacto_emergencia_telefono"
                  value={formData.contacto_emergencia_telefono}
                  onChange={(e) =>
                    handleInputChange(
                      "contacto_emergencia_telefono",
                      e.target.value
                    )
                  }
                  placeholder="Teléfono del contacto de emergencia"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
