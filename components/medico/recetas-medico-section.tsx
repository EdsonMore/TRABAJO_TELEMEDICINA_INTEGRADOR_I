// components/medico/recetas-medico-section.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FileText,
  QrCode,
  Download,
  Eye,
  Trash2,
  Pill,
  User,
  Calendar,
  Clock,
  CheckCircle,
  Search,
} from "lucide-react";
import ModalCrearReceta from "./ModalCrearReceta";

interface MedicamentoReceta {
  id_medicamento?: number;
  nombre_medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion_dias: number;
  instrucciones_especiales: string;
  cantidad: number;
}

interface Receta {
  id: string;
  codigo_receta: string;
  codigo_qr: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  diagnostico: string;
  estado: "pendiente" | "completada" | "expirada";
  observaciones_generales: string;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_edad: number;
  paciente_dni: string;
  total_medicamentos: number;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  pdf_path?: string;
}

interface Cita {
  id: number;
  paciente_id: number;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  paciente_edad: number;
  fecha_cita: string;
  motivo_consulta: string;
  estado: string;
}

export function RecetasMedicoSection() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [recetasFiltradas, setRecetasFiltradas] = useState<Receta[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(
    null
  );
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [citasDisponibles, setCitasDisponibles] = useState<Cita[]>([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  useEffect(() => {
    cargarRecetas();
    cargarCitasDisponibles();
  }, []);

  useEffect(() => {
    filtrarRecetas();
  }, [recetas, busqueda, filtroEstado]);

  const cargarRecetas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/recetas/medico", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecetas(data.recetas || []);
      } else {
        console.error("Error cargando recetas:", await response.text());
      }
    } catch (error) {
      console.error("Error cargando recetas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarCitasDisponibles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/citas/medico?estado=completada", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCitasDisponibles(data.citas || []);
      }
    } catch (error) {
      console.error("Error cargando citas:", error);
    }
  };

  const filtrarRecetas = () => {
    let filtradas = recetas;

    if (busqueda) {
      filtradas = filtradas.filter(
        (receta) =>
          receta.paciente_nombre
            .toLowerCase()
            .includes(busqueda.toLowerCase()) ||
          receta.paciente_apellido
            .toLowerCase()
            .includes(busqueda.toLowerCase()) ||
          receta.paciente_dni.includes(busqueda) ||
          receta.diagnostico.toLowerCase().includes(busqueda.toLowerCase()) ||
          receta.codigo_receta.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    if (filtroEstado !== "todas") {
      filtradas = filtradas.filter((receta) => receta.estado === filtroEstado);
    }

    setRecetasFiltradas(filtradas);
  };

  const descargarPDF = async (receta: Receta) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/recetas/${receta.id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receta_${receta.codigo_receta}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Error generando PDF");
        alert("Error al generar el PDF de la receta");
      }
    } catch (error) {
      console.error("Error descargando PDF:", error);
      alert("Error al descargar el PDF");
    }
  };

  const verCodigoQR = (receta: Receta) => {
    // Aquí puedes implementar la visualización del QR
    alert(
      `Código QR de la receta: ${receta.codigo_qr}\n\nPuedes implementar un visor de QR aquí.`
    );
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case "completada":
        return <Badge className="bg-green-500">Completada</Badge>;
      case "expirada":
        return <Badge variant="destructive">Expirada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleRecetaCreada = () => {
    cargarRecetas();
    setMostrarModalCrear(false);
    setCitaSeleccionada(null);
  };

  const seleccionarCitaParaReceta = (cita: Cita) => {
    setCitaSeleccionada(cita);
    setMostrarModalCrear(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando recetas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Recetas Médicas</h2>
          <p className="text-muted-foreground">
            Cree y gestione recetas electrónicas para sus pacientes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setMostrarModalCrear(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Receta
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, DNI, diagnóstico o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las recetas</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="completada">Completadas</SelectItem>
            <SelectItem value="expirada">Expiradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de recetas */}
      <div className="grid gap-4">
        {recetasFiltradas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay recetas</h3>
              <p className="text-muted-foreground mb-4">
                {busqueda || filtroEstado !== "todas"
                  ? "No se encontraron recetas con los filtros aplicados"
                  : "Aún no ha creado ninguna receta"}
              </p>
              <Button
                onClick={() => setMostrarModalCrear(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Receta
              </Button>
            </CardContent>
          </Card>
        ) : (
          recetasFiltradas.map((receta) => (
            <Card
              key={receta.id}
              className="medical-shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setRecetaSeleccionada(receta);
                setMostrarDetalles(true);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {receta.paciente_nombre} {receta.paciente_apellido}
                      </h3>
                      {getEstadoBadge(receta.estado)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="w-4 h-4 mr-2" />
                        <span>DNI: {receta.paciente_dni}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          Emisión: {formatearFecha(receta.fecha_emision)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>
                          Vence: {formatearFecha(receta.fecha_vencimiento)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Pill className="w-4 h-4 mr-2" />
                        <span>{receta.total_medicamentos} medicamento(s)</span>
                      </div>
                    </div>

                    <p className="font-medium text-sm mb-2">
                      Diagnóstico: {receta.diagnostico}
                    </p>

                    {receta.observaciones_generales && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Observaciones: {receta.observaciones_generales}
                      </p>
                    )}

                    <div className="flex items-center mt-3">
                      <Badge variant="outline" className="text-xs">
                        Código: {receta.codigo_receta}
                      </Badge>
                    </div>
                  </div>

                  <div
                    className="flex items-center space-x-2 ml-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRecetaSeleccionada(receta);
                        setMostrarDetalles(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => descargarPDF(receta)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verCodigoQR(receta)}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal para crear receta */}
      <ModalCrearReceta
        cita={
          citaSeleccionada || {
            id: 0,
            paciente_id: 0,
            paciente_nombre: "",
            paciente_apellido: "",
            paciente_dni: "",
            paciente_edad: 0,
            fecha_cita: new Date().toISOString(),
            motivo_consulta: "",
            estado: "completada",
          }
        }
        isOpen={mostrarModalCrear}
        onClose={() => {
          setMostrarModalCrear(false);
          setCitaSeleccionada(null);
        }}
        onRecetaCreada={handleRecetaCreada}
      />

      {/* Modal de detalles de receta */}
      <Dialog open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Detalles de la Receta
            </DialogTitle>
          </DialogHeader>

          {recetaSeleccionada && (
            <div className="space-y-6">
              {/* Información del paciente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <User className="w-5 h-5 mr-2" />
                    Información del Paciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Nombre Completo
                      </label>
                      <p className="font-medium">
                        {recetaSeleccionada.paciente_nombre}{" "}
                        {recetaSeleccionada.paciente_apellido}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        DNI
                      </label>
                      <p className="font-medium">
                        {recetaSeleccionada.paciente_dni}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Edad
                      </label>
                      <p className="font-medium">
                        {recetaSeleccionada.paciente_edad} años
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de la receta */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="w-5 h-5 mr-2" />
                    Información de la Receta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Código de Receta
                      </label>
                      <p className="font-mono text-sm bg-muted p-2 rounded">
                        {recetaSeleccionada.codigo_receta}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Código QR
                      </label>
                      <p className="font-mono text-sm bg-muted p-2 rounded">
                        {recetaSeleccionada.codigo_qr}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">
                      Diagnóstico
                    </label>
                    <p className="font-medium bg-muted p-3 rounded">
                      {recetaSeleccionada.diagnostico}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Fecha de Emisión
                      </label>
                      <p className="font-medium">
                        {formatearFecha(recetaSeleccionada.fecha_emision)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Fecha de Vencimiento
                      </label>
                      <p className="font-medium">
                        {formatearFecha(recetaSeleccionada.fecha_vencimiento)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Estado
                      </label>
                      <div className="mt-1">
                        {getEstadoBadge(recetaSeleccionada.estado)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Total de Medicamentos
                      </label>
                      <p className="font-medium">
                        {recetaSeleccionada.total_medicamentos}
                      </p>
                    </div>
                  </div>

                  {recetaSeleccionada.observaciones_generales && (
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Observaciones Generales
                      </label>
                      <p className="font-medium bg-muted p-3 rounded">
                        {recetaSeleccionada.observaciones_generales}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Acciones */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setMostrarDetalles(false)}
                >
                  Cerrar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => descargarPDF(recetaSeleccionada)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => verCodigoQR(recetaSeleccionada)}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Ver QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
