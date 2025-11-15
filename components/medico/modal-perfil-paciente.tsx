// components/medico/modal-perfil-paciente.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Stethoscope, Phone, FileText } from "lucide-react";

interface PacientePerfil {
  id: string;
  dni: string;
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  informacion_personal: {
    edad: number;
    sexo: string;
    tipo_sangre?: string;
    direccion?: string;
  };
  informacion_medica: {
    peso_kg?: number;
    altura_cm?: number;
    alergias?: string;
    enfermedades_cronicas?: string;
    seguro_medico?: string;
  };
  contacto_emergencia?: {
    nombre?: string;
    telefono?: string;
  };
}

interface ModalPerfilPacienteProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: PacientePerfil | null;
  onVerHistorial: () => void;
}

export function ModalPerfilPaciente({
  isOpen,
  onClose,
  paciente,
  onVerHistorial,
}: ModalPerfilPacienteProps) {
  if (!paciente) return null;

  // Helpers para aceptar paciente plano o anidado
  const getNombre = () =>
    paciente.usuario?.nombre || paciente.nombre || paciente?._raw?.usuario?.nombre || "";
  const getApellido = () =>
    paciente.usuario?.apellido || paciente.apellido || paciente?._raw?.usuario?.apellido || "";
  const getDni = () => paciente.dni || paciente.informacion_personal?.dni || paciente?._raw?.dni || "";
  const getTelefono = () => paciente.usuario?.telefono || paciente.telefono || paciente?._raw?.usuario?.telefono || "";
  const getEmail = () => paciente.usuario?.email || paciente.email || paciente?._raw?.usuario?.email || "";
  const getAlergias = () =>
    paciente.informacion_medica?.alergias || paciente.alergias || paciente?._raw?.informacion_medica?.alergias || "No registra";
  const getEnfermedades = () =>
    paciente.informacion_medica?.enfermedades_cronicas || paciente.enfermedades_cronicas || paciente?._raw?.informacion_medica?.enfermedades_cronicas || "No registra";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          max-w-3xl 
          w-full 
          max-h-[85vh] 
          overflow-y-auto 
          rounded-2xl 
          p-6 
          scrollbar-thin 
          scrollbar-thumb-gray-300 
          scrollbar-track-transparent
        "
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center text-xl font-semibold">
            <User className="w-5 h-5 mr-2 text-primary" />
            Perfil de {getNombre()} {getApellido()}
          </DialogTitle>
          <DialogDescription>
            Información personal y médica del paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Información Personal */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoItem label="Nombre Completo" value={`${getNombre()} ${getApellido()}`} />
              <InfoItem label="DNI" value={getDni()} />
              <InfoItem label="Edad" value={`${paciente.informacion_personal?.edad || paciente.edad || "-"} años`} />
              <InfoItem label="Sexo" value={paciente.informacion_personal?.sexo || "-"} />
              <InfoItem label="Tipo de Sangre" value={paciente.informacion_personal?.tipo_sangre || paciente.tipo_sangre || "No especificado"} />
              <InfoItem label="Teléfono" value={getTelefono()} />
              <InfoItem label="Email" value={getEmail()} />
              <InfoItem label="Dirección" value={paciente.informacion_personal?.direccion || paciente.direccion || "No especificada"} />
            </CardContent>
          </Card>

          {/* Información Médica */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-green-600" />
                Información Médica
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Peso" value={`${paciente.informacion_medica?.peso_kg || paciente.peso_kg || "No registrado"} kg`} />
                <InfoItem label="Altura" value={`${paciente.informacion_medica?.altura_cm || paciente.altura_cm || "No registrado"} cm`} />
              </div>
              <InfoItem label="Alergias" value={getAlergias()} />
              <InfoItem label="Enfermedades Crónicas" value={getEnfermedades()} />
              <InfoItem label="Seguro Médico" value={paciente.informacion_medica?.seguro_medico || paciente.seguro_medico || "No especificado"} />
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          {paciente.contacto_emergencia && (
            <Card className="shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-red-500" />
                  Contacto de Emergencia
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <InfoItem
                  label="Nombre"
                  value={
                    paciente.contacto_emergencia?.nombre || "No especificado"
                  }
                />
                <InfoItem
                  label="Teléfono"
                  value={
                    paciente.contacto_emergencia?.telefono || "No especificado"
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* Botón inferior */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
              <a
                href={`tel:${getTelefono() || ""}`}
                onClick={(e) => {
                  if (!getTelefono()) e.preventDefault();
                }}
                className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md text-sm border"
              >
                Llamar
              </a>

              <a
                href={`mailto:${getEmail() || ""}`}
                onClick={(e) => {
                  if (!getEmail()) e.preventDefault();
                }}
                className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md text-sm border"
              >
                Email
              </a>
            </div>

            <div>
              <Button
                onClick={onVerHistorial}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Historial Completo
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 🔹 Subcomponente para evitar repetir etiquetas
function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="text-gray-500 text-xs font-medium">{label}</label>
      <p className="text-base font-semibold text-gray-800">{value}</p>
    </div>
  );
}
