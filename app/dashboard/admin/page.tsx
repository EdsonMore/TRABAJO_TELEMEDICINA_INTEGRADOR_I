// MediLink+ - Dashboard de Administrador
// Panel de control para gestionar médicos, farmacias y laboratorios

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  UserPlus,
  Stethoscope,
  Building2,
  FlaskConical,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Users,
  Activity,
  Database,
  BarChart3,
} from "lucide-react"

interface Usuario {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  rol: string
  estado: string
  fechaRegistro: string
  especialidad?: string
  numeroLicencia?: string
  nombreEstablecimiento?: string
  direccion?: string
}

interface EstadisticasGenerales {
  total_usuarios: number
  total_pacientes: number
  total_citas: number
  citas_completadas: number
  citas_pendientes: number
  ingresos_totales: number
}

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null)
  const [filtroRol, setFiltroRol] = useState<string>("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [showRegistroModal, setShowRegistroModal] = useState(false)
  const [tipoRegistro, setTipoRegistro] = useState<string>("")

  // Cargar usuarios desde la API
  useEffect(() => {
    cargarUsuarios()
    cargarEstadisticas()
  }, [])

  const cargarUsuarios = async () => {
    try {
      const response = await fetch("/api/admin/usuarios")
      const data = await response.json()
      setUsuarios(data.usuarios || [])
    } catch (error) {
      console.error("Error cargando usuarios:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch("/api/admin/estadisticas")
      const data = await response.json()
      setEstadisticas(data.estadisticas)
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

  const usuariosFiltrados = usuarios.filter((usuario) => filtroRol === "todos" || usuario.rol === filtroRol)

  const estadisticasUsuarios = {
    medicos: usuarios.filter((u) => u.rol === "medico").length,
    farmacias: usuarios.filter((u) => u.rol === "farmacia").length,
    laboratorios: usuarios.filter((u) => u.rol === "laboratorio").length,
    pendientes: usuarios.filter((u) => u.estado === "pendiente").length,
  }

  const cambiarEstadoUsuario = async (id: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/admin/usuarios/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        cargarUsuarios()
      }
    } catch (error) {
      console.error("Error actualizando estado:", error)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/auth/login"
  }

  return (
    <ProtectedRoute allowedRoles={["administrador"]}>
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
                <p className="text-muted-foreground">Control total del sistema MediLink+</p>
              </div>
              <div className="flex items-center space-x-3">
                <Dialog open={showRegistroModal} onOpenChange={setShowRegistroModal}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Registrar Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
                      <DialogDescription>Selecciona el tipo de usuario que deseas registrar</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-3 gap-4 py-4">
                      <Button
                        variant="outline"
                        className="h-24 flex-col gap-2 bg-transparent"
                        onClick={() => {
                          setTipoRegistro("medico")
                          setShowRegistroModal(false)
                        }}
                      >
                        <Stethoscope className="w-8 h-8" />
                        Médico
                      </Button>

                      <Button
                        variant="outline"
                        className="h-24 flex-col gap-2 bg-transparent"
                        onClick={() => {
                          setTipoRegistro("farmacia")
                          setShowRegistroModal(false)
                        }}
                      >
                        <Building2 className="w-8 h-8" />
                        Farmacia
                      </Button>

                      <Button
                        variant="outline"
                        className="h-24 flex-col gap-2 bg-transparent"
                        onClick={() => {
                          setTipoRegistro("laboratorio")
                          setShowRegistroModal(false)
                        }}
                      >
                        <FlaskConical className="w-8 h-8" />
                        Laboratorio
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="medical-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas?.total_usuarios || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {estadisticas?.total_pacientes || 0} pacientes registrados
                </p>
              </CardContent>
            </Card>

            <Card className="medical-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Totales</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas?.total_citas || 0}</div>
                <p className="text-xs text-muted-foreground">{estadisticas?.citas_completadas || 0} completadas</p>
              </CardContent>
            </Card>

            <Card className="medical-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">S/ {estadisticas?.ingresos_totales?.toFixed(0) || 0}</div>
                <p className="text-xs text-muted-foreground">Ingresos totales del sistema</p>
              </CardContent>
            </Card>

            <Card className="medical-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticasUsuarios.pendientes}</div>
                <p className="text-xs text-muted-foreground">Esperando aprobación</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="usuarios" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
              <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
              <TabsTrigger value="base-datos">Base de Datos</TabsTrigger>
              <TabsTrigger value="configuracion">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="usuarios">
              <Card className="medical-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Gestión de Usuarios</CardTitle>
                      <CardDescription>Administra médicos, farmacias y laboratorios</CardDescription>
                    </div>

                    <Select value={filtroRol} onValueChange={setFiltroRol}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los roles</SelectItem>
                        <SelectItem value="medico">Médicos</SelectItem>
                        <SelectItem value="farmacia">Farmacias</SelectItem>
                        <SelectItem value="laboratorio">Laboratorios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha Registro</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuariosFiltrados.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {usuario.nombre} {usuario.apellido}
                              </div>
                              <div className="text-sm text-muted-foreground">{usuario.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{usuario.telefono}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                usuario.estado === "activo"
                                  ? "default"
                                  : usuario.estado === "pendiente"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {usuario.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(usuario.fechaRegistro).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {usuario.estado === "pendiente" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => cambiarEstadoUsuario(usuario.id, "activo")}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => cambiarEstadoUsuario(usuario.id, "rechazado")}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="estadisticas">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="medical-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                      Estadísticas del Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-card/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{estadisticasUsuarios.medicos}</div>
                        <p className="text-sm text-muted-foreground">Médicos</p>
                      </div>
                      <div className="text-center p-4 bg-card/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{estadisticasUsuarios.farmacias}</div>
                        <p className="text-sm text-muted-foreground">Farmacias</p>
                      </div>
                      <div className="text-center p-4 bg-card/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{estadisticasUsuarios.laboratorios}</div>
                        <p className="text-sm text-muted-foreground">Laboratorios</p>
                      </div>
                      <div className="text-center p-4 bg-card/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{estadisticas?.total_pacientes || 0}</div>
                        <p className="text-sm text-muted-foreground">Pacientes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="medical-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-primary" />
                      Actividad del Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Citas Completadas</span>
                        <span>
                          {estadisticas?.citas_completadas || 0}/{estadisticas?.total_citas || 0}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${
                              estadisticas?.total_citas
                                ? (estadisticas.citas_completadas / estadisticas.total_citas) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center p-4 bg-card/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{estadisticas?.citas_pendientes || 0}</div>
                        <p className="text-sm text-muted-foreground">Citas Pendientes</p>
                      </div>
                      <div className="text-center p-4 bg-card/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          S/ {estadisticas?.ingresos_totales?.toFixed(0) || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Ingresos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="base-datos">
              <Card className="medical-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2 text-primary" />
                    Control de Base de Datos
                  </CardTitle>
                  <CardDescription>Gestión y monitoreo de la base de datos PostgreSQL</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Funcionalidad de administración de base de datos en desarrollo
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Aquí podrás gestionar respaldos, optimizaciones y consultas directas a PostgreSQL
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="configuracion">
              <Card className="medical-shadow">
                <CardHeader>
                  <CardTitle>Configuración del Sistema</CardTitle>
                  <CardDescription>Ajustes generales de MediLink+</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Panel de configuración en desarrollo. Aquí podrás ajustar parámetros del sistema.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
