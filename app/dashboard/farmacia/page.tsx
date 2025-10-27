"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Pill, Package, Clock, CheckCircle, Search, Phone, User, FileText } from "lucide-react"

interface Receta {
  id: number
  fecha_emision: string
  medicamentos: any
  instrucciones: string
  estado: string
  nombre_paciente: string
  dni_paciente: string
  telefono_paciente: string
  nombre_medico: string
  especialidad: string
  cmp: string
}

export default function DashboardFarmacia() {
  const { usuario } = useAuth()
  const [recetasPendientes, setRecetasPendientes] = useState<Receta[]>([])
  const [filtroRecetas, setFiltroRecetas] = useState("")
  const [cargando, setCargando] = useState(true)
  const [procesandoReceta, setProcesandoReceta] = useState<number | null>(null)

  // Cargar recetas pendientes al montar el componente
  useEffect(() => {
    cargarRecetasPendientes()
  }, [])

  const cargarRecetasPendientes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/farmacia/recetas-pendientes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRecetasPendientes(data.recetas || [])
      }
    } catch (error) {
      console.error("Error al cargar recetas:", error)
    } finally {
      setCargando(false)
    }
  }

  const procesarReceta = async (recetaId: number, nuevoEstado: string, observaciones = "") => {
    try {
      setProcesandoReceta(recetaId)
      const token = localStorage.getItem("token")

      const response = await fetch("/api/farmacia/recetas-pendientes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recetaId,
          nuevoEstado,
          observaciones,
        }),
      })

      if (response.ok) {
        // Recargar lista de recetas
        await cargarRecetasPendientes()
      }
    } catch (error) {
      console.error("Error al procesar receta:", error)
    } finally {
      setProcesandoReceta(null)
    }
  }

  // Filtrar recetas según búsqueda
  const recetasFiltradas = recetasPendientes.filter(
    (receta) =>
      receta.nombre_paciente.toLowerCase().includes(filtroRecetas.toLowerCase()) ||
      receta.dni_paciente.includes(filtroRecetas) ||
      receta.nombre_medico.toLowerCase().includes(filtroRecetas.toLowerCase()),
  )

  // Estadísticas rápidas
  const estadisticas = {
    pendientes: recetasPendientes.filter((r) => r.estado === "pendiente").length,
    enProceso: recetasPendientes.filter((r) => r.estado === "en_proceso").length,
    totalHoy: recetasPendientes.filter((r) => {
      const hoy = new Date().toISOString().split("T")[0]
      return r.fecha_emision.startsWith(hoy)
    }).length,
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-medical-text-secondary">Cargando dashboard de farmacia...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-medical-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-medical-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-medical-text-primary mb-2">Dashboard de Farmacia</h1>
              <p className="text-medical-text-secondary">
                Bienvenido, {usuario?.nombres} - Gestiona recetas y medicamentos
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-medical-text-secondary">Fecha actual</p>
                <p className="font-semibold text-medical-text-primary">
                  {new Date().toLocaleDateString("es-PE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Pill className="h-12 w-12 text-medical-primary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-medical-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-text-secondary">Recetas Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-medical-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text-primary">{estadisticas.pendientes}</div>
              <p className="text-xs text-medical-text-secondary">Esperando despacho</p>
            </CardContent>
          </Card>

          <Card className="border-medical-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-text-secondary">En Proceso</CardTitle>
              <Package className="h-4 w-4 text-medical-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text-primary">{estadisticas.enProceso}</div>
              <p className="text-xs text-medical-text-secondary">Siendo preparadas</p>
            </CardContent>
          </Card>

          <Card className="border-medical-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-text-secondary">Recetas Hoy</CardTitle>
              <CheckCircle className="h-4 w-4 text-medical-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text-primary">{estadisticas.totalHoy}</div>
              <p className="text-xs text-medical-text-secondary">Recibidas hoy</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recetas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recetas">Recetas Pendientes</TabsTrigger>
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="recetas" className="space-y-6">
            <Card className="border-medical-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Buscar Recetas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Buscar por nombre del paciente, DNI o médico..."
                  value={filtroRecetas}
                  onChange={(e) => setFiltroRecetas(e.target.value)}
                  className="max-w-md"
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {recetasFiltradas.length === 0 ? (
                <Card className="border-medical-border">
                  <CardContent className="text-center py-8">
                    <Pill className="h-12 w-12 text-medical-text-secondary mx-auto mb-4" />
                    <p className="text-medical-text-secondary">
                      {filtroRecetas ? "No se encontraron recetas con ese criterio" : "No hay recetas pendientes"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                recetasFiltradas.map((receta) => (
                  <Card key={receta.id} className="border-medical-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-medical-primary/10 p-2 rounded-lg">
                            <FileText className="h-5 w-5 text-medical-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Receta #{receta.id}</CardTitle>
                            <CardDescription>
                              Emitida el {new Date(receta.fecha_emision).toLocaleDateString("es-PE")}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={receta.estado === "pendiente" ? "destructive" : "default"}
                          className="capitalize"
                        >
                          {receta.estado.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-medical-text-primary flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Información del Paciente
                          </h4>
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="font-medium">Nombre:</span> {receta.nombre_paciente}
                            </p>
                            <p>
                              <span className="font-medium">DNI:</span> {receta.dni_paciente}
                            </p>
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {receta.telefono_paciente}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold text-medical-text-primary flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Médico Prescriptor
                          </h4>
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="font-medium">Dr(a):</span> {receta.nombre_medico}
                            </p>
                            <p>
                              <span className="font-medium">Especialidad:</span> {receta.especialidad}
                            </p>
                            <p>
                              <span className="font-medium">CMP:</span> {receta.cmp}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-medical-text-primary flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          Medicamentos Prescritos
                        </h4>
                        <div className="bg-medical-background p-3 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap">
                            {typeof receta.medicamentos === "string"
                              ? receta.medicamentos
                              : JSON.stringify(receta.medicamentos, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {receta.instrucciones && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-medical-text-primary">Instrucciones Especiales</h4>
                          <p className="text-sm bg-medical-background p-3 rounded-lg">{receta.instrucciones}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t border-medical-border">
                        <Button
                          onClick={() => procesarReceta(receta.id, "en_proceso")}
                          disabled={procesandoReceta === receta.id}
                          className="bg-medical-primary hover:bg-medical-primary/90"
                        >
                          {procesandoReceta === receta.id ? "Procesando..." : "Iniciar Preparación"}
                        </Button>
                        <Button
                          onClick={() => procesarReceta(receta.id, "completado")}
                          disabled={procesandoReceta === receta.id}
                          variant="outline"
                          className="border-medical-success text-medical-success hover:bg-medical-success/10"
                        >
                          Marcar como Despachado
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="inventario">
            <Card className="border-medical-border">
              <CardHeader>
                <CardTitle>Gestión de Inventario</CardTitle>
                <CardDescription>Control de stock de medicamentos y productos farmacéuticos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-medical-text-secondary mx-auto mb-4" />
                  <p className="text-medical-text-secondary">Módulo de inventario en desarrollo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reportes">
            <Card className="border-medical-border">
              <CardHeader>
                <CardTitle>Reportes y Estadísticas</CardTitle>
                <CardDescription>Análisis de ventas, despachos y rendimiento de la farmacia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-medical-text-secondary mx-auto mb-4" />
                  <p className="text-medical-text-secondary">Módulo de reportes en desarrollo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
