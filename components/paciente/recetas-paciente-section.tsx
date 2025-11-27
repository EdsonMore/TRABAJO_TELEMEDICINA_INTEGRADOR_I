// components/paciente/recetas-paciente-section.tsx - VERSIÓN MEJORADA
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Search,
  Calendar,
  User,
  Pill,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
  Stethoscope,
  QrCode,
} from "lucide-react";

// Usar las interfaces desde types/receta.ts
interface Receta {
  id: string;
  codigo_receta: string;
  diagnostico_principal_texto: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  observaciones?: string;
  estado: "activa" | "dispensada" | "vencida" | "cancelada";
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  total_medicamentos: number;
  sello_temporal: string;
  diagnostico?: string; // Campo adicional para compatibilidad
}

interface MedicamentoReceta {
  id: string;
  nombre_comercial: string;
  nombre_generico: string;
  forma_farmaceutica?: string;
  concentracion?: string;
  cantidad: number;
  dosis: string;
  frecuencia: string;
  duracion_dias: number;
  via_administracion?: string;
  instrucciones_especiales?: string;
  dispensado: boolean;
}

export function RecetasPacienteSection() {
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [recetasFiltradas, setRecetasFiltradas] = useState<Receta[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [tabActiva, setTabActiva] = useState("todas");
  const [isLoading, setIsLoading] = useState(true);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(
    null
  );
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [detallesCompletos, setDetallesCompletos] = useState<any>(null);
  const [farmacias, setFarmacias] = useState<any[]>([]);
  const [selectedFarmaciaId, setSelectedFarmaciaId] = useState<string | null>(null);
  const [selectedMedicamentos, setSelectedMedicamentos] = useState<Record<string, { cantidad: number; selected: boolean }>>({});
  const [enviarLoading, setEnviarLoading] = useState(false);
  const [estimacionCosto, setEstimacionCosto] = useState<number | null>(null);
  const [descargandoPDF, setDescargandoPDF] = useState<string | null>(null);
  const [mostrarQR, setMostrarQR] = useState(false);

  useEffect(() => {
    if (token) {
      cargarRecetas();
    }
  }, [token]);

  useEffect(() => {
    filtrarRecetas();
  }, [recetas, busqueda, tabActiva]);

  const cargarRecetas = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/recetas/paciente", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📋 Recetas del paciente cargadas:", data.recetas);

        // ✅ CORREGIDO: Mapear correctamente el diagnóstico
        const recetasMapeadas = (data.recetas || []).map((receta: any) => ({
          ...receta,
          // Usar diagnóstico_principal_texto si existe, sino usar diagnostico (del API viejo)
          diagnostico_principal_texto:
            receta.diagnostico_principal_texto ||
            receta.diagnostico ||
            "Diagnóstico no especificado",
        }));

        setRecetas(recetasMapeadas);
      } else {
        console.error("Error cargando recetas:", await response.text());
      }
    } catch (error) {
      console.error("Error cargando recetas:", error);
    } finally {
      setIsLoading(false);
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

  const cargarFarmacias = async () => {
    try {
      const res = await fetch(`/api/farmacias`);
      if (res.ok) {
        const data = await res.json();
        setFarmacias(data.farmacias || []);
      }
    } catch (error) {
      console.error("Error cargando farmacias:", error);
    }
  };

  const filtrarRecetas = () => {
    let filtradas = recetas;

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase().trim();
      filtradas = filtradas.filter(
        (receta) =>
          (receta.medico_nombre || "").toLowerCase().includes(busquedaLower) ||
          (receta.medico_apellido || "")
            .toLowerCase()
            .includes(busquedaLower) ||
          (receta.especialidad || "").toLowerCase().includes(busquedaLower) ||
          (receta.diagnostico_principal_texto || "")
            .toLowerCase()
            .includes(busquedaLower) ||
          (receta.codigo_receta || "").toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por tab activa
    if (tabActiva !== "todas") {
      filtradas = filtradas.filter((receta) => receta.estado === tabActiva);
    }

    setRecetasFiltradas(filtradas);
  };

  // ✅ IMPLEMENTACIÓN CORREGIDA DE DESCARGA PDF
  const descargarPDF = async (receta: Receta) => {
    if (!token) return;

    setDescargandoPDF(receta.id);
    try {
      // ✅ CORRECCIÓN: Usar el endpoint específico para pacientes
      const response = await fetch(`/api/recetas/paciente/${receta.id}/pdf`, {
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
      // Fallback: generar PDF básico
      generarPDFFallback(receta, detallesCompletos);
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
        <p><strong>Paciente:</strong> Receta médica personal</p>
        <p><strong>Receta:</strong> ${receta.codigo_receta}</p>
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
    // Inicializar selección de medicamentos
    const map: any = {};
    (detalles?.medicamentos || []).forEach((m: any) => {
      map[m.id] = { cantidad: m.cantidad || 1, selected: true };
    });
    setSelectedMedicamentos(map);

    // Cargar farmacias para que paciente pueda elegir
    cargarFarmacias();

    // Reset estimación y farmacia seleccionada
    setSelectedFarmaciaId(null);
    setEstimacionCosto(null);

    setMostrarDetalles(true);
  };

  const calcularEstimacion = async (farmaciaId: string | null) => {
    if (!farmaciaId) return setEstimacionCosto(null);
    try {
      const res = await fetch(`/api/farmacias?farmacia_id=${farmaciaId}`);
      if (!res.ok) return setEstimacionCosto(null);
      const data = await res.json();
      const invMap: any = {};
      (data.inventario || []).forEach((i: any) => (invMap[i.id_medicamento] = i));
      let total = 0;
      Object.keys(selectedMedicamentos).forEach((medId) => {
        const sel = selectedMedicamentos[medId];
        if (sel.selected) {
          const inv = invMap[medId];
          const precio = inv ? parseFloat(inv.precio_venta || 0) : 0;
          total += precio * sel.cantidad;
        }
      });
      setEstimacionCosto(Number(total.toFixed(2)));
    } catch (error) {
      console.error("Error calculando estimación:", error);
      setEstimacionCosto(null);
    }
  };

  useEffect(() => {
    // Recalcular estimación cuando cambian selección o farmacia
    if (selectedFarmaciaId) calcularEstimacion(selectedFarmaciaId);
    else setEstimacionCosto(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMedicamentos, selectedFarmaciaId]);

  const toggleMedicamento = (medId: string) => {
    setSelectedMedicamentos((prev) => ({
      ...prev,
      [medId]: { ...(prev[medId] || { cantidad: 1, selected: false }), selected: !(prev[medId]?.selected) },
    }));
  };

  const setCantidadMedicamento = (medId: string, cantidad: number) => {
    setSelectedMedicamentos((prev) => ({
      ...prev,
      [medId]: { ...(prev[medId] || { cantidad: 1, selected: true }), cantidad },
    }));
  };

  const puedeEnviarReceta = (receta: Receta): boolean => {
    return (
      receta.estado === "activa" &&
      (!receta.estado || receta.estado !== "dispensada") &&
      (!receta.estado_envio || receta.estado_envio === "no_enviada")
    );
  };

  const enviarSolicitud = async (tipo: 'retirar' | 'enviar') => {
    if (!recetaSeleccionada) return;

    // Bloquear si ya fue enviada
    if (!puedeEnviarReceta(recetaSeleccionada)) {
      return;
    }

    // Redirigir al nuevo flujo de envío de recetas
    // Usar la ruta /dashboard/paciente/farmacias/[recetaId] para el proceso de selección de farmacia
    const url = `/dashboard/paciente/farmacias/${recetaSeleccionada.id}`;
    window.location.href = url;
  };

  // ✅ FUNCIÓN MEJORADA PARA QR
  const verCodigoQR = (receta: Receta) => {
    setRecetaSeleccionada(receta);
    setMostrarQR(true);
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

  // Función para generar QR simple (puedes integrar una librería como qrcode después)
  const generarQRSimple = (text: string) => {
    // Por ahora mostramos un QR simulado
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      text
    )}`;
  };

  // Estadísticas
  const estadisticas = {
    total: recetas.length,
    activas: recetas.filter((r) => r.estado === "activa").length,
    dispensadas: recetas.filter((r) => r.estado === "dispensada").length,
    vencidas: recetas.filter((r) => r.estado === "vencida").length,
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando sus recetas médicas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Mis Recetas Médicas
        </h2>
        <p className="text-gray-600 mt-1">
          Gestione y consulte todas sus recetas médicas
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-800">
                  {estadisticas.total}
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
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {estadisticas.activas}
                </p>
              </div>
              <Pill className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dispensadas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {estadisticas.dispensadas}
                </p>
              </div>
              <Stethoscope className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">
                  {estadisticas.vencidas}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por médico, especialidad o diagnóstico..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabs de estado */}
      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="todas"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Todas ({estadisticas.total})
          </TabsTrigger>
          <TabsTrigger
            value="activa"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Activas ({estadisticas.activas})
          </TabsTrigger>
          <TabsTrigger
            value="dispensada"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Dispensadas ({estadisticas.dispensadas})
          </TabsTrigger>
          <TabsTrigger
            value="vencida"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Vencidas ({estadisticas.vencidas})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tabActiva} className="space-y-4 mt-6">
          {recetasFiltradas.length === 0 ? (
            <Card className="text-center py-12 border-2 border-dashed border-gray-300 bg-gray-50">
              <CardContent>
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {busqueda || tabActiva !== "todas"
                    ? "No se encontraron recetas"
                    : "No hay recetas registradas"}
                </h3>
                <p className="text-gray-500">
                  {busqueda || tabActiva !== "todas"
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Sus recetas médicas aparecerán aquí"}
                </p>
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
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-gray-800">
                              Dr. {receta.medico_nombre}{" "}
                              {receta.medico_apellido}
                            </h3>
                            {getEstadoBadge(receta.estado)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {receta.especialidad} • Código:{" "}
                            {receta.codigo_receta}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                            {receta.total_medicamentos} medicamento(s)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="font-medium text-sm text-gray-800">
                          Diagnóstico: {receta.diagnostico_principal_texto}
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
                      {/* ✅ BOTÓN QR AGREGADO */}
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
        </TabsContent>
      </Tabs>

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
              {/* Información del médico */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg text-blue-800">
                    <User className="w-5 h-5 mr-2" />
                    Información del Médico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-blue-700">
                        Médico Prescriptor
                      </label>
                      <p className="font-semibold text-blue-900">
                        Dr. {recetaSeleccionada.medico_nombre}{" "}
                        {recetaSeleccionada.medico_apellido}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-700">
                        Especialidad
                      </label>
                      <p className="font-semibold text-blue-900">
                        {recetaSeleccionada.especialidad}
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
                        {recetaSeleccionada.codigo_receta}
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
                      {recetaSeleccionada.diagnostico_principal_texto}
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
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedMedicamentos[med.id]?.selected}
                                    onChange={() => toggleMedicamento(med.id)}
                                    className="mt-1 w-4 h-4 text-blue-600"
                                  />
                                  <div>
                                    <h4 className="font-semibold text-gray-800 text-lg">
                                      {med.nombre_comercial ||
                                        "Medicamento no especificado"}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {med.nombre_generico || ""}
                                    </p>
                                  </div>
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

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-3 items-center">
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
                                  <label className="font-medium text-gray-700 block">Cantidad</label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={selectedMedicamentos[med.id]?.cantidad || med.cantidad || 1}
                                    onChange={(e) => setCantidadMedicamento(med.id, Number(e.target.value))}
                                    className="w-20 border rounded px-2 py-1"
                                  />
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Seleccionado</span>
                                  <p className="text-gray-800">{selectedMedicamentos[med.id]?.selected ? 'Sí' : 'No'}</p>
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

              {/* Selección y Envío */}
              <Card className="bg-white border-gray-200 mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg text-gray-800">
                    <span className="w-5 h-5 mr-2 text-gray-600">🛒</span>
                    Opciones de Compra / Envío
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Seleccionar farmacia</label>
                      <select
                        value={selectedFarmaciaId || ''}
                        onChange={(e) => setSelectedFarmaciaId(e.target.value || null)}
                        className="w-full border rounded px-2 py-2 mt-1"
                      >
                        <option value="">-- Elegir farmacia (opcional) --</option>
                        {farmacias.map((f) => (
                          <option key={f.id} value={f.id}>{f.nombre_comercial} — {f.direccion}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Estimación de costo</label>
                      <p className="mt-1 text-gray-800 font-semibold">{estimacionCosto !== null ? `S/ ${estimacionCosto.toFixed(2)}` : 'Seleccione farmacia'}</p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        disabled={enviarLoading || !puedeEnviarReceta(recetaSeleccionada)}
                        onClick={() => enviarSolicitud('retirar')}
                        className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!puedeEnviarReceta(recetaSeleccionada) ? "Esta receta ya fue enviada a una farmacia" : ""}
                      >
                        {enviarLoading ? 'Enviando...' : 'Comprar en farmacia (Retirar)'}
                      </Button>
                      <Button
                        disabled={enviarLoading || !puedeEnviarReceta(recetaSeleccionada)}
                        onClick={() => enviarSolicitud('enviar')}
                        className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!puedeEnviarReceta(recetaSeleccionada) ? "Esta receta ya fue enviada a una farmacia" : ""}
                      >
                        {enviarLoading ? 'Enviando...' : 'Enviar a farmacia (que despache)'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

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

      {/* Modal de QR */}
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
