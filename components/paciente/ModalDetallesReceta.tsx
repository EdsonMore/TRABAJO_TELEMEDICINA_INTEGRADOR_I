// components/paciente/ModalDetallesReceta.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ModalDetallesRecetaProps {
  receta: any;
  isOpen: boolean;
  onClose: () => void;
  onEnviar?: (recetaId: string) => void;
}

function safeFormatDate(value: any) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-PE");
  } catch (e) {
    return "-";
  }
}

function normalizeMedicamento(med: any = {}) {
  return {
    id: med.id || med.detalle_id || med.receta_detalle_id || med.medicamento?.id || null,
    nombre_comercial:
      med.medicamento?.nombre_comercial || med.nombre_comercial || med.nombre || med.medicamento_nombre || "-",
    dosis: med.dosis || med.posologia || med.forma || "-",
    frecuencia: med.frecuencia || med.intervalo || med.frecuencia_text || "-",
    duracion_dias: med.duracion_dias || med.duracion || med.duracion_en_dias || null,
    cantidad: med.cantidad || med.cantidad_requerida || med.cantidad_solicitada || "-",
    instrucciones_especiales: med.instrucciones_especiales || med.instrucciones || med.instrucciones_admin || "",
    dispensado: !!(med.dispensado || med.dispensado_flag || med.dispensado === true),
    medicamento: med.medicamento || null,
  };
}

