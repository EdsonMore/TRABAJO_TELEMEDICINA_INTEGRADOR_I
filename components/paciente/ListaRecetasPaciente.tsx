// components/paciente/ListaRecetasPaciente.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import ModalSeleccionarFarmacia from "./ModalSeleccionarFarmacia";
import ModalDetallesReceta from "./ModalDetallesReceta";
import { SendHorizontal, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Receta {
  id: string;
  codigo_receta: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: string;
  estado_envio?: string;
  total_medicamentos: number;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  pdf_path?: string;
  farmacia_dispensadora?: string;
}

export default function ListaRecetasPaciente() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<any>(null);
  const [showSeleccionarFarmacia, setShowSeleccionarFarmacia] = useState(false);
  const [recetaActualEnvio, setRecetaActualEnvio] = useState<string | null>(null);
  const [farmaciaEnvioConfirmada, setFarmaciaEnvioConfirmada] = useState<{
    recetaId: string;
    nombreFarmacia: string;
  } | null>(null);

  const { token: authToken } = useAuth();

  useEffect(() => {
    cargarRecetas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const cargarRecetas = async () => {
    try {
      // Preferir token desde el contexto de autenticación; fallback a key legacy en localStorage
      const token = authToken || localStorage.getItem("medilink_token") || localStorage.getItem("token");
      const response = await fetch("/api/paciente/recetas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      // Aceptar varias formas de respuesta para mantener compatibilidad:
      // 1) { success: true, recetas: [...] }
      // 2) { recetas: [...] }
      // 3) directamente un array de recetas
      if (data) {
        let rawRecetas: any[] = [];
        if (data) {
          if (data.success && Array.isArray(data.recetas)) rawRecetas = data.recetas;
          else if (Array.isArray(data.recetas)) rawRecetas = data.recetas;
          else if (Array.isArray(data)) rawRecetas = data;
          else {
            const maybe = (data as any).recetas;
            if (Array.isArray(maybe)) rawRecetas = maybe;
          }
        }

        // Normalizar forma de las recetas para mantener compatibilidad con el UI
        const normalized = rawRecetas.map((r: any) => ({
          id: r.id,
          codigo_receta: r.codigo_receta,
          fecha_emision: r.fecha_emision,
          fecha_vencimiento: r.fecha_vencimiento,
          estado: r.estado,
          estado_envio: r.estado_envio || r.estadoEnvio || r.estado_envio,
          total_medicamentos: r.total_medicamentos ?? (Array.isArray(r.medicamentos) ? r.medicamentos.length : 0),
          medico_nombre: (r.medico && r.medico.nombre) || r.medico_nombre || "",
          medico_apellido: (r.medico && r.medico.apellido) || r.medico_apellido || "",
          especialidad: (r.medico && r.medico.especialidad) || r.especialidad || "",
          pdf_path: r.pdf_path || r.pdf || null,
          farmacia_dispensadora: r.farmacia_dispensadora || r.farmacia || null,
          medicamentos: r.medicamentos || [],
        }));

        setRecetas(normalized);
      }
    } catch (error) {
      console.error("Error cargando recetas:", error);
    } finally {
      setCargando(false);
    }
  };

  const verDetallesReceta = async (recetaId: string) => {
    try {
      const token = authToken || localStorage.getItem("medilink_token") || localStorage.getItem("token");
      const response = await fetch(`/api/paciente/recetas/${recetaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      // Soportar formas de respuesta distintas
      if (data) {
        let rec = null as any;
        if (data.success && data.receta) rec = data.receta;
        else if (data.receta) rec = data.receta;
        else rec = data;

        // Normalizar algunos campos para el modal
        if (rec) {
          rec = {
            ...rec,
            medico_nombre: (rec.medico && rec.medico.nombre) || rec.medico_nombre || "",
            medico_apellido: (rec.medico && rec.medico.apellido) || rec.medico_apellido || "",
            especialidad: (rec.medico && rec.medico.especialidad) || rec.especialidad || "",
            total_medicamentos: rec.total_medicamentos ?? (Array.isArray(rec.medicamentos) ? rec.medicamentos.length : 0),
          };
          setRecetaSeleccionada(rec);
        }
      }
    } catch (error) {
      console.error("Error cargando detalles:", error);
    }
  };

  const abrirSeleccionFarmacia = (recetaId: string) => {
    setRecetaActualEnvio(recetaId);
    setShowSeleccionarFarmacia(true);
  };

  const handleFarmaciaSeleccionada = (
    farmaciaId: string,
    nombreFarmacia: string
  ) => {
    // Actualizar estado de la receta localmente
    if (recetaActualEnvio) {
      setRecetas(
        recetas.map((receta) =>
          receta.id === recetaActualEnvio
            ? { ...receta, estado_envio: "enviada", farmacia_dispensadora: nombreFarmacia }
            : receta
        )
      );
      setFarmaciaEnvioConfirmada({
        recetaId: recetaActualEnvio,
        nombreFarmacia,
      });
      setShowSeleccionarFarmacia(false);

      // Resetear mensaje después de 5 segundos
      setTimeout(() => setFarmaciaEnvioConfirmada(null), 5000);
    }
  };

  const puedeEnviarAFarmacia = (receta: Receta): boolean => {
    return (
      receta.estado === "activa" &&
      (!receta.estado_envio || receta.estado_envio === "no_enviada")
    );
  };

  const obtenerEstadoEnvio = (receta: Receta): string => {
    if (!receta.estado_envio || receta.estado_envio === "no_enviada") {
      return "No enviada";
    }
    const estados: Record<string, string> = {
      enviada: "📤 Enviada a farmacia",
      recibida: "✅ Recibida por farmacia",
      rechazada: "❌ Rechazada",
      dispensada: "🎉 Dispensada",
    };
    return estados[receta.estado_envio] || receta.estado_envio;
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de confirmación de envío */}
      {farmaciaEnvioConfirmada && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-green-800">Receta Enviada</h3>
            <p className="text-sm text-green-700">
              Tu receta fue enviada a <strong>{farmaciaEnvioConfirmada.nombreFarmacia}</strong>.
              Te notificaremos cuando esté lista.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Mis Recetas Médicas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Historial de todas tus recetas médicas. Selecciona una farmacia para
            surtir tu receta.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Médico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Envío
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicamentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recetas.map((receta) => (
                <tr key={receta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {receta.codigo_receta}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(receta.fecha_emision).toLocaleDateString(
                        "es-PE"
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Vence:{" "}
                      {new Date(receta.fecha_vencimiento).toLocaleDateString(
                        "es-PE"
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Dr. {receta.medico_nombre} {receta.medico_apellido}
                    </div>
                    <div className="text-xs text-gray-500">
                      {receta.especialidad}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={
                        receta.estado === "activa"
                          ? "bg-green-100 text-green-800"
                          : receta.estado === "dispensada"
                          ? "bg-blue-100 text-blue-800"
                          : receta.estado === "vencida"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {receta.estado}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-700">
                        {obtenerEstadoEnvio(receta)}
                      </span>
                      {receta.farmacia_dispensadora && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {receta.farmacia_dispensadora}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {receta.total_medicamentos} medicamento(s)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => verDetallesReceta(receta.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver
                    </button>

                    {puedeEnviarAFarmacia(receta) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirSeleccionFarmacia(receta.id)}
                        className="gap-1"
                      >
                        <SendHorizontal size={14} />
                        Enviar
                      </Button>
                    )}

                    {receta.pdf_path && (
                      <a
                        href={receta.pdf_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900 inline-block"
                      >
                        PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recetas.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay recetas registradas
              </h3>
              <p className="text-gray-500">
                Tus recetas médicas aparecerán aquí después de tus consultas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      {recetaSeleccionada && (
        <ModalDetallesReceta
          receta={recetaSeleccionada}
          isOpen={!!recetaSeleccionada}
          onClose={() => setRecetaSeleccionada(null)}
          onEnviar={(id: string) => {
            // Abrir modal de seleccionar farmacia cuando el usuario elija enviar desde la vista de detalles
            setRecetaActualEnvio(id);
            setShowSeleccionarFarmacia(true);
          }}
        />
      )}

      {/* Modal para seleccionar farmacia */}
      {recetaActualEnvio && (
        <ModalSeleccionarFarmacia
          isOpen={showSeleccionarFarmacia}
          recetaId={recetaActualEnvio}
          onClose={() => setShowSeleccionarFarmacia(false)}
          onFarmaciaSeleccionada={handleFarmaciaSeleccionada}
        />
      )}
    </div>
  );
}
