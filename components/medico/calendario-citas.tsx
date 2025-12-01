/**
 * components/medico/calendario-citas.tsx
 * Componente de calendario interactivo para gestión de citas del médico
 * Rediseñado con estilo limpio tipo Plan Banco - Optimizado para adultos mayores
 */

"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Search,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Video,
  MapPin,
  Home,
  Users,
  MoreVertical,
  Stethoscope, // Icono añadido para gestión médica
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEtiquetaCita, getAccionesCita } from "@/lib/cita-utils";
import GestionCitaMedicoModal from "./gestion-cita-medico-modal"; // Importar el modal

interface Cita {
  id: string;
  fecha_cita: string;
  hora_cita: string;
  tipo_cita: "virtual" | "presencial" | "domicilio";
  estado: "confirmada" | "programada" | "completada" | "cancelada" | "iniciada";
  motivo_consulta?: string;
  paciente?: {
    id?: string;
    nombre?: string;
    apellido?: string;
    edad?: number;
    telefono?: string;
  };
}

interface CalendarioCitasProps {
  citas: Cita[];
  onVerDetalles?: (cita: Cita) => void;
  onCrearReceta?: (cita: Cita) => void;
  onUnirseVideollamada?: (cita: Cita) => void;
  onActualizar?: () => void;
}

