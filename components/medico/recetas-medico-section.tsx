// components/medico/recetas-medico-section.tsx - VERSIÓN CON QR MEJORADO
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
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
  Pill,
  User,
  Calendar,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  Users,
  Filter,
} from "lucide-react";
import ModalCrearReceta from "./ModalCrearReceta";

// Usar las interfaces desde types/receta.ts
interface Receta {
  id: string;
  codigo_receta: string;
  diagnostico_principal_texto: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  observaciones?: string;
  estado: "activa" | "dispensada" | "vencida" | "cancelada";
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  paciente_edad: number;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  total_medicamentos: number;
  sello_temporal: string;
  paciente_id: string;
}

interface Cita {
  id: string;
  paciente_id: string;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  paciente_edad: number;
  fecha_cita: string;
  motivo_consulta: string;
  estado: string;
  tipo_cita: string;
  sexo?: string;
  tipo_sangre?: string;
}

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  edad: number;
  tipo_sangre?: string;
  total_recetas: number;
}

export function RecetasMedicoSection() {
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [recetasFiltradas, setRecetasFiltradas] = useState<Receta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [filtroPaciente, setFiltroPaciente] = useState<string>("todos");
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(
    null
  );
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cargandoPacientes, setCargandoPacientes] = useState(false);
  const [citasDisponibles, setCitasDisponibles] = useState<Cita[]>([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [detallesCompletos, setDetallesCompletos] = useState<any>(null);
  const [descargandoPDF, setDescargandoPDF] = useState<string | null>(null);
  const [mostrarQR, setMostrarQR] = useState(false); // ✅ AGREGADO: Estado para modal QR

  useEffect(() => {
    if (token) {
      cargarRecetas();
      cargarPacientes();
      cargarCitasDisponibles();
    }
  }, [token]);

  useEffect(() => {
    filtrarRecetas();
  }, [recetas, busqueda, filtroEstado, filtroPaciente]);

  const cargarRecetas = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/recetas/medico", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📋 Recetas cargadas:", data.recetas);
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

  const cargarPacientes = async () => {
    if (!token) return;

    try {
      setCargandoPacientes(true);
      const response = await fetch("/api/paciente/medico", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPacientes(data.pacientes || []);
      } else {
        console.error("Error cargando pacientes:", await response.text());
      }
    } catch (error) {
      console.error("Error cargando pacientes:", error);
    } finally {
      setCargandoPacientes(false);
    }
  };

  const cargarCitasDisponibles = async () => {
    if (!token) return;

    try {
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

  const cargarDetallesReceta = async (recetaId: string) => {
    if (!token) return null;

    try {
      const response = await fetch(`/api/recetas/${recetaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.receta;
      }
    } catch (error) {
      console.error("Error cargando detalles de receta:", error);
    }
    return null;
  };

  // ✅ FUNCIÓN CORREGIDA - Validar campos antes de usar .includes()
  const filtrarRecetas = () => {
    let filtradas = recetas;

    // Filtro por búsqueda - CON VALIDACIONES
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase().trim();

      filtradas = filtradas.filter((receta) => {
        // Validar y convertir a string seguro
        const nombre = (receta.paciente_nombre || "").toLowerCase();
        const apellido = (receta.paciente_apellido || "").toLowerCase();
        const dni = (receta.paciente_dni || "").toString();
        const diagnostico = (
          receta.diagnostico_principal_texto || ""
        ).toLowerCase();
        const codigo = (receta.codigo_receta || "").toLowerCase();

        return (
          nombre.includes(busquedaLower) ||
          apellido.includes(busquedaLower) ||
          dni.includes(busqueda) || // DNI sin lowercase para números
          diagnostico.includes(busquedaLower) ||
          codigo.includes(busquedaLower)
        );
      });
    }

    // Filtro por estado
    if (filtroEstado !== "todas") {
      filtradas = filtradas.filter((receta) => receta.estado === filtroEstado);
    }

    // Filtro por paciente
    if (filtroPaciente !== "todos") {
      filtradas = filtradas.filter(
        (receta) => receta.paciente_id === filtroPaciente
      );
    }

    setRecetasFiltradas(filtradas);
  };

  const descargarPDF = async (receta: Receta) => {
    if (!token) return;

    setDescargandoPDF(receta.id);
    try {
      // ✅ CORRECCIÓN: Usar el endpoint específico para médicos
      const response = await fetch(`/api/recetas/medico/${receta.id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("text/html")) {
          // Es un HTML - descargar como archivo
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `receta_${receta.codigo_receta}.html`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else if (contentType?.includes("application/pdf")) {
          // Es un PDF real
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
          // Es JSON (fallback)
          const data = await response.json();
          if (data.html) {
            // Generar PDF desde HTML en el frontend
            generarPDFDesdeHTML(data.html, receta.codigo_receta);
          } else {
            alert(data.message || "PDF generado exitosamente");
          }
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Error desconocido" }));
        alert(
          `Error al generar PDF: ${errorData.error || "Intente más tarde"}`
        );
      }
    } catch (error) {
      console.error("Error descargando PDF:", error);
      alert("Error al descargar el PDF");
    } finally {
      setDescargandoPDF(null);
    }
  };

  // Función para generar PDF desde HTML (usando print)
  const generarPDFDesdeHTML = (html: string, codigoReceta: string) => {
    const ventana = window.open("", "_blank");
    if (!ventana) {
      alert("Por favor permite ventanas emergentes para generar el PDF");
      return;
    }

    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => {
      ventana.print();
    }, 500);
  };

  const generarPDFFallback = (receta: Receta, detalles: any) => {
    // Crear un PDF básico usando window.print() y estilos para impresión
    const ventana = window.open("", "_blank");
    if (!ventana) {
      alert("Por favor permite ventanas emergentes para generar el PDF");
      return;
    }

    ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receta Médica - ${receta.codigo_receta}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          color: #333; 
          line-height: 1.4;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #2563eb; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .section { 
          margin-bottom: 25px; 
        }
        .section-title { 
          background: #2563eb; 
          color: white; 
          padding: 8px 12px; 
          margin-bottom: 10px; 
          border-radius: 4px; 
          font-weight: bold;
        }
        .medicamento { 
          border: 1px solid #ddd; 
          padding: 15px; 
          margin-bottom: 10px; 
          border-radius: 4px; 
          background: #f8f9fa;
        }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          font-size: 12px; 
          color: #666; 
          border-top: 1px solid #ddd; 
          padding-top: 20px; 
        }
        .firma {
          margin-top: 50px;
          border-top: 1px solid #333;
          width: 300px;
          text-align: center;
          padding-top: 10px;
          margin-left: auto;
          margin-right: auto;
        }
        @media print { 
          body { margin: 0; } 
          .header { border-bottom: 3px double #2563eb; }
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        .info-item {
          margin-bottom: 8px;
        }
        .info-label {
          font-weight: bold;
          color: #555;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>RECETA MÉDICA</h1>
        <p><strong>Código:</strong> ${receta.codigo_receta}</p>
        <p><strong>Fecha de Emisión:</strong> ${formatearFecha(
          receta.fecha_emision
        )}</p>
        <p><strong>Válido hasta:</strong> ${formatearFecha(
          receta.fecha_vencimiento
        )}</p>
      </div>

      <div class="section">
        <div class="section-title">INFORMACIÓN DEL MÉDICO</div>
        <div class="grid-2">
          <div class="info-item">
            <span class="info-label">Médico:</span>
            Dr. ${receta.medico_nombre} ${receta.medico_apellido}
          </div>
          <div class="info-item">
            <span class="info-label">Especialidad:</span>
            ${receta.especialidad}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">INFORMACIÓN DEL PACIENTE</div>
        <p><strong>Paciente:</strong> ${receta.paciente_nombre} ${
      receta.paciente_apellido
    }</p>
        <p><strong>DNI:</strong> ${receta.paciente_dni}</p>
        <p><strong>Edad:</strong> ${receta.paciente_edad} años</p>
      </div>

      <div class="section">
        <div class="section-title">DIAGNÓSTICO PRINCIPAL</div>
        <p>${receta.diagnostico_principal_texto}</p>
      </div>

      ${
        receta.observaciones
          ? `
      <div class="section">
        <div class="section-title">OBSERVACIONES</div>
        <p>${receta.observaciones}</p>
      </div>
      `
          : ""
      }

      <div class="section">
        <div class="section-title">MEDICAMENTOS RECETADOS</div>
        ${
          detalles?.medicamentos
            ?.map(
              (med: any) => `
          <div class="medicamento">
            <p><strong>${med.nombre_comercial}</strong> ${
                med.nombre_generico ? `(${med.nombre_generico})` : ""
              }</p>
            <div class="grid-2">
              <div><strong>Dosis:</strong> ${med.dosis}</div>
              <div><strong>Frecuencia:</strong> ${med.frecuencia}</div>
              <div><strong>Duración:</strong> ${med.duracion_dias} días</div>
              <div><strong>Cantidad:</strong> ${med.cantidad} unidades</div>
            </div>
            ${
              med.instrucciones_especiales
                ? `<p><strong>Instrucciones:</strong> ${med.instrucciones_especiales}</p>`
                : ""
            }
            <p><strong>Estado:</strong> ${
              med.dispensado ? "✅ DISPENSADO" : "⏳ PENDIENTE"
            }</p>
          </div>
        `
            )
            .join("") || "<p>No se encontraron medicamentos</p>"
        }
      </div>

      <div class="firma">
        <div>Firma y sello del médico</div>
      </div>

      <div class="footer">
        <p>Receta generada electrónicamente - ${new Date().toLocaleDateString(
          "es-PE"
        )}</p>
        <p><strong>MediLink+</strong> - Sistema de Gestión Médica</p>
        <p>Código QR de verificación: ${receta.codigo_receta}</p>
      </div>
    </body>
    </html>
  `);

    ventana.document.close();
    setTimeout(() => {
      ventana.print();
    }, 500);
  };

  const verDetallesReceta = async (receta: Receta) => {
    setRecetaSeleccionada(receta);
    const detalles = await cargarDetallesReceta(receta.id);
    setDetallesCompletos(detalles);
    setMostrarDetalles(true);
  };

  // ✅ FUNCIÓN MEJORADA PARA QR (IGUAL QUE PACIENTE)
  const verCodigoQR = (receta: Receta) => {
    setRecetaSeleccionada(receta);
    setMostrarQR(true);
  };

  // Función para generar QR simple (IGUAL QUE PACIENTE)
  const generarQRSimple = (text: string) => {
    // Por ahora mostramos un QR simulado
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      text
    )}`;
  };

  const getEstadoBadge = (estado: string) => {
    const configs = {
      activa: {
        label: "Activa",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      dispensada: {
        label: "Dispensada",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      vencida: {
        label: "Vencida",
        className: "bg-red-100 text-red-800 border-red-200",
      },
      cancelada: {
        label: "Cancelada",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      },
    };

    const config = configs[estado as keyof typeof configs] || {
      label: estado,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatearFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const handleRecetaCreada = () => {
    cargarRecetas();
    setMostrarModalCrear(false);
    setCitaSeleccionada(null);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando recetas médicas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Gestión de Recetas Médicas
          </h2>
          <p className="text-gray-600 mt-1">
            Cree y gestione recetas electrónicas para sus pacientes
          </p>
        </div>
        <Button
          onClick={() => setMostrarModalCrear(true)}
          className="bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Receta
        </Button>
      </div>

      {/* Filtros y búsqueda MEJORADOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Búsqueda general */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar en recetas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Filtro por paciente */}
        <Select value={filtroPaciente} onValueChange={setFiltroPaciente}>
          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue
              placeholder={
                cargandoPacientes
                  ? "Cargando pacientes..."
                  : "Filtrar por paciente"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los pacientes</SelectItem>
            {pacientes.map((paciente) => (
              <SelectItem key={paciente.id} value={paciente.id}>
                {paciente.nombre} {paciente.apellido} - {paciente.dni} (
                {paciente.total_recetas} recetas)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por estado */}
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos los estados</SelectItem>
            <SelectItem value="activa">Activas</SelectItem>
            <SelectItem value="dispensada">Dispensadas</SelectItem>
            <SelectItem value="vencida">Vencidas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estadísticas rápidas ACTUALIZADAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Recetas
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {recetas.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pacientes Atendidos
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {[...new Set(recetas.map((r) => r.paciente_id))].length}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Recetas Activas
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {recetas.filter((r) => r.estado === "activa").length}
                </p>
              </div>
              <Pill className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Medicamentos Total
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {recetas.reduce(
                    (total, r) => total + (r.total_medicamentos || 0),
                    0
                  )}
                </p>
              </div>
              <Filter className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de recetas */}
      <div className="grid gap-4">
        {recetasFiltradas.length === 0 ? (
          <Card className="text-center py-12 border-2 border-dashed border-gray-300 bg-gray-50">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {busqueda ||
                filtroEstado !== "todas" ||
                filtroPaciente !== "todos"
                  ? "No se encontraron recetas"
                  : "No hay recetas registradas"}
              </h3>
              <p className="text-gray-500 mb-6">
                {busqueda ||
                filtroEstado !== "todas" ||
                filtroPaciente !== "todos"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza creando tu primera receta médica"}
              </p>
              <Button
                onClick={() => setMostrarModalCrear(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
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
              className="bg-white border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer hover:shadow-md"
              onClick={() => verDetallesReceta(receta)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800">
                          {receta.paciente_nombre || "N/A"}{" "}
                          {receta.paciente_apellido || ""}
                        </h3>
                        <p className="text-sm text-gray-600">
                          DNI: {receta.paciente_dni || "No disponible"}
                        </p>
                      </div>
                      {getEstadoBadge(receta.estado)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          Emisión: {formatearFecha(receta.fecha_emision)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          Vence: {formatearFecha(receta.fecha_vencimiento)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Pill className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          {receta.total_medicamentos || 0} medicamento(s)
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-mono">
                          {receta.codigo_receta || "Sin código"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium text-sm text-gray-800">
                        Diagnóstico:{" "}
                        {receta.diagnostico_principal_texto ||
                          "No especificado"}
                      </p>
                      {receta.observaciones && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          Observaciones: {receta.observaciones}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 ml-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verDetallesReceta(receta)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => descargarPDF(receta)}
                      disabled={descargandoPDF === receta.id}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      {descargandoPDF === receta.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verCodigoQR(receta)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
            id: "",
            paciente_id: "",
            paciente_nombre: "",
            paciente_apellido: "",
            paciente_dni: "",
            paciente_edad: 0,
            fecha_cita: new Date().toISOString(),
            motivo_consulta: "",
            estado: "completada",
            tipo_cita: "presencial",
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="flex items-center text-xl font-bold text-gray-800">
              <FileText className="w-6 h-6 mr-3 text-blue-600" />
              Detalles de Receta Médica
            </DialogTitle>
          </DialogHeader>

          {recetaSeleccionada && (
            <div className="space-y-6 py-4">
              {/* Información del paciente */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg text-blue-800">
                    <User className="w-5 h-5 mr-2" />
                    Información del Paciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-blue-700">
                        Nombre Completo
                      </label>
                      <p className="font-semibold text-blue-900">
                        {(detallesCompletos?.paciente_nombre || recetaSeleccionada.paciente_nombre || "N/A")}{" "}
                        {detallesCompletos?.paciente_apellido || recetaSeleccionada.paciente_apellido || ""}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-700">
                        DNI
                      </label>
                      <p className="font-semibold text-blue-900">
                        {detallesCompletos?.dni || detallesCompletos?.paciente_dni || recetaSeleccionada.paciente_dni || "No disponible"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-700">
                        Edad
                      </label>
                      <p className="font-semibold text-blue-900">
                        {detallesCompletos?.paciente_edad || recetaSeleccionada.paciente_edad || 0} años
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de la receta */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg text-gray-800">
                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                    Información de la Receta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Código de Receta
                      </label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded border text-gray-800">
                        {recetaSeleccionada.codigo_receta || "Sin código"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Estado
                      </label>
                      <div className="mt-1">
                        {getEstadoBadge(recetaSeleccionada.estado)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Diagnóstico Principal
                    </label>
                    <p className="bg-gray-100 p-3 rounded border text-gray-800 font-medium">
                      {recetaSeleccionada.diagnostico_principal_texto ||
                        "No especificado"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Fecha de Emisión
                      </label>
                      <p className="text-gray-800 font-medium">
                        {formatearFecha(recetaSeleccionada.fecha_emision)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Fecha de Vencimiento
                      </label>
                      <p className="text-gray-800 font-medium">
                        {formatearFecha(recetaSeleccionada.fecha_vencimiento)}
                      </p>
                    </div>
                  </div>

                  {recetaSeleccionada.observaciones && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Observaciones Generales
                      </label>
                      <p className="bg-gray-100 p-3 rounded border text-gray-800 whitespace-pre-wrap">
                        {recetaSeleccionada.observaciones}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medicamentos */}
              {detallesCompletos?.medicamentos &&
                detallesCompletos.medicamentos.length > 0 && (
                  <Card className="bg-white border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg text-gray-800">
                        <Pill className="w-5 h-5 mr-2 text-gray-600" />
                        Medicamentos Recetados (
                        {detallesCompletos.medicamentos.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {detallesCompletos.medicamentos.map(
                          (med: any, index: number) => (
                            <div
                              key={med.id || index}
                              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-800 text-lg">
                                    {med.nombre_comercial ||
                                      "Medicamento no especificado"}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {med.nombre_generico || ""}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    med.dispensado ? "default" : "outline"
                                  }
                                  className={
                                    med.dispensado
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  }
                                >
                                  {med.dispensado ? "Dispensado" : "Pendiente"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Dosis:
                                  </span>
                                  <p className="text-gray-800">
                                    {med.dosis || "No especificada"}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Frecuencia:
                                  </span>
                                  <p className="text-gray-800">
                                    {med.frecuencia || "No especificada"}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Duración:
                                  </span>
                                  <p className="text-gray-800">
                                    {med.duracion_dias || 0} días
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Cantidad:
                                  </span>
                                  <p className="text-gray-800">
                                    {med.cantidad || 0} unidades
                                  </p>
                                </div>
                              </div>

                              {med.instrucciones_especiales && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Instrucciones Especiales:
                                  </span>
                                  <p className="text-gray-800 mt-1">
                                    {med.instrucciones_especiales}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Acciones */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setMostrarDetalles(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => verCodigoQR(recetaSeleccionada)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Ver QR
                </Button>
                <Button
                  variant="outline"
                  onClick={() => descargarPDF(recetaSeleccionada)}
                  disabled={descargandoPDF === recetaSeleccionada.id}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {descargandoPDF === recetaSeleccionada.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Descargar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ AGREGADO: Modal de QR (IGUAL QUE PACIENTE) */}
      <Dialog open={mostrarQR} onOpenChange={setMostrarQR}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="flex items-center text-xl font-bold text-gray-800">
              <QrCode className="w-6 h-6 mr-3 text-blue-600" />
              Código QR de Receta
            </DialogTitle>
          </DialogHeader>

          {recetaSeleccionada && (
            <div className="py-6 text-center">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Escanee este código para verificar la receta
                </p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded border">
                  {recetaSeleccionada.codigo_receta}
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block mb-4">
                <img
                  src={generarQRSimple(
                    `https://medilink.com/recetas/verificar/${recetaSeleccionada.codigo_receta}`
                  )}
                  alt="Código QR de la receta"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>Receta: {recetaSeleccionada.codigo_receta}</p>
                <p>
                  Médico: Dr. {recetaSeleccionada.medico_nombre}{" "}
                  {recetaSeleccionada.medico_apellido}
                </p>
                <p>
                  Vence: {formatearFecha(recetaSeleccionada.fecha_vencimiento)}
                </p>
              </div>

              <div className="flex justify-center space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setMostrarQR(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    const qrUrl = generarQRSimple(
                      `https://medilink.com/recetas/verificar/${recetaSeleccionada.codigo_receta}`
                    );
                    window.open(qrUrl, "_blank");
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
