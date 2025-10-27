// components/paciente/ModalDetallesReceta.tsx
import { useState } from "react";

interface ModalDetallesRecetaProps {
  receta: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalDetallesReceta({
  receta,
  isOpen,
  onClose,
}: ModalDetallesRecetaProps) {
  const [mostrarQR, setMostrarQR] = useState(false);

  if (!isOpen || !receta) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Receta Médica
              </h2>
              <p className="text-gray-600">Código: {receta.codigo_receta}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
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
                  <p className="text-sm">
                    {receta.paciente_nombre} {receta.paciente_apellido}
                  </p>
                  <p className="text-xs text-blue-600">
                    DNI: {receta.paciente_dni}
                  </p>
                  <p className="text-xs text-blue-600">
                    Edad: {receta.paciente_edad} años
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Médico</h3>
                  <p className="text-sm">Dr. {receta.medico_nombre}</p>
                  <p className="text-xs text-green-600">
                    CMP: {receta.medico_colegiatura}
                  </p>
                  <p className="text-xs text-green-600">
                    {receta.especialidad}
                  </p>
                </div>
              </div>

              {/* Diagnóstico y observaciones */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Diagnóstico
                </h3>
                <p className="text-sm">{receta.diagnostico}</p>
                {receta.nombre_enfermedad && (
                  <p className="text-xs text-gray-600 mt-1">
                    CIE-10: {receta.codigo_cie10} - {receta.nombre_enfermedad}
                  </p>
                )}
              </div>

              {receta.observaciones_generales && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Observaciones
                  </h3>
                  <p className="text-sm">{receta.observaciones_generales}</p>
                </div>
              )}

              {/* Medicamentos */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-800">
                    Medicamentos Recetados
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {receta.medicamentos?.map((med: any, index: number) => (
                    <div key={med.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {med.nombre_medicamento}
                          {med.id_medicamento && (
                            <span className="text-xs text-gray-500 ml-2">
                              (#{med.id_medicamento})
                            </span>
                          )}
                        </h4>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            med.dispensado
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
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
                          <p className="font-medium">
                            {med.duracion_dias} días
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cantidad:</span>
                          <p className="font-medium">{med.cantidad}</p>
                        </div>
                      </div>

                      {med.instrucciones_especiales && (
                        <div className="mt-2">
                          <span className="text-gray-600 text-sm">
                            Instrucciones:
                          </span>
                          <p className="text-sm mt-1">
                            {med.instrucciones_especiales}
                          </p>
                        </div>
                      )}

                      {med.dispensado && (
                        <div className="mt-2 bg-blue-50 p-2 rounded text-xs">
                          <p className="text-blue-700">
                            Dispensado el{" "}
                            {new Date(
                              receta.fecha_dispensacion
                            ).toLocaleDateString()}
                            {receta.farmacia_nombre &&
                              ` en ${receta.farmacia_nombre}`}
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
                <h3 className="font-semibold text-gray-800 mb-3">
                  Información de la Receta
                </h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-600">Estado</span>
                    <div
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        receta.estado === "activa"
                          ? "bg-green-100 text-green-800"
                          : receta.estado === "dispensada"
                          ? "bg-blue-100 text-blue-800"
                          : receta.estado === "vencida"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {receta.estado.replace("_", " ")}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">
                      Fecha de Emisión
                    </span>
                    <p className="text-sm font-medium">
                      {new Date(receta.fecha_emision).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">Vence el</span>
                    <p className="text-sm font-medium">
                      {new Date(receta.fecha_vencimiento).toLocaleDateString()}
                    </p>
                  </div>

                  {receta.fecha_dispensacion && (
                    <div>
                      <span className="text-xs text-gray-600">
                        Dispensada el
                      </span>
                      <p className="text-sm font-medium">
                        {new Date(
                          receta.fecha_dispensacion
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Acciones</h3>

                <div className="space-y-2">
                  {receta.pdf_path && (
                    <a
                      href={receta.pdf_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
                    >
                      📄 Descargar PDF
                    </a>
                  )}

                  <button
                    onClick={() => setMostrarQR(!mostrarQR)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center"
                  >
                    📱 {mostrarQR ? "Ocultar" : "Mostrar"} QR
                  </button>

                  {receta.codigo_qr && mostrarQR && (
                    <div className="mt-3 p-3 bg-white border rounded-lg text-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${receta.codigo_qr}`}
                        alt="Código QR Receta"
                        className="mx-auto"
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Escanear para verificar autenticidad
                      </p>
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