export default function ModalDetallesReceta({
  receta,
  isOpen,
  onClose,
  onEnviar,
}: ModalDetallesRecetaProps) {
  const [mostrarQR, setMostrarQR] = useState(false);
  const [descargandoPDF, setDescargandoPDF] = useState(false);
  const [descargandoBoleta, setDescargandoBoleta] = useState<"nota" | "boleta" | null>(null);
  const [recetaCompleta, setRecetaCompleta] = useState<any>(null);
  const [boletaInfo, setBoletaInfo] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  // 🔄 CARGAR DATOS COMPLETOS DE LA BD AL ABRIR EL MODAL
  useEffect(() => {
    if (isOpen && receta?.id && token) {
      cargarRecetaCompleta();
      cargarInfoBoleta();
    }
  }, [isOpen, receta?.id, token]);

  // 📋 FUNCIÓN: Cargar información de la boleta
  const cargarInfoBoleta = async () => {
    if (!receta?.id || !token) {
      console.log("❌ No se puede cargar boleta: receta.id o token faltante");
      return;
    }

    try {
      console.log("🔄 Cargando información de boleta para receta:", receta.id);
      
      const response = await fetch(`/api/farmacia/recetas/${receta.id}/obtener-boleta`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Respuesta del servidor:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📥 Datos recibidos:", data);
        
        if (data.boleta) {
          setBoletaInfo(data.boleta);
          console.log("✅ Información de boleta cargada:", data.boleta);
        } else {
          console.log("⚠️ No hay boleta disponible aún");
          setBoletaInfo(null);
        }
      } else {
        console.error("❌ Error en respuesta:", response.status);
        const error = await response.json().catch(() => ({}));
        console.error("Error details:", error);
        setBoletaInfo(null);
      }
    } catch (error) {
      console.error("❌ Error cargando información de boleta:", error);
      setBoletaInfo(null);
    }
  };

  // 📥 FUNCIÓN: Cargar datos completos de la receta desde la BD
  const cargarRecetaCompleta = async () => {
    try {
      setCargando(true);
      console.log("🔄 Cargando datos completos de receta:", receta?.id);

      const response = await fetch(`/api/recetas/${receta?.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Receta completa cargada:", data);
        setRecetaCompleta(data.receta || data);
      } else {
        console.warn("⚠️ No se pudieron cargar datos completos, usando básicos");
        setRecetaCompleta(receta);
      }
    } catch (error) {
      console.error("❌ Error cargando receta completa:", error);
      setRecetaCompleta(receta);
    } finally {
      setCargando(false);
    }
  };

  // 📄 FUNCIÓN: Descargar PDF CON TOKEN
  const descargarPDF = async () => {
    if (!receta?.id) {
      toast?.({
        title: "Error",
        description: "No se pudo identificar la receta",
        variant: "destructive",
      });
      return;
    }

    try {
      setDescargandoPDF(true);
      console.log("📥 Descargando PDF de receta:", receta.id);

      const response = await fetch(`/api/recetas/paciente/${receta.id}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(error.error || `Error ${response.status}`);
      }

      // Descargar como HTML o PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receta_${receta.codigo_receta || "medica"}.html`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast?.({
        title: "✅ Descarga completada",
        description: "La receta se descargó exitosamente",
      });
    } catch (error: any) {
      console.error("❌ Error descargando PDF:", error);
      toast?.({
        title: "Error al descargar",
        description: error.message || "No se pudo descargar la receta",
        variant: "destructive",
      });
    } finally {
      setDescargandoPDF(false);
    }
  };

  // 🧾 FUNCIÓN: Descargar boleta/nota de venta
  const descargarBoleta = async (tipo: "nota" | "boleta") => {
    if (!receta?.id) {
      toast?.({
        title: "Error",
        description: "No se pudo identificar la receta",
        variant: "destructive",
      });
      return;
    }

    try {
      setDescargandoBoleta(tipo);
      console.log(`📥 Descargando ${tipo === "nota" ? "nota de venta" : "boleta"}:`, receta.id);

      // Primero obtener la ruta del archivo
      const response = await fetch(`/api/farmacia/recetas/${receta.id}/obtener-boleta`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tipo }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(error.error || `Error ${response.status}`);
      }

      const data = await response.json();
      const { pdfPath, nombre_archivo } = data;

      // Descargar el archivo directamente
      const pdfResponse = await fetch(pdfPath);
      if (!pdfResponse.ok) {
        throw new Error("No se pudo descargar el archivo PDF");
      }

      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nombre_archivo;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast?.({
        title: "✅ Descarga completada",
        description: `La ${tipo === "nota" ? "nota de venta" : "boleta"} se descargó exitosamente`,
      });
    } catch (error: any) {
      console.error(`❌ Error descargando ${tipo}:`, error);
      toast?.({
        title: "Error al descargar",
        description: error.message || `No se pudo descargar la ${tipo === "nota" ? "nota de venta" : "boleta"}`,
        variant: "destructive",
      });
    } finally {
      setDescargandoBoleta(null);
    }
  };

  // Función para verificar si se puede enviar la receta
  const puedeEnviar = (receta: any): boolean => {
    // Solo se puede enviar si está activa y no fue enviada aún
    const estadoEnvio = receta.estado_envio || "no_enviada";
    return receta.estado === "activa" && estadoEnvio === "no_enviada";
  };

  // Normalizar receta y evitar crashes si la estructura es distinta
  const r = useMemo(() => {
    if (!receta) return null;
    const pacienteNombre = receta.paciente?.nombre || receta.paciente_nombre || "";
    const pacienteApellido = receta.paciente?.apellido || receta.paciente_apellido || "";
    const pacienteCompleto = `${(pacienteNombre || "").trim()} ${(pacienteApellido || "").trim()}`.trim() || "-";

    const medicoNombre = receta.medico?.nombre || receta.medico_nombre || (receta.medico_nombre && receta.medico_apellido ? `${receta.medico_nombre} ${receta.medico_apellido}` : receta.medico_nombre) || "-";

    const medicamentosRaw = receta.medicamentos || receta.detalle || receta.detalles || receta.receta_detalle || [];
    const medicamentos = Array.isArray(medicamentosRaw) ? medicamentosRaw.map(normalizeMedicamento) : [];

    const qrData = receta.codigo_qr || receta.codigo_verificacion || receta.codigo_receta || receta.id || "";

    return {
      id: receta.id || receta.receta_id || receta.codigo_receta || null,
      codigo_receta: receta.codigo_receta || receta.codigo || receta.id || "-",
      paciente_nombre_completo: pacienteCompleto,
      paciente_dni: receta.paciente?.dni || receta.paciente_dni || receta.paciente_documento || "-",
      paciente_edad: receta.paciente?.edad || receta.paciente_edad || receta.edad || "-",
      medico_nombre: medicoNombre,
      medico_apellido: receta.medico?.apellido || receta.medico_apellido || "",
      medico_colegiatura: receta.medico?.colegiatura || receta.medico_colegiatura || receta.medico_cmp || "-",
      especialidad: receta.especialidad || receta.medico_especialidad || "-",
      diagnostico: receta.diagnostico || receta.descripcion || "-",
      nombre_enfermedad: receta.nombre_enfermedad || receta.enfermedad_nombre || null,
      codigo_cie10: receta.codigo_cie10 || receta.cie10 || null,
      observaciones_generales: receta.observaciones_generales || receta.observaciones || "",
      medicamentos,
      estado: receta.estado || "desconocido",
      estado_envio: receta.estado_envio || "no_enviada",
      fecha_emision: receta.fecha_emision || receta.created_at || null,
      fecha_vencimiento: receta.fecha_vencimiento || receta.vencimiento || null,
      fecha_dispensacion: receta.fecha_dispensacion || receta.dispensacion_fecha || null,
      fecha_dispensacion_raw: receta.fecha_dispensacion,
      farmacia_nombre: receta.farmacia_nombre || null,
      pdf_path: receta.pdf_path || receta.pdfUrl || receta.pdf || null,
      codigo_qr: qrData,
    };
  }, [receta]);

  // 🔄 USA RECETA COMPLETA SI ESTÁ DISPONIBLE, SINO USA LA NORMALIZADA
  const datosReceta = useMemo(() => {
    if (!recetaCompleta) return r;

    // Normalizar receta completa igual que la básica
    const pacienteNombre = recetaCompleta.paciente?.nombre || recetaCompleta.paciente_nombre || "";
    const pacienteApellido = recetaCompleta.paciente?.apellido || recetaCompleta.paciente_apellido || "";
    const pacienteCompleto = `${(pacienteNombre || "").trim()} ${(pacienteApellido || "").trim()}`.trim() || "-";

    const medicoNombre = recetaCompleta.medico?.nombre || recetaCompleta.medico_nombre || 
      (recetaCompleta.medico_nombre && recetaCompleta.medico_apellido ? 
        `${recetaCompleta.medico_nombre} ${recetaCompleta.medico_apellido}` : 
        recetaCompleta.medico_nombre) || "-";

    const medicoApellido = recetaCompleta.medico?.apellido || recetaCompleta.medico_apellido || "";

    const medicamentosRaw = recetaCompleta.medicamentos || recetaCompleta.detalle || recetaCompleta.detalles || recetaCompleta.receta_detalle || [];
    const medicamentos = Array.isArray(medicamentosRaw) ? medicamentosRaw.map(normalizeMedicamento) : [];

    const qrData = recetaCompleta.codigo_qr || recetaCompleta.codigo_verificacion || recetaCompleta.codigo_receta || recetaCompleta.id || "";

    return {
      id: recetaCompleta.id || recetaCompleta.receta_id || recetaCompleta.codigo_receta || null,
      codigo_receta: recetaCompleta.codigo_receta || recetaCompleta.codigo || recetaCompleta.id || "-",
      paciente_nombre_completo: pacienteCompleto,
      paciente_dni: recetaCompleta.paciente?.dni || recetaCompleta.paciente_dni || recetaCompleta.paciente_documento || "-",
      paciente_edad: recetaCompleta.paciente?.edad || recetaCompleta.paciente_edad || recetaCompleta.edad || "-",
      medico_nombre: medicoNombre,
      medico_apellido: medicoApellido,
      medico_colegiatura: recetaCompleta.medico?.numero_colegiatura || recetaCompleta.medico?.colegiatura || recetaCompleta.medico_colegiatura || recetaCompleta.medico_cmp || "-",
      especialidad: recetaCompleta.especialidad || recetaCompleta.medico_especialidad || recetaCompleta.medico?.especialidad || "-",
      diagnostico: recetaCompleta.diagnostico_principal_texto || recetaCompleta.diagnostico || recetaCompleta.descripcion || "-",
      nombre_enfermedad: recetaCompleta.nombre_enfermedad || recetaCompleta.enfermedad_nombre || null,
      codigo_cie10: recetaCompleta.codigo_cie10 || recetaCompleta.cie10 || null,
      observaciones_generales: recetaCompleta.observaciones_generales || recetaCompleta.observaciones || "",
      medicamentos,
      estado: recetaCompleta.estado || "desconocido",
      estado_envio: recetaCompleta.estado_envio || "no_enviada",
      fecha_emision: recetaCompleta.fecha_emision || recetaCompleta.created_at || null,
      fecha_vencimiento: recetaCompleta.fecha_vencimiento || recetaCompleta.vencimiento || null,
      fecha_dispensacion: recetaCompleta.fecha_dispensacion || recetaCompleta.dispensacion_fecha || null,
      fecha_dispensacion_raw: recetaCompleta.fecha_dispensacion,
      farmacia_nombre: recetaCompleta.farmacia_nombre || null,
      pdf_path: recetaCompleta.pdf_path || recetaCompleta.pdfUrl || recetaCompleta.pdf || null,
      codigo_qr: qrData,
    };
  }, [recetaCompleta, r]);

  if (!isOpen || !datosReceta) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    datosReceta.codigo_qr
  )}`;

  // ✅ QR APUNTA AL PDF CON TOKEN
  const qrPdfUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/recetas/paciente/${datosReceta.id}/pdf?view=true`;
  const qrUrlVerificacion = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    qrPdfUrl
  )}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Receta Médica</h2>
              <p className="text-gray-600">Código: {datosReceta.codigo_receta}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" aria-label="Cerrar">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Datos del paciente y médico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Paciente</h3>
                  <p className="text-sm">{datosReceta.paciente_nombre_completo}</p>
                  <p className="text-xs text-blue-600">DNI: {datosReceta.paciente_dni}</p>
                  <p className="text-xs text-blue-600">Edad: {datosReceta.paciente_edad} años</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Médico</h3>
                  <p className="text-sm">{datosReceta.medico_nombre.startsWith("Dr.") ? datosReceta.medico_nombre : `Dr. ${datosReceta.medico_nombre}`} {datosReceta.medico_apellido}</p>
                  <p className="text-xs text-green-600">CMP: {datosReceta.medico_colegiatura}</p>
                  <p className="text-xs text-green-600">{datosReceta.especialidad}</p>
                </div>
              </div>

              {/* Diagnóstico y observaciones */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Diagnóstico</h3>
                <p className="text-sm">{datosReceta.diagnostico}</p>
                {datosReceta.nombre_enfermedad && (
                  <p className="text-xs text-gray-600 mt-1">CIE-10: {datosReceta.codigo_cie10} - {datosReceta.nombre_enfermedad}</p>
                )}
              </div>

              {datosReceta.observaciones_generales && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Observaciones</h3>
                  <p className="text-sm">{datosReceta.observaciones_generales}</p>
                </div>
              )}

              {/* Medicamentos */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-800">Medicamentos Recetados</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {datosReceta.medicamentos.length === 0 && (
                    <div className="p-4 text-sm text-gray-600">No hay medicamentos asociados a esta receta.</div>
                  )}
                  {datosReceta.medicamentos.map((med: any, index: number) => (
                    <div key={med.id || index} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {med.nombre_comercial}
                          <span className="text-xs text-gray-500 ml-2">{med.id ? `(#${med.id})` : null}</span>
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${med.dispensado ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {med.dispensado ? "Dispensado" : "Pendiente"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Dosis:</span>
                          <p className="font-medium">{med.dosis}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Frecuencia:</span>
                          <p className="font-medium">{med.frecuencia}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Duración:</span>
                          <p className="font-medium">{med.duracion_dias ? `${med.duracion_dias} días` : "-"}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cantidad:</span>
                          <p className="font-medium">{med.cantidad}</p>
                        </div>
                      </div>

                      {med.instrucciones_especiales && (
                        <div className="mt-2">
                          <span className="text-gray-600 text-sm">Instrucciones:</span>
                          <p className="text-sm mt-1">{med.instrucciones_especiales}</p>
                        </div>
                      )}

                      {med.dispensado && (
                        <div className="mt-2 bg-blue-50 p-2 rounded text-xs">
                          <p className="text-blue-700">
                            Dispensado el {safeFormatDate(datosReceta.fecha_dispensacion)}{datosReceta.farmacia_nombre ? ` en ${datosReceta.farmacia_nombre}` : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel lateral */}
            <div className="space-y-6">
              {/* Estado y fechas */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Información de la Receta</h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-600">Estado</span>
                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      datosReceta.estado === "activa" ? "bg-green-100 text-green-800" : datosReceta.estado === "dispensada" ? "bg-blue-100 text-blue-800" : datosReceta.estado === "vencida" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {String(datosReceta.estado).replace("_", " ")}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">Fecha de Emisión</span>
                    <p className="text-sm font-medium">{safeFormatDate(datosReceta.fecha_emision)}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">Vence el</span>
                    <p className="text-sm font-medium">{safeFormatDate(datosReceta.fecha_vencimiento)}</p>
                  </div>

                  {datosReceta.fecha_dispensacion && (
                    <div>
                      <span className="text-xs text-gray-600">Dispensada el</span>
                      <p className="text-sm font-medium">{safeFormatDate(datosReceta.fecha_dispensacion)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Acciones</h3>

                <div className="space-y-2">
                  <button
                    onClick={descargarPDF}
                    disabled={descargandoPDF}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {descargandoPDF ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Descargando...
                      </>
                    ) : (
                      <>
                        📄 Descargar PDF
                      </>
                    )}
                  </button>

                  {/* Botones de boleta si está disponible */}
                  {boletaInfo && boletaInfo.nota_venta_pdf_path && (
                    <>
                      <button
                        onClick={() => descargarBoleta("nota")}
                        disabled={descargandoBoleta === "nota"}
                        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {descargandoBoleta === "nota" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            🧾 Nota de Venta
                          </>
                        )}
                      </button>

                      {boletaInfo.boleta_pdf_path && (
                        <button
                          onClick={() => descargarBoleta("boleta")}
                          disabled={descargandoBoleta === "boleta"}
                          className="w-full bg-amber-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {descargandoBoleta === "boleta" ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Descargando...
                            </>
                          ) : (
                            <>
                              📋 Boleta Farmacia
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}

                  {boletaInfo === null && !cargando && (
                    <div className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-md text-xs text-center">
                      La boleta será disponible después del despacho
                    </div>
                  )}

                  <button onClick={() => setMostrarQR(!mostrarQR)} className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center">
                    📱 {mostrarQR ? "Ocultar" : "Mostrar"} QR
                  </button>

                  {/* Enviar a farmacia desde el modal si se provee callback */}
                  {onEnviar && (
                    <Button 
                      className={`w-full mt-2 ${
                        puedeEnviar(datosReceta)
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "bg-gray-400 cursor-not-allowed opacity-50"
                      }`}
                      onClick={() => onEnviar(String(datosReceta.id || ""))}
                      disabled={!puedeEnviar(datosReceta)}
                      title={!puedeEnviar(datosReceta) ? "Esta receta ya fue enviada a una farmacia" : "Enviar a farmacia"}
                    >
                      🚚 {puedeEnviar(datosReceta) ? "Enviar a farmacia" : "Ya fue enviada"}
                    </Button>
                  )}

                  {datosReceta.codigo_qr && mostrarQR && (
                    <div className="mt-3 p-3 bg-white border rounded-lg text-center">
                      <img src={qrUrlVerificacion} alt="Código QR Receta" className="mx-auto" />
                      <p className="text-xs text-gray-600 mt-2">Escanear para ver la receta y verificar autenticidad</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
