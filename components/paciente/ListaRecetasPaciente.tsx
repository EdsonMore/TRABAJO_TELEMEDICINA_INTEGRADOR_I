// components/paciente/ListaRecetasPaciente.tsx
import { useState, useEffect } from "react";

export default function ListaRecetasPaciente() {
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);

  useEffect(() => {
    cargarRecetas();
  }, []);

  const cargarRecetas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/recetas/paciente", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setRecetas(data.recetas);
      }
    } catch (error) {
      console.error("Error cargando recetas:", error);
    } finally {
      setCargando(false);
    }
  };

  const verDetallesReceta = async (recetaId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/recetas/${recetaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setRecetaSeleccionada(data.receta);
      }
    } catch (error) {
      console.error("Error cargando detalles:", error);
    }
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
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Mis Recetas Médicas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Historial de todas tus recetas médicas
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
                  Medicamentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recetas.map((receta: any) => (
                <tr key={receta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {receta.codigo_receta}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(receta.fecha_emision).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Vence:{" "}
                      {new Date(receta.fecha_vencimiento).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Dr. {receta.medico_nombre}
                    </div>
                    <div className="text-xs text-gray-500">
                      {receta.especialidad}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
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
                      {receta.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {receta.total_medicamentos} medicamento(s)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => verDetallesReceta(receta.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Ver detalles
                    </button>
                    {receta.pdf_path && (
                      <a
                        href={receta.pdf_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900"
                      >
                        Descargar PDF
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
        />
      )}
    </div>
  );
}