export function CalendarioCitas({
  citas,
  onVerDetalles,
  onCrearReceta,
  onUnirseVideollamada,
  onActualizar,
}: CalendarioCitasProps) {
  const [mesActual, setMesActual] = useState(new Date());
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [actualizando, setActualizando] = useState(false);

  console.log(`[CALENDARIO CITAS] Recibidas ${citas.length} citas`);
  console.log(`[CALENDARIO CITAS] Mes actual: ${format(mesActual, "yyyy-MM")}`);
  if (citas.length > 0) {
    console.log(`[CALENDARIO CITAS] Primera cita:`, {
      id: citas[0].id,
      fecha: citas[0].fecha_cita,
      estado: citas[0].estado,
      paciente: citas[0].paciente?.nombre
    });
  }

  // Función para convertir string de fecha YYYY-MM-DD a Date sin problemas de timezone
  const parsearFechaLocal = (fechaStr: string): Date => {
    // Si es un string formato YYYY-MM-DD, parsear como fecha local
    if (typeof fechaStr === 'string' && fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = fechaStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Sino, intentar como ISO string normal
    return new Date(fechaStr);
  };

  // Estados para el modal de gestión
  const [modalGestionAbierto, setModalGestionAbierto] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  // Función para actualizar agenda
  const manejarActualizar = async () => {
    setActualizando(true);
    try {
      if (onActualizar) {
        await onActualizar();
      }
    } finally {
      setActualizando(false);
    }
  };

  // Obtener días del mes
  const primerDia = startOfMonth(mesActual);
  const ultimoDia = endOfMonth(mesActual);
  const diasDelMes = eachDayOfInterval({ start: primerDia, end: ultimoDia });

  // Filtrar citas según los criterios
  const citasFiltradas = useMemo(() => {
    console.log(`[DEBUG CALENDARIO] Filtrando ${citas.length} citas para mes ${format(mesActual, "yyyy-MM")}`);
    
    const filtradas = citas.filter((cita) => {
      const fechaCita = parsearFechaLocal(cita.fecha_cita);
      const citaEnMes = isSameMonth(fechaCita, mesActual);
      const coincideEstado =
        filtroEstado === "todas" || cita.estado === filtroEstado;
      const coincideTipo =
        filtroTipo === "todos" || cita.tipo_cita === filtroTipo;
      const coincideBusqueda =
        busqueda === "" ||
        cita.paciente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        cita.paciente?.apellido
          ?.toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        cita.motivo_consulta?.toLowerCase().includes(busqueda.toLowerCase());

      if (!citaEnMes) {
        console.log(`[DEBUG CITA] ID ${cita.id}: Fecha ${format(fechaCita, "yyyy-MM-dd")} NO en mes ${format(mesActual, "yyyy-MM")}`);
      }

      return citaEnMes && coincideEstado && coincideTipo && coincideBusqueda;
    });
    
    console.log(`[DEBUG CALENDARIO] Citas filtradas: ${filtradas.length}`);
    return filtradas;
  }, [citas, mesActual, filtroEstado, filtroTipo, busqueda]);

  // Obtener citas para un día específico
  const obtenerCitasDelDia = (dia: Date) => {
    const citasDelDia = citasFiltradas.filter((cita) =>
      isSameDay(parsearFechaLocal(cita.fecha_cita), dia)
    );

    // Eliminar duplicados por ID + Hora para este día específico
    const clavesUnicas = new Set();
    return citasDelDia.filter((cita) => {
      const clave = `${cita.id}-${cita.hora_cita}`;
      if (clavesUnicas.has(clave)) {
        console.warn(`⚠️ Duplicado en día ${format(dia, "yyyy-MM-dd")}:`, cita);
        return false;
      }
      clavesUnicas.add(clave);
      return true;
    });
  };

  const convertirFechaAPeru = (fecha: string): Date => {
    // Ya viene convertida del backend, solo crear Date object
    return parsearFechaLocal(fecha);
  };

  // Obtener estadísticas
  const estadisticas = useMemo(() => {
    return {
      total: citasFiltradas.length,
      confirmadas: citasFiltradas.filter((c) => c.estado === "confirmada")
        .length,
      programadas: citasFiltradas.filter((c) => c.estado === "programada")
        .length,
      completadas: citasFiltradas.filter((c) => c.estado === "completada")
        .length,
      canceladas: citasFiltradas.filter((c) => c.estado === "cancelada").length,
    };
  }, [citasFiltradas]);

  // Obtener citas próximas (hoy y próximos días)
  const citasProximas = useMemo(() => {
    // Eliminar duplicados por ID usando Set
    const idsUnicos = new Set();
    const citasSinDuplicados = citasFiltradas.filter((cita) => {
      if (idsUnicos.has(cita.id)) {
        console.warn(`⚠️ Cita duplicada encontrada: ${cita.id}`);
        return false;
      }
      idsUnicos.add(cita.id);
      return true;
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return citasSinDuplicados
      .filter((c) => {
        const fechaCita = parsearFechaLocal(c.fecha_cita);
        // Mostrar solo citas de hoy en adelante que estén confirmadas o programadas
        return (
          fechaCita >= hoy &&
          (c.estado === "confirmada" || c.estado === "programada")
        );
      })
      .sort(
        (a, b) =>
          parsearFechaLocal(a.fecha_cita).getTime() -
          parsearFechaLocal(b.fecha_cita).getTime()
      )
      .slice(0, 6);
  }, [citasFiltradas]);

  // Obtener color de estado
  const getColorEstado = (estado: string) => {
    switch (estado) {
      case "confirmada":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "programada":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "iniciada":
        return "bg-green-100 text-green-800 border-green-200";
      case "completada":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelada":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Obtener icono del tipo de cita
  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case "virtual":
        return <Video className="w-4 h-4 text-blue-600" />;
      case "presencial":
        return <MapPin className="w-4 h-4 text-green-600" />;
      case "domicilio":
        return <Home className="w-4 h-4 text-purple-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  // Obtener color del tipo de cita para el calendario
  const getColorTipoCita = (tipo: string) => {
    switch (tipo) {
      case "virtual":
        return "bg-blue-500 hover:bg-blue-600";
      case "presencial":
        return "bg-green-500 hover:bg-green-600";
      case "domicilio":
        return "bg-purple-500 hover:bg-purple-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Función para abrir el modal de gestión
  const abrirModalGestion = (cita: Cita) => {
    setCitaSeleccionada(cita);
    setModalGestionAbierto(true);
  };

  // Función para cerrar el modal
  const cerrarModalGestion = () => {
    setModalGestionAbierto(false);
    setCitaSeleccionada(null);
  };

  // Función para manejar actualización de cita
  const manejarCitaActualizada = () => {
    // Aquí puedes recargar las citas o actualizar el estado
    console.log("Cita actualizada, recargando datos...");
    // Podrías llamar a una función prop para recargar las citas
  };

  return (
    <div className="space-y-6 p-2 sm:p-4">
      {/* Header Principal */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
                Calendario de Citas
              </h1>
              <p className="text-blue-100 text-base sm:text-lg">
                {format(mesActual, "MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setMesActual(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1)
                  )
                }
                className="h-9 w-9 sm:h-10 sm:w-10 bg-white/10 border-white/20 text-white hover:bg-white/20 flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setMesActual(new Date())}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-3 sm:px-4 text-xs sm:text-base"
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setMesActual(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1)
                  )
                }
                className="h-9 w-9 sm:h-10 sm:w-10 bg-white/10 border-white/20 text-white hover:bg-white/20 flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={manejarActualizar}
                disabled={actualizando}
                className="h-9 w-9 sm:h-10 sm:w-10 bg-white/10 border-white/20 text-white hover:bg-white/20 flex-shrink-0"
                title="Actualizar citas"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${actualizando ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Panel Lateral - Filtros y Estadísticas (Colapsible en móvil) */}
        <div className="xl:col-span-1 space-y-4 xl:space-y-6 order-2 xl:order-1">
          {/* Buscador */}
          <Card className="shadow-sm border border-gray-200 rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Buscar Citas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Paciente o motivo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10 rounded-lg border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Estado de la cita
                  </label>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger className="w-full rounded-lg border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todos los estados</SelectItem>
                      <SelectItem value="programada">Programada</SelectItem>
                      <SelectItem value="confirmada">Confirmada</SelectItem>
                      <SelectItem value="iniciada">Iniciada</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tipo de cita
                  </label>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="w-full rounded-lg border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="domicilio">Domicilio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <Card className="shadow-sm border border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Resumen del Mes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-blue-50 rounded-xl p-2 sm:p-4 text-center border border-blue-100">
                  <div className="text-xl sm:text-2xl font-bold text-blue-700">
                    {estadisticas.total}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-600 font-medium">Total</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-2 sm:p-4 text-center border border-amber-100">
                  <div className="text-xl sm:text-2xl font-bold text-amber-700">
                    {estadisticas.programadas}
                  </div>
                  <div className="text-xs sm:text-sm text-amber-600 font-medium">
                    Programadas
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-2 sm:p-4 text-center border border-green-100">
                  <div className="text-xl sm:text-2xl font-bold text-green-700">
                    {estadisticas.completadas}
                  </div>
                  <div className="text-xs sm:text-sm text-green-600 font-medium">
                    Completadas
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-2 sm:p-4 text-center border border-red-100">
                  <div className="text-xl sm:text-2xl font-bold text-red-700">
                    {estadisticas.canceladas}
                  </div>
                  <div className="text-xs sm:text-sm text-red-600 font-medium">
                    Canceladas
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leyenda */}
          <Card className="shadow-sm border border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Cita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50">
                <Video className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-700">
                  Consulta Virtual
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-700">Presencial</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50">
                <Home className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-700">
                  Visita a Domicilio
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido Principal - Calendario y Próximas Citas */}
        <div className="xl:col-span-3 space-y-6">
          {/* Calendario */}
          <Card className="shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
            <CardContent className="p-3 sm:p-6">
              {/* Encabezado días de semana */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-3 sm:mb-6 bg-gray-50 rounded-xl p-1 sm:p-2">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
                  (dia) => (
                    <div
                      key={dia}
                      className="text-center font-semibold text-xs sm:text-sm text-gray-600 py-2 sm:py-3"
                    >
                      {dia}
                    </div>
                  )
                )}
              </div>

              {/* Grid de días */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {diasDelMes.map((dia) => {
                  const citasDelDia = obtenerCitasDelDia(dia);
                  const esHoy = isToday(dia);
                  const esDelMes = isSameMonth(dia, mesActual);

                  return (
                    <div
                      key={dia.toISOString()}
                      className={`min-h-20 sm:min-h-28 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 transition-all text-xs sm:text-base ${
                        esHoy
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : esDelMes
                          ? "border-gray-200 bg-white hover:border-gray-300"
                          : "border-gray-100 bg-gray-50"
                      } ${citasDelDia.length > 0 ? "cursor-pointer" : ""}`}
                    >
                      <div
                        className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${
                          esHoy
                            ? "text-blue-700"
                            : esDelMes
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {format(dia, "d")}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        {citasDelDia.slice(0, 2).map((cita, idx) => (
                          <div
                            key={`${cita.id}-${idx}`}
                            className={`text-xs p-1 sm:p-1.5 rounded-lg text-white font-medium truncate shadow-sm hidden sm:block ${getColorTipoCita(
                              cita.tipo_cita
                            )}`}
                            title={`${cita.hora_cita} - ${
                              cita.paciente?.nombre || "Sin nombre"
                            } - ${cita.motivo_consulta || "Sin motivo"}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">
                                {cita.hora_cita?.slice(0, 5)}
                              </span>
                              {getIconoTipo(cita.tipo_cita)}
                            </div>
                            <div className="truncate text-xs opacity-90 mt-0.5">
                              {cita.paciente?.nombre?.split(" ")[0] ||
                                "Paciente"}
                            </div>
                          </div>
                        ))}
                        {/* Indicador de citas en móvil */}
                        {citasDelDia.length > 0 && (
                          <div className="sm:hidden">
                            <div className="flex gap-0.5">
                              {citasDelDia.slice(0, 3).map((cita, idx) => (
                                <div
                                  key={idx}
                                  className={`w-1.5 h-1.5 rounded-full ${getColorTipoCita(cita.tipo_cita)}`}
                                  title={`${cita.hora_cita} - ${cita.paciente?.nombre || "Paciente"}`}
                                ></div>
                              ))}
                              {citasDelDia.length > 3 && (
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        )}
                        {citasDelDia.length > 2 && (
                          <div className="text-xs text-blue-600 font-semibold px-1 text-center hidden sm:block">
                            +{citasDelDia.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Próximas Citas */}
          <Card className="shadow-sm border border-gray-200 rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                Próximas Citas
                <Badge
                  variant="secondary"
                  className="ml-2 bg-blue-100 text-blue-700"
                >
                  {citasProximas.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Citas confirmadas y programadas para hoy y los próximos días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {citasProximas.map((cita) => (
                  <div
                    key={cita.id}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {cita.hora_cita?.slice(0, 5)}
                          </div>
                          <Badge className={getColorEstado(cita.estado)}>
                            {cita.estado}
                          </Badge>
                          {getIconoTipo(cita.tipo_cita)}
                        </div>

                        <h4 className="font-semibold text-gray-900 text-lg mb-1">
                          {cita.paciente?.nombre || "Paciente"}{" "}
                          {cita.paciente?.apellido || ""}
                          {cita.paciente?.edad && (
                            <span className="text-gray-600 text-sm ml-2">
                              ({cita.paciente.edad} años)
                            </span>
                          )}
                        </h4>

                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {cita.motivo_consulta || "Consulta médica"}
                        </p>

                        <p className="text-gray-500 text-sm">
                          {format(
                            convertirFechaAPeru(cita.fecha_cita),
                            "EEEE, d 'de' MMMM",
                            { locale: es }
                          )}
                        </p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {/* Botón para gestión médica - Siempre visible */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirModalGestion(cita)}
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        >
                          <Stethoscope className="w-4 h-4 mr-1" />
                          Gestionar
                        </Button>

                        {getAccionesCita(cita).videollamada && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => onUnirseVideollamada?.(cita)}
                          >
                            <Video className="w-4 h-4 mr-1" />
                            Unirse
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onVerDetalles?.(cita)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {citasProximas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium text-gray-600">
                      No hay citas próximas
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      No hay citas confirmadas o programadas para los próximos
                      días
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Gestión de Citas */}
      <GestionCitaMedicoModal
        isOpen={modalGestionAbierto}
        onClose={cerrarModalGestion}
        cita={citaSeleccionada}
        onCitaActualizada={manejarCitaActualizada}
      />
    </div>
  );
}
