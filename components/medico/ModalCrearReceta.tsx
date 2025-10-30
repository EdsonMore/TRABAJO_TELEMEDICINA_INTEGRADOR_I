// components/medico/ModalCrearReceta.tsx - CON BÚSQUEDA CIE-10
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/auth-context";

interface ModalCrearRecetaProps {
  cita: any;
  isOpen: boolean;
  onClose: () => void;
  onRecetaCreada: () => void;
}

interface MedicamentoForm {
  medicamento_id: number;
  cantidad: number;
  dosis: string;
  frecuencia: string;
  duracion_dias?: number;
  via_administracion?: string;
  instrucciones_especiales?: string;
}

interface EnfermedadCIE10 {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  capitulo?: string;
}

interface MedicamentoCatalogo {
  id: number;
  codigo_digemid: string;
  nombre_comercial: string;
  nombre_generico: string;
  forma_farmaceutica?: string;
  concentracion?: string;
  laboratorio?: string;
  principio_activo?: string;
  categoria_terapeutica?: string;
  requiere_receta: boolean;
}

interface PacienteCompleto {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  edad: number;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  tipo_sangre?: string;
  alergias?: string[];
  enfermedades_cronicas?: string[];
}

export default function ModalCrearReceta({
  cita,
  isOpen,
  onClose,
  onRecetaCreada,
}: ModalCrearRecetaProps) {
  const { token } = useAuth();
  const [medicamentos, setMedicamentos] = useState<MedicamentoForm[]>([]);
  const [catalogoMedicamentos, setCatalogoMedicamentos] = useState<
    MedicamentoCatalogo[]
  >([]);
  const [enfermedadesCIE10, setEnfermedadesCIE10] = useState<EnfermedadCIE10[]>(
    []
  );
  const [enfermedadesFiltradas, setEnfermedadesFiltradas] = useState<
    EnfermedadCIE10[]
  >([]);
  const [tratamientosRecomendados, setTratamientosRecomendados] = useState<
    any[]
  >([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [datosPaciente, setDatosPaciente] = useState<PacienteCompleto | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState<{
    [key: number]: MedicamentoCatalogo | null;
  }>({});
  const [busquedaCIE10, setBusquedaCIE10] = useState("");
  const [mostrarDropdownCIE10, setMostrarDropdownCIE10] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<any>({
    defaultValues: {
      observaciones: "",
      diagnosticos_secundarios: [],
    },
  });

  // Watch para diagnóstico principal para filtrar tratamientos recomendados
  const diagnosticoPrincipalId = watch("diagnostico_principal_id");

  const obtenerToken = (): string => {
    if (!token) {
      setError(
        "No se encontró token de autenticación. Por favor, inicie sesión nuevamente."
      );
      return "";
    }
    return token;
  };

  useEffect(() => {
    if (isOpen && cita) {
      reset();
      setMedicamentos([]);
      setError(null);
      setMedicamentoSeleccionado({});
      setBusquedaCIE10("");
      setMostrarDropdownCIE10(false);
      setValue("id_cita", cita.id);
      cargarDatosIniciales();
    }
  }, [isOpen, cita, reset, setValue]);

  // Efecto para cargar tratamientos recomendados cuando cambia el diagnóstico
  useEffect(() => {
    if (diagnosticoPrincipalId) {
      cargarTratamientosRecomendados(diagnosticoPrincipalId);
    } else {
      setTratamientosRecomendados([]);
    }
  }, [diagnosticoPrincipalId]);

  // Efecto para filtrar enfermedades cuando cambia la búsqueda
  useEffect(() => {
    if (busquedaCIE10.trim() === "") {
      setEnfermedadesFiltradas(enfermedadesCIE10.slice(0, 10)); // Mostrar solo las primeras 10
    } else {
      const filtradas = enfermedadesCIE10.filter(
        (enf) =>
          enf.codigo.toLowerCase().includes(busquedaCIE10.toLowerCase()) ||
          enf.nombre.toLowerCase().includes(busquedaCIE10.toLowerCase()) ||
          (enf.categoria &&
            enf.categoria.toLowerCase().includes(busquedaCIE10.toLowerCase()))
      );
      setEnfermedadesFiltradas(filtradas.slice(0, 15)); // Limitar a 15 resultados
    }
  }, [busquedaCIE10, enfermedadesCIE10]);

  const cargarDatosIniciales = async () => {
    setCargandoCatalogos(true);
    setError(null);

    try {
      await Promise.all([
        cargarDatosPaciente(),
        cargarMedicamentos(),
        cargarEnfermedadesCIE10(),
      ]);
    } catch (error) {
      setError(
        "Error al cargar los datos necesarios. Por favor, recargue la página."
      );
    } finally {
      setCargandoCatalogos(false);
    }
  };

  const cargarDatosPaciente = async () => {
    try {
      if (!cita || !cita.paciente) return;

      const token = obtenerToken();
      if (!token) return;

      // Cargar datos completos del paciente desde la BD
      const response = await fetch(`/api/pacientes/${cita.paciente.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.paciente) {
          setDatosPaciente(data.paciente);
          return;
        }
      }

      // Fallback a datos básicos de la cita
      const pacienteInfo = cita.paciente;
      const pacienteData: PacienteCompleto = {
        id: cita.id_paciente || cita.paciente.id,
        nombre: pacienteInfo.nombre || "No disponible",
        apellido: pacienteInfo.apellido || "No disponible",
        dni: pacienteInfo.dni || "No disponible",
        edad: pacienteInfo.edad || 0,
        sexo: pacienteInfo.sexo || "",
        tipo_sangre: pacienteInfo.tipo_sangre || "",
        telefono: pacienteInfo.telefono || "",
        email: pacienteInfo.email || "",
        fecha_nacimiento: pacienteInfo.fecha_nacimiento || "",
        alergias: pacienteInfo.alergias || [],
        enfermedades_cronicas: pacienteInfo.enfermedades_cronicas || [],
      };

      setDatosPaciente(pacienteData);
    } catch (error) {
      console.error("Error cargando datos paciente:", error);
    }
  };

  const cargarMedicamentos = async () => {
    try {
      const token = obtenerToken();
      if (!token) return;

      const response = await fetch("/api/medicamentos?limit=1000", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.medicamentos && Array.isArray(data.medicamentos)) {
          setCatalogoMedicamentos(data.medicamentos);
        } else if (data && Array.isArray(data)) {
          setCatalogoMedicamentos(data);
        } else {
          setError("Formato de datos de medicamentos no reconocido");
        }
      } else {
        const errorText = await response.text();
        setError(
          `Error ${response.status} al cargar medicamentos: ${errorText}`
        );
      }
    } catch (error) {
      setError("Error de conexión al cargar medicamentos");
    }
  };

  const cargarEnfermedadesCIE10 = async () => {
    try {
      const token = obtenerToken();
      if (!token) return;

      const response = await fetch("/api/enfermedades?limit=1000", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.enfermedades && Array.isArray(data.enfermedades)) {
          setEnfermedadesCIE10(data.enfermedades);
          setEnfermedadesFiltradas(data.enfermedades.slice(0, 10));
        } else if (data && Array.isArray(data)) {
          setEnfermedadesCIE10(data);
          setEnfermedadesFiltradas(data.slice(0, 10));
        } else {
          setError("Formato de datos CIE-10 no reconocido");
        }
      } else {
        const errorText = await response.text();
        setError(
          `Error ${response.status} al cargar códigos CIE-10: ${errorText}`
        );
      }
    } catch (error) {
      setError("Error de conexión al cargar códigos CIE-10");
    }
  };

  const cargarTratamientosRecomendados = async (cie10Id: number) => {
    try {
      const token = obtenerToken();
      if (!token) return;

      const response = await fetch(
        `/api/tratamientos-recomendados?cie10_id=${cie10Id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTratamientosRecomendados(data.tratamientos || []);
      }
    } catch (error) {
      console.error("Error cargando tratamientos recomendados:", error);
    }
  };

  const seleccionarEnfermedad = (enfermedad: EnfermedadCIE10) => {
    setValue("diagnostico_principal_id", enfermedad.id);
    setBusquedaCIE10(`${enfermedad.codigo} - ${enfermedad.nombre}`);
    setMostrarDropdownCIE10(false);

    // También actualizar el texto del diagnóstico principal
    const textoActual = watch("diagnostico_principal_texto") || "";
    if (!textoActual.trim()) {
      setValue("diagnostico_principal_texto", enfermedad.nombre);
    }
  };

  const limpiarSeleccionCIE10 = () => {
    setValue("diagnostico_principal_id", "");
    setBusquedaCIE10("");
    setMostrarDropdownCIE10(false);
  };

  const agregarMedicamento = () => {
    if (medicamentos.length >= 15) {
      setError("Máximo 15 medicamentos por receta");
      return;
    }

    const nuevoMedicamento: MedicamentoForm = {
      medicamento_id: 0,
      cantidad: 1,
      dosis: "",
      frecuencia: "",
      duracion_dias: 7,
      via_administracion: "Oral",
      instrucciones_especiales: "",
    };
    setMedicamentos([...medicamentos, nuevoMedicamento]);
  };

  const agregarMedicamentoRecomendado = (tratamiento: any) => {
    if (medicamentos.length >= 15) {
      setError("Máximo 15 medicamentos por receta");
      return;
    }

    const medicamentoCatalogo = catalogoMedicamentos.find(
      (m) => m.id === tratamiento.medicamento_id
    );

    if (!medicamentoCatalogo) {
      setError("Medicamento recomendado no encontrado en catálogo");
      return;
    }

    const nuevoMedicamento: MedicamentoForm = {
      medicamento_id: tratamiento.medicamento_id,
      cantidad: 1,
      dosis:
        tratamiento.dosis_recomendada ||
        medicamentoCatalogo.concentracion ||
        "",
      frecuencia: "Según indicación médica",
      duracion_dias: tratamiento.duracion_tratamiento
        ? parseInt(tratamiento.duracion_tratamiento)
        : 7,
      via_administracion: obtenerViaAdministracion(
        medicamentoCatalogo.forma_farmaceutica
      ),
      instrucciones_especiales: tratamiento.observaciones || "",
    };

    setMedicamentos([...medicamentos, nuevoMedicamento]);

    // Actualizar selección
    const nuevoIndex = medicamentos.length;
    setMedicamentoSeleccionado((prev) => ({
      ...prev,
      [nuevoIndex]: medicamentoCatalogo,
    }));
  };

  const removerMedicamento = (index: number) => {
    const nuevosMedicamentos = medicamentos.filter((_, i) => i !== index);
    const nuevasSelecciones = { ...medicamentoSeleccionado };
    delete nuevasSelecciones[index];
    setMedicamentoSeleccionado(nuevasSelecciones);
    setMedicamentos(nuevosMedicamentos);
  };

  const actualizarMedicamento = (
    index: number,
    campo: keyof MedicamentoForm,
    valor: any
  ) => {
    const nuevosMedicamentos = [...medicamentos];
    nuevosMedicamentos[index] = {
      ...nuevosMedicamentos[index],
      [campo]: valor,
    };
    setMedicamentos(nuevosMedicamentos);
  };

  const seleccionarMedicamentoCatalogo = (
    index: number,
    medicamentoId: number
  ) => {
    const medicamento = catalogoMedicamentos.find(
      (m) => m.id === medicamentoId
    );
    if (medicamento) {
      setMedicamentoSeleccionado((prev) => ({ ...prev, [index]: medicamento }));
      actualizarMedicamento(index, "medicamento_id", medicamento.id);

      if (medicamento.concentracion && !medicamentos[index].dosis) {
        actualizarMedicamento(index, "dosis", medicamento.concentracion);
      }

      const via = obtenerViaAdministracion(medicamento.forma_farmaceutica);
      actualizarMedicamento(index, "via_administracion", via);
    }
  };

  const obtenerViaAdministracion = (formaFarmaceutica?: string): string => {
    const formas: { [key: string]: string } = {
      Tabletas: "Oral",
      Cápsulas: "Oral",
      Jarabe: "Oral",
      Suspensión: "Oral",
      Inyectable: "Intramuscular/Intravenosa",
      Crema: "Tópica",
      Pomada: "Tópica",
      Gel: "Tópica",
      Gotas: "Oftálmica/Ótica",
      Inhalador: "Inhalatoria",
      Supositorio: "Rectal",
      Óvulo: "Vaginal",
    };
    return formas[formaFarmaceutica || ""] || "Oral";
  };

  const validarFormulario = (): boolean => {
    if (medicamentos.length === 0) {
      setError("Debe agregar al menos un medicamento a la receta");
      return false;
    }

    for (let i = 0; i < medicamentos.length; i++) {
      const med = medicamentos[i];
      if (!med.medicamento_id || med.medicamento_id === 0) {
        setError(`El medicamento ${i + 1} no está seleccionado del catálogo`);
        return false;
      }
      if (!med.dosis.trim()) {
        setError(`El medicamento ${i + 1} no tiene dosis especificada`);
        return false;
      }
      if (!med.frecuencia.trim()) {
        setError(`El medicamento ${i + 1} no tiene frecuencia especificada`);
        return false;
      }
      if (!med.cantidad || med.cantidad < 1) {
        setError(`El medicamento ${i + 1} tiene cantidad inválida`);
        return false;
      }
    }

    if (!watch("diagnostico_principal_texto")?.trim()) {
      setError("El diagnóstico principal es requerido");
      return false;
    }

    setError(null);
    return true;
  };

  const onSubmit = async (data: any) => {
    if (!validarFormulario()) return;

    setCargando(true);
    setError(null);

    try {
      const token = obtenerToken();
      if (!token) throw new Error("No autenticado");

      const recetaData = {
        id_cita: data.id_cita,
        diagnostico_principal_id: data.diagnostico_principal_id || null,
        diagnostico_principal_texto: data.diagnostico_principal_texto,
        diagnosticos_secundarios: data.diagnosticos_secundarios || [],
        observaciones: data.observaciones || "",
        fecha_vencimiento:
          data.fecha_vencimiento ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        medicamentos: medicamentos,
      };

      const response = await fetch("/api/recetas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(recetaData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Error ${response.status}: ${result.message || "Error desconocido"}`
        );
      }

      if (result.success) {
        onRecetaCreada();
        handleClose();
      } else {
        throw new Error(result.error || "Error desconocido al crear receta");
      }
    } catch (error: any) {
      setError(error.message || "Error al crear receta en la base de datos");
    } finally {
      setCargando(false);
    }
  };

  const handleClose = () => {
    reset();
    setMedicamentos([]);
    setDatosPaciente(null);
    setError(null);
    setMedicamentoSeleccionado({});
    setTratamientosRecomendados([]);
    setBusquedaCIE10("");
    setMostrarDropdownCIE10(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Crear Receta Médica
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
              disabled={cargando}
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠</span>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <span className="mr-2">👤</span>
              Información del Paciente
            </h3>
            {datosPaciente ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="font-medium text-blue-900">
                      {datosPaciente.nombre} {datosPaciente.apellido}
                    </span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <span>DNI: {datosPaciente.dni}</span>
                      <span>Edad: {datosPaciente.edad} años</span>
                      {datosPaciente.sexo && (
                        <span>Sexo: {datosPaciente.sexo}</span>
                      )}
                      {datosPaciente.tipo_sangre && (
                        <span>Grupo: {datosPaciente.tipo_sangre}</span>
                      )}
                    </div>
                  </div>
                </div>
                {datosPaciente.alergias &&
                  datosPaciente.alergias.length > 0 && (
                    <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                      <strong>⚠ Alergias:</strong>{" "}
                      {datosPaciente.alergias.join(", ")}
                    </div>
                  )}
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  <strong>Cita:</strong>{" "}
                  {new Date(cita.fecha_cita).toLocaleDateString("es-PE")}
                  {cita.motivo_consulta && ` - ${cita.motivo_consulta}`}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Cargando datos del paciente desde BD...</span>
              </div>
            )}
          </div>

          {cargandoCatalogos && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-yellow-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span className="text-sm">
                  Cargando catálogos desde base de datos...
                </span>
              </div>
              <p className="text-xs text-yellow-600 mt-2">
                Medicamentos: {catalogoMedicamentos.length} cargados |
                Enfermedades: {enfermedadesCIE10.length} cargadas
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register("id_cita")} />
            <input type="hidden" {...register("diagnostico_principal_id")} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico Principal *
                </label>
                <textarea
                  {...register("diagnostico_principal_texto", {
                    required: true,
                  })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Describa el diagnóstico principal del paciente..."
                />
                {errors.diagnostico_principal_texto && (
                  <p className="text-red-500 text-sm mt-1">
                    El diagnóstico principal es requerido
                  </p>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código CIE-10 (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={busquedaCIE10}
                    onChange={(e) => {
                      setBusquedaCIE10(e.target.value);
                      setMostrarDropdownCIE10(true);
                    }}
                    onFocus={() => setMostrarDropdownCIE10(true)}
                    placeholder="Buscar por código o nombre..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-10"
                  />
                  {busquedaCIE10 && (
                    <button
                      type="button"
                      onClick={limpiarSeleccionCIE10}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {mostrarDropdownCIE10 && enfermedadesFiltradas.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {enfermedadesFiltradas.map((enf) => (
                      <button
                        key={enf.id}
                        type="button"
                        onClick={() => seleccionarEnfermedad(enf)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-800">
                          {enf.codigo} - {enf.nombre}
                        </div>
                        {enf.categoria && (
                          <div className="text-xs text-gray-500 mt-1">
                            {enf.categoria}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {mostrarDropdownCIE10 &&
                  enfermedadesFiltradas.length === 0 &&
                  busquedaCIE10 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div className="px-4 py-3 text-center text-gray-500">
                        No se encontraron resultados para "{busquedaCIE10}"
                      </div>
                    </div>
                  )}

                <p className="text-xs text-gray-500 mt-1">
                  {enfermedadesCIE10.length} códigos disponibles en BD
                  {busquedaCIE10 &&
                    ` - ${enfermedadesFiltradas.length} resultados`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  {...register("fecha_vencimiento")}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Por defecto: 30 días desde hoy
                </p>
              </div>
            </div>

            {/* Tratamientos Recomendados */}
            {tratamientosRecomendados.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  Tratamientos Recomendados para este Diagnóstico
                </h3>
                <div className="space-y-2">
                  {tratamientosRecomendados.map((tratamiento, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {
                            catalogoMedicamentos.find(
                              (m) => m.id === tratamiento.medicamento_id
                            )?.nombre_comercial
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {tratamiento.dosis_recomendada} •{" "}
                          {tratamiento.duracion_tratamiento}
                        </p>
                        {tratamiento.observaciones && (
                          <p className="text-xs text-gray-500 mt-1">
                            {tratamiento.observaciones}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          agregarMedicamentoRecomendado(tratamiento)
                        }
                        className="ml-4 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones Generales
              </label>
              <textarea
                {...register("observaciones")}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Indicaciones adicionales, recomendaciones, etc."
              />
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Medicamentos
                  </h3>
                  <p className="text-sm text-gray-600">
                    {medicamentos.length} medicamento(s) agregado(s) -{" "}
                    {catalogoMedicamentos.length} disponibles en BD
                  </p>
                </div>
                <button
                  type="button"
                  onClick={agregarMedicamento}
                  disabled={medicamentos.length >= 15 || cargandoCatalogos}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center"
                >
                  <span className="text-lg mr-1">+</span>
                  Agregar Medicamento
                </button>
              </div>

              {medicamentos.map((med, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-800">
                      Medicamento {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removerMedicamento(index)}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center transition-colors"
                      disabled={cargando}
                    >
                      <span>🗑️ Eliminar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seleccionar Medicamento *
                      </label>
                      <select
                        value={med.medicamento_id || ""}
                        onChange={(e) =>
                          seleccionarMedicamentoCatalogo(
                            index,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      >
                        <option value="">Seleccionar del catálogo...</option>
                        {catalogoMedicamentos.map((medicamento) => (
                          <option key={medicamento.id} value={medicamento.id}>
                            {medicamento.nombre_comercial} (
                            {medicamento.nombre_generico}) -{" "}
                            {medicamento.forma_farmaceutica}
                          </option>
                        ))}
                      </select>

                      {medicamentoSeleccionado[index] && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                            <div>
                              <strong>Laboratorio:</strong>{" "}
                              {medicamentoSeleccionado[index]?.laboratorio}
                            </div>
                            <div>
                              <strong>Principio Activo:</strong>{" "}
                              {medicamentoSeleccionado[index]?.principio_activo}
                            </div>
                            <div>
                              <strong>Concentración:</strong>{" "}
                              {medicamentoSeleccionado[index]?.concentracion}
                            </div>
                            <div>
                              <strong>Forma:</strong>{" "}
                              {
                                medicamentoSeleccionado[index]
                                  ?.forma_farmaceutica
                              }
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosis *
                      </label>
                      <input
                        type="text"
                        value={med.dosis}
                        onChange={(e) =>
                          actualizarMedicamento(index, "dosis", e.target.value)
                        }
                        placeholder="Ej: 500mg, 1 tableta"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frecuencia *
                      </label>
                      <input
                        type="text"
                        value={med.frecuencia}
                        onChange={(e) =>
                          actualizarMedicamento(
                            index,
                            "frecuencia",
                            e.target.value
                          )
                        }
                        placeholder="Ej: Cada 8 horas"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duración (días)
                      </label>
                      <input
                        type="number"
                        value={med.duracion_dias || ""}
                        onChange={(e) =>
                          actualizarMedicamento(
                            index,
                            "duracion_dias",
                            parseInt(e.target.value) || 7
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        min="1"
                        max="365"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        value={med.cantidad}
                        onChange={(e) =>
                          actualizarMedicamento(
                            index,
                            "cantidad",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        min="1"
                        max="999"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vía de Administración
                      </label>
                      <input
                        type="text"
                        value={med.via_administracion || ""}
                        onChange={(e) =>
                          actualizarMedicamento(
                            index,
                            "via_administracion",
                            e.target.value
                          )
                        }
                        placeholder="Ej: Oral, Tópica"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instrucciones Especiales
                      </label>
                      <textarea
                        value={med.instrucciones_especiales || ""}
                        onChange={(e) =>
                          actualizarMedicamento(
                            index,
                            "instrucciones_especiales",
                            e.target.value
                          )
                        }
                        placeholder="Ej: Tomar con alimentos, Evitar manejar, etc."
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {medicamentos.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <div className="text-gray-400 mb-2 text-4xl">💊</div>
                  <p className="text-gray-500 mb-1">
                    No hay medicamentos agregados
                  </p>
                  <p className="text-sm text-gray-400">
                    {catalogoMedicamentos.length > 0
                      ? `${catalogoMedicamentos.length} medicamentos disponibles en BD`
                      : "Cargando catálogo de medicamentos desde base de datos..."}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={cargando}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  medicamentos.length === 0 || cargando || cargandoCatalogos
                }
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {cargando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando Receta...
                  </>
                ) : (
                  "📄 Generar Receta"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
