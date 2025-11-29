// app/dashboard/farmacia/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  Package,
  BarChart3,
  AlertCircle,
  FileText,
  LogOut,
  Search,
  Plus,
  Warehouse,
  ClipboardList,
} from "lucide-react";

// Componentes modulares
import GestionInventario from "@/components/farmacia/gestion-inventario";
import AlertasSistema from "@/components/farmacia/alertas-sistema";
import ReportesFarmacia from "@/components/farmacia/reportes-farmacia";
import RecetasRecibidas from "@/components/farmacia/recetas-recibidas";
import DespachoRecetas from "@/components/farmacia/despacho-recetas";

interface DashboardStats {
  recetas: {
    pendientes: number;
    enProceso: number;
    dispensadasHoy: number;
  };
  inventario: {
    totalItems: number;
    stockBajo: number;
    agotados: number;
  };
  ventas: {
    totalHoy: number;
    recetasHoy: number;
  };
  alertas: {
    activas: number;
    porVencer: number;
  };
}

export default function DashboardFarmacia() {
  const { usuario, logout, token } = useAuth();
  const searchParams = useSearchParams();
  const [moduloActivo, setModuloActivo] = useState<string>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detectar si viene de RecetasRecibidas con una receta específica
    if (typeof window !== "undefined") {
      const recetaParam = searchParams?.get("receta");
      if (recetaParam) {
        // Ir directamente al despacho con la receta especificada
        setModuloActivo("despacho");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    cargarDashboardStats();
  }, [token]);

  const cargarDashboardStats = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch("/api/farmacia/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        setStats({
          recetas: { pendientes: 0, enProceso: 0, dispensadasHoy: 0 },
          inventario: { totalItems: 0, stockBajo: 0, agotados: 0 },
          ventas: { totalHoy: 0, recetasHoy: 0 },
          alertas: { activas: 0, porVencer: 0 },
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setStats({
        recetas: { pendientes: 0, enProceso: 0, dispensadasHoy: 0 },
        inventario: { totalItems: 0, stockBajo: 0, agotados: 0 },
        ventas: { totalHoy: 0, recetasHoy: 0 },
        alertas: { activas: 0, porVencer: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/auth/login";
  };

  // Renderizar módulos específicos
  if (moduloActivo === "recetas-recibidas") return <RecetasRecibidas />;
  if (moduloActivo === "despacho") {
    const recetaParam = searchParams?.get("receta");
    return (
      <DespachoRecetas
        recetaPreseleccionada={recetaParam}
        onVolver={() => setModuloActivo("dashboard")}
      />
    );
  }
  if (moduloActivo === "inventario")
    return <GestionInventario onVolver={() => setModuloActivo("dashboard")} />;
  if (moduloActivo === "alertas")
    return <AlertasSistema onVolver={() => setModuloActivo("dashboard")} />;
  if (moduloActivo === "reportes")
    return <ReportesFarmacia onVolver={() => setModuloActivo("dashboard")} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Hola, {usuario?.nombre}
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Panel de gestión farmacéutica
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header del Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Dashboard Farmacia
              </h1>
              <p className="text-gray-600 mt-1">
                Resumen general y acceso rápido
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button
                size="sm"
                onClick={() => setModuloActivo("recetas-recibidas")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Receta
              </Button>
            </div>
          </div>

          {loading ? (
            // Skeleton loader
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Estadísticas Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        Recetas Pendientes
                      </CardTitle>
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="text-xl font-bold text-blue-600">
                      {stats?.recetas.pendientes || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats?.recetas.enProceso || 0} en proceso
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 sm:border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        Estado Inventario
                      </CardTitle>
                      <Package className="h-4 w-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="text-xl font-bold text-gray-900">
                      {stats?.inventario.totalItems || 0}
                    </div>
                    <div className="flex space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-yellow-50">
                        {stats?.inventario.stockBajo || 0} bajo
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-red-50">
                        {stats?.inventario.agotados || 0} agotado
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 sm:border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        Ventas Hoy
                      </CardTitle>
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="text-xl font-bold text-purple-600">
                      S/ {(stats?.ventas.totalHoy || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats?.ventas.recetasHoy || 0} recetas
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 sm:border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        Alertas Activas
                      </CardTitle>
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="text-xl font-bold text-orange-600">
                      {stats?.alertas.activas || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats?.alertas.porVencer || 0} por vencer
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Módulos Principales - Grid Responsivo Mejorado */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Recetas Recibidas */}
                <Card
                  className="cursor-pointer transition-all hover:shadow-lg border border-gray-200 rounded-lg shadow-sm"
                  onClick={() => setModuloActivo("recetas-recibidas")}
                >
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ClipboardList className="w-5 h-5 text-purple-600" />
                      Recetas Recibidas
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Gestionar recetas enviadas por pacientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 h-10">
                      Ver Recetas Recibidas
                    </Button>
                  </CardContent>
                </Card>

                {/* Despacho de Recetas */}
                <Card
                  className="cursor-pointer transition-all hover:shadow-lg border border-gray-200 rounded-lg shadow-sm"
                  onClick={() => setModuloActivo("despacho")}
                >
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="w-5 h-5 text-green-600" />
                      Despacho de Recetas
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Procesar y despachar recetas a pacientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <Button className="w-full bg-green-600 hover:bg-green-700 h-10">
                      Ir a Despacho
                    </Button>
                  </CardContent>
                </Card>

                {/* Gestión de Inventario - NUEVA TARJETA */}
                <Card
                  className="cursor-pointer transition-all hover:shadow-lg border border-gray-200 rounded-lg shadow-sm"
                  onClick={() => setModuloActivo("inventario")}
                >
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Warehouse className="w-5 h-5 text-blue-600" />
                      Gestión de Inventario
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Administrar stock y medicamentos disponibles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total items:</span>
                        <span className="font-semibold">
                          {stats?.inventario.totalItems || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Stock bajo:</span>
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-xs"
                        >
                          {stats?.inventario.stockBajo || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Agotados:</span>
                        <Badge variant="outline" className="bg-red-50 text-xs">
                          {stats?.inventario.agotados || 0}
                        </Badge>
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 h-10 mt-2">
                        Gestionar Inventario
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Módulos Secundarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Reportes y Análisis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Recetas hoy:</span>
                        <span className="font-semibold">
                          {stats?.ventas.recetasHoy || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ingresos:</span>
                        <span className="font-semibold">
                          S/ {(stats?.ventas.totalHoy || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recetas pendientes:</span>
                        <span className="font-semibold">
                          {stats?.recetas.pendientes || 0}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4 h-10"
                      onClick={() => setModuloActivo("reportes")}
                    >
                      Ver Reportes Detallados
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Sistema de Alertas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Alertas activas:</span>
                        <span className="font-semibold">
                          {stats?.alertas.activas || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Por vencer:</span>
                        <span className="font-semibold">
                          {stats?.alertas.porVencer || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stock bajo:</span>
                        <span className="font-semibold">
                          {stats?.inventario.stockBajo || 0}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4 h-10"
                      onClick={() => setModuloActivo("alertas")}
                    >
                      Ver Alertas Completas
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Acciones Rápidas para Móviles */}
              <div className="lg:hidden">
                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-base">
                      Acciones Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-14 flex flex-col bg-white hover:bg-gray-50 border-2"
                        onClick={() => setModuloActivo("recetas-recibidas")}
                      >
                        <ClipboardList className="w-5 h-5 mb-1 text-purple-600" />
                        <span className="text-xs">Recetas</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-14 flex flex-col bg-white hover:bg-gray-50 border-2"
                        onClick={() => setModuloActivo("despacho")}
                      >
                        <Package className="w-5 h-5 mb-1 text-green-600" />
                        <span className="text-xs">Despacho</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-14 flex flex-col bg-white hover:bg-gray-50 border-2"
                        onClick={() => setModuloActivo("inventario")}
                      >
                        <Warehouse className="w-5 h-5 mb-1 text-blue-600" />
                        <span className="text-xs">Inventario</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-14 flex flex-col bg-white hover:bg-gray-50 border-2"
                        onClick={() => setModuloActivo("reportes")}
                      >
                        <BarChart3 className="w-5 h-5 mb-1 text-purple-600" />
                        <span className="text-xs">Reportes</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
