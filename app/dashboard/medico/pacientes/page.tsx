// app/dashboard/medico/pacientes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ModalPerfilPaciente } from "@/components/medico/modal-perfil-paciente";
import { ModalHistorialPaciente } from "@/components/medico/modal-historial-paciente";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  Search,
  User,
  FileText,
  Calendar,
  Stethoscope,
  Loader2,
} from "lucide-react";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  edad: number;
  telefono: string;
  email: string;
  dni: string;
  tipo_sangre?: string;
  alergias?: string;
  enfermedades_cronicas?: string;
  ultima_cita?: string;
}

export default function PacientesPage() {
  const { usuario, token } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [pacientePerfil, setPacientePerfil] = useState<any>(null);
  const [mostrarPerfilPaciente, setMostrarPerfilPaciente] = useState(false);
  const [pacienteHistorial, setPacienteHistorial] = useState<any>(null);
  const [mostrarHistorialPaciente, setMostrarHistorialPaciente] = useState(false);
  const [buscarPacientesOpen, setBuscarPacientesOpen] = useState(false);
  const [pacienteModalSeleccionado, setPacienteModalSeleccionado] = useState<any>(null);

  useEffect(() => {
    const cargarPacientes = async () => {
      if (!token) return;
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const pacientesRes = await fetch("/api/medico/pacientes", { headers });
        if (pacientesRes.ok) {
          const pacientesData = await pacientesRes.json();
          const pacientesNormalized = (pacientesData.pacientes || []).map((p: any) => ({
            id: p.id,
            nombre: p.usuario?.nombre || p.nombre || "",
            apellido: p.usuario?.apellido || p.apellido || "",
            edad: p.informacion_personal?.edad || p.edad || null,
            telefono: p.usuario?.telefono || p.telefono || "",
            email: p.usuario?.email || p.email || "",
            dni: p.informacion_personal?.dni || p.dni || "",
            tipo_sangre: p.informacion_personal?.tipo_sangre || p.tipo_sangre || "",
            _raw: p,
          }));
          setPacientes(pacientesNormalized);
        }
      } catch (error) {
        console.error("Error cargando pacientes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarPacientes();
  }, [token]);

  const handlePacienteSeleccionado = (paciente: any) => {
    setPacienteModalSeleccionado(paciente);
    setBuscarPacientesOpen(false);
    setPacientePerfil(paciente);
    setMostrarPerfilPaciente(true);
  };

  const buscarPacientesGlobal = () => {
    setBuscarPacientesOpen(true);
  };

  const verPerfilPaciente = async (pacienteId: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const response = await fetch(`/api/medico/pacientes/${pacienteId}/perfil`, { headers });
      if (response.ok) {
        const data = await response.json();
        setPacientePerfil(data.paciente);
        setMostrarPerfilPaciente(true);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "No se pudo cargar el perfil"}`);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      alert("Error de conexión al cargar el perfil");
    }
  };

  const verHistorialPaciente = async (pacienteId: string) => {
    if (!pacienteId) { alert("Error: ID de paciente no válido"); return; }
    if (!token) { alert("Error: No estás autenticado"); return; }
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const citaIdTemporal = `temp-${Date.now()}`;
      const url = `/api/medico/pacientes/${pacienteId}/historial?cita_id=${citaIdTemporal}`;
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setPacienteHistorial(data);
        setMostrarHistorialPaciente(true);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "No se pudo cargar el historial"}`);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
      alert("Error de conexión al cargar el historial");
    }
  };

  const pacientesFiltrados = pacientes.filter((paciente) => {
    const nombre = paciente?.nombre?.toLowerCase() || "";
    const apellido = paciente?.apellido?.toLowerCase() || "";
    const dni = paciente?.dni || "";
    const busqueda = busquedaPaciente.toLowerCase();
    return nombre.includes(busqueda) || apellido.includes(busqueda) || dni.includes(busqueda);
  });

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["medico"]}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <p className="text-gray-600 text-sm">Cargando pacientes...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["medico"]}>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mis Pacientes</h1>
            <p className="text-gray-600 text-sm sm:text-base">{pacientes.length} pacientes atendidos</p>
          </div>

          <Card className="bg-white shadow-sm border-0 sm:border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div>
                  <CardTitle className="text-base sm:text-lg">Lista de Pacientes</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {pacientes.length} pacientes atendidos
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Buscar por nombre o DNI..."
                    value={busquedaPaciente}
                    onChange={(e) => setBusquedaPaciente(e.target.value)}
                    className="w-full sm:w-64 text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={buscarPacientesGlobal} className="flex-shrink-0">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pacientesFiltrados.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {pacientesFiltrados.map((paciente) => (
                    <div key={paciente.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                            <AvatarFallback className="text-xs sm:text-sm bg-blue-100 text-blue-600">
                              {(paciente?.nombre?.[0] || "").toUpperCase()}{(paciente?.apellido?.[0] || "").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base truncate">{paciente.nombre} {paciente.apellido}</h4>
                            <div className="flex items-center space-x-2 mt-1 sm:mt-2 flex-wrap">
                              <p className="text-xs sm:text-sm text-gray-600">{paciente.edad} años</p>
                              <span className="text-xs text-gray-600">•</span>
                              <p className="text-xs sm:text-sm text-gray-600">DNI: {paciente.dni}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 truncate">{paciente.telefono} • {paciente.email}</p>
                            {paciente.tipo_sangre && (
                              <p className="text-xs text-gray-500 mt-1">Tipo de sangre: {paciente.tipo_sangre}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-2 sm:ml-4">
                          <div className="flex space-x-1 sm:space-x-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                              onClick={() => verPerfilPaciente(paciente.id)}>
                              <User className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                              onClick={() => verHistorialPaciente(paciente.id)}>
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="h-8 sm:h-9 px-2 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              onClick={() => window.location.href = "/dashboard/medico/agenda"}
                              title="Ir al calendario del médico">
                              <Calendar className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Users className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4 sm:mb-6" />
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                    {busquedaPaciente ? "No se encontraron pacientes" : "No tienes pacientes registrados"}
                  </p>
                  {!busquedaPaciente && (
                    <Button onClick={buscarPacientesGlobal} className="bg-blue-600 hover:bg-blue-700">
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Pacientes
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <ModalPerfilPaciente
          isOpen={mostrarPerfilPaciente}
          onClose={() => setMostrarPerfilPaciente(false)}
          paciente={pacientePerfil}
          onVerHistorial={() => {
            setMostrarPerfilPaciente(false);
            setTimeout(() => { if (pacientePerfil) verHistorialPaciente(pacientePerfil.id); }, 300);
          }}
        />
        <ModalHistorialPaciente
          isOpen={mostrarHistorialPaciente}
          onClose={() => setMostrarHistorialPaciente(false)}
          historial={pacienteHistorial}
        />
      </div>
    </ProtectedRoute>
  );
}
