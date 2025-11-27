// components/paciente/ModalDetallesReceta.tsx
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

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
    return d.toLocaleDateString();
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
  const { token } = useAuth();

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

  if (!isOpen || !r) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    r.codigo_qr
  )}`;

  const pdfUrl = r.pdf_path || (r.id ? `/api/recetas/paciente/${r.id}/pdf` : null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Receta Médica</h2>
              <p className="text-gray-600">Código: {r.codigo_receta}</p>
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
                  <p className="text-sm">{r.paciente_nombre_completo}</p>
                  <p className="text-xs text-blue-600">DNI: {r.paciente_dni}</p>
                  <p className="text-xs text-blue-600">Edad: {r.paciente_edad} años</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Médico</h3>
                  <p className="text-sm">Dr. {r.medico_nombre}</p>
                  <p className="text-xs text-green-600">CMP: {r.medico_colegiatura}</p>
                  <p className="text-xs text-green-600">{r.especialidad}</p>
                </div>
              </div>

              {/* Diagnóstico y observaciones */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Diagnóstico</h3>
                <p className="text-sm">{r.diagnostico}</p>
                {r.nombre_enfermedad && (
                  <p className="text-xs text-gray-600 mt-1">CIE-10: {r.codigo_cie10} - {r.nombre_enfermedad}</p>
                )}
              </div>

              {r.observaciones_generales && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Observaciones</h3>
                  <p className="text-sm">{r.observaciones_generales}</p>
                </div>
              )}

              {/* Medicamentos */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-800">Medicamentos Recetados</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {r.medicamentos.length === 0 && (
                    <div className="p-4 text-sm text-gray-600">No hay medicamentos asociados a esta receta.</div>
                  )}
                  {r.medicamentos.map((med: any, index: number) => (
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
                            Dispensado el {safeFormatDate(r.fecha_dispensacion)}{r.farmacia_nombre ? ` en ${r.farmacia_nombre}` : ""}
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
                      r.estado === "activa" ? "bg-green-100 text-green-800" : r.estado === "dispensada" ? "bg-blue-100 text-blue-800" : r.estado === "vencida" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {String(r.estado).replace("_", " ")}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">Fecha de Emisión</span>
                    <p className="text-sm font-medium">{safeFormatDate(r.fecha_emision)}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">Vence el</span>
                    <p className="text-sm font-medium">{safeFormatDate(r.fecha_vencimiento)}</p>
                  </div>

                  {r.fecha_dispensacion && (
                    <div>
                      <span className="text-xs text-gray-600">Dispensada el</span>
                      <p className="text-sm font-medium">{safeFormatDate(r.fecha_dispensacion)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Acciones</h3>

                <div className="space-y-2">
                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center">
                      📄 Descargar PDF
                    </a>
                  )}

                  <button onClick={() => setMostrarQR(!mostrarQR)} className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center">
                    📱 {mostrarQR ? "Ocultar" : "Mostrar"} QR
                  </button>

                  {/* Enviar a farmacia desde el modal si se provee callback */}
                  {onEnviar && (
                    <Button 
                      className={`w-full mt-2 ${
                        puedeEnviar(r)
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "bg-gray-400 cursor-not-allowed opacity-50"
                      }`}
                      onClick={() => onEnviar(String(r.id || ""))}
                      disabled={!puedeEnviar(r)}
                      title={!puedeEnviar(r) ? "Esta receta ya fue enviada a una farmacia" : "Enviar a farmacia"}
                    >
                      🚚 {puedeEnviar(r) ? "Enviar a farmacia" : "Ya fue enviada"}
                    </Button>
                  )}

                  {r.codigo_qr && mostrarQR && (
                    <div className="mt-3 p-3 bg-white border rounded-lg text-center">
                      <img src={qrUrl} alt="Código QR Receta" className="mx-auto" />
                      <p className="text-xs text-gray-600 mt-2">Escanear para verificar autenticidad</p>
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
