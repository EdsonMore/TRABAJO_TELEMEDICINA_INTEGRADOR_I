'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  Calendar,
  FileText,
  ShoppingCart,
  Star,
  Activity,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  Eye,
  Download,
  Printer,
  LogOut,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportGenerator } from '@/components/admin/report-generator'
import { EvaluacionesAnalisis } from '@/components/admin/evaluaciones-analisis'
import { EstadisticasPorFarmacia } from '@/components/admin/estadisticas-por-farmacia'

interface Estadisticas {
  usuarios: {
    total: number
    pacientes: number
    medicos: number
    farmacias: number
    laboratorios: number
  }
  citas: {
    total: number
    completadas: number
    pendientes: number
    canceladas: number
    no_show: number
    hoy: number
    hoy_pendientes: number
    tasa_completacion: number
  }
  recetas: {
    total: number
    no_enviadas: number
    enviadas: number
    recibidas: number
    en_proceso: number
    dispensadas: number
    rechazada: number
    tasa_dispensacion: number
  }
  transacciones: {
    total: number
    ingresos_totales: number
    transacciones_entregadas: number
    transacciones_pendientes: number
    ingresos_hoy: number
    ticket_promedio: number
    tasa_entrega: number
  }
  satisfaccion: {
    evaluaciones_totales: number
    promedio: number
    positivas: number
    negativas: number
    tasa_respuesta: number
  }
  laboratorio: {
    solicitudes_totales: number
    completadas: number
    pendientes: number
    hoy: number
    tasa_completacion: number
  }
  timestamp: string
  periodo: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const dashboardRef = useRef<HTMLDivElement>(null)
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    setMounted(true)
    const storedToken = localStorage.getItem('medilink_token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    fetchEstadisticas()
    const interval = setInterval(fetchEstadisticas, 30000)
    return () => clearInterval(interval)
  }, [mounted])

  const fetchEstadisticas = async () => {
    try {
      const token = localStorage.getItem('medilink_token')
      console.log('🔑 Token encontrado:', token ? 'SÍ' : 'NO')
      
      if (!token) {
        console.log('❌ No hay token, redirigiendo a login')
        setError('No autorizado - por favor inicia sesión')
        router.push('/auth/login')
        return
      }

      console.log('📡 Llamando API /api/admin/estadisticas...')
      const response = await fetch('/api/admin/estadisticas', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })

      console.log('✅ Respuesta API:', response.status, response.statusText)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al obtener estadísticas')
      }

      const data = await response.json()
      console.log('📊 Datos recibidos:', data)
      setEstadisticas(data.estadisticas || data)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error:', errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('medilink_token')
    localStorage.removeItem('user')
    setToken('')
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !estadisticas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle /> Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{error || 'No se pudieron cargar las estadísticas'}</p>
            <Button onClick={fetchEstadisticas} className="mt-4 w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const usuariosData = [
    { name: 'Pacientes', value: estadisticas.usuarios.pacientes, color: '#3b82f6' },
    { name: 'Médicos', value: estadisticas.usuarios.medicos, color: '#10b981' },
    { name: 'Farmacias', value: estadisticas.usuarios.farmacias, color: '#f59e0b' },
    { name: 'Laboratorios', value: estadisticas.usuarios.laboratorios, color: '#8b5cf6' },
  ]

  const citasData = [
    { name: 'Completadas', value: estadisticas.citas.completadas, color: '#10b981' },
    { name: 'Pendientes', value: estadisticas.citas.pendientes, color: '#fbbf24' },
    { name: 'Canceladas', value: estadisticas.citas.canceladas, color: '#ef4444' },
    { name: 'No Show', value: estadisticas.citas.no_show, color: '#6b7280' },
  ]

  const recetasData = [
    { name: 'No Enviadas', value: estadisticas.recetas.no_enviadas },
    { name: 'Enviadas', value: estadisticas.recetas.enviadas },
    { name: 'En Proceso', value: estadisticas.recetas.en_proceso },
    { name: 'Dispensadas', value: estadisticas.recetas.dispensadas },
    { name: 'Rechazadas', value: estadisticas.recetas.rechazada },
  ]

  const COLORS = ['#ef4444', '#fbbf24', '#3b82f6', '#10b981', '#6b7280']

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color = 'bg-blue-50',
    borderColor = 'border-blue-200',
  }: {
    icon: any
    title: string
    value: string | number
    subtitle?: string
    trend?: string
    color?: string
    borderColor?: string
  }) => (
    <Card className={`${color} border-2 ${borderColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        {trend && <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> {trend}
        </p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8" ref={dashboardRef}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Panel de Control Admin</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">MediLink+ - Sistema de Telemedicina</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={fetchEstadisticas} className="w-full sm:w-auto">
              <Zap className="h-4 w-4 mr-2" /> Actualizar
            </Button>
            {token && <ReportGenerator token={token} dashboardRef={dashboardRef} />}
            <Button 
              variant="destructive" 
              onClick={handleLogout} 
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
          <MetricCard
            icon={Users}
            title="Usuarios Activos"
            value={estadisticas.usuarios.total}
            subtitle={`${estadisticas.usuarios.pacientes} pacientes`}
            color="bg-blue-50"
            borderColor="border-blue-200"
          />
          <MetricCard
            icon={Calendar}
            title="Citas Hoy"
            value={estadisticas.citas.hoy}
            subtitle={`${estadisticas.citas.hoy_pendientes} pendientes`}
            color="bg-green-50"
            borderColor="border-green-200"
          />
          <MetricCard
            icon={FileText}
            title="Recetas Emitidas"
            value={estadisticas.recetas.total}
            subtitle={`${estadisticas.recetas.tasa_dispensacion}% dispensadas`}
            color="bg-purple-50"
            borderColor="border-purple-200"
          />
          <MetricCard
            icon={ShoppingCart}
            title="Ingresos Hoy"
            value={`S/.${estadisticas.transacciones.ingresos_hoy.toFixed(2)}`}
            subtitle={`${estadisticas.transacciones.total} transacciones`}
            color="bg-amber-50"
            borderColor="border-amber-200"
          />
          <MetricCard
            icon={Star}
            title="Satisfacción"
            value={estadisticas.satisfaccion.promedio.toFixed(1)}
            subtitle={`${estadisticas.satisfaccion.evaluaciones_totales} evaluaciones`}
            color="bg-rose-50"
            borderColor="border-rose-200"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-1 md:gap-2 h-auto md:h-10 p-1 md:p-0">
            <TabsTrigger value="general" className="text-xs md:text-sm py-2 md:py-0">General</TabsTrigger>
            <TabsTrigger value="usuarios" className="text-xs md:text-sm py-2 md:py-0">Usuarios</TabsTrigger>
            <TabsTrigger value="citas" className="text-xs md:text-sm py-2 md:py-0">Citas</TabsTrigger>
            <TabsTrigger value="recetas" className="text-xs md:text-sm py-2 md:py-0">Recetas</TabsTrigger>
            <TabsTrigger value="farmacias" className="text-xs md:text-sm py-2 md:py-0">Farmacias</TabsTrigger>
            <TabsTrigger value="evaluaciones" className="text-xs md:text-sm py-2 md:py-0 hidden md:inline-flex">Evaluaciones</TabsTrigger>
            <TabsTrigger value="detalles" className="text-xs md:text-sm py-2 md:py-0">Detalles</TabsTrigger>
          </TabsList>

          {/* TAB: GENERAL */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Usuarios</CardTitle>
                  <CardDescription>Por tipo de rol en el sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={usuariosData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {usuariosData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado de Citas</CardTitle>
                  <CardDescription>Distribución actual de citas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={citasData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {citasData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: USUARIOS */}
          <TabsContent value="usuarios" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard
                icon={Users}
                title="Total Usuarios"
                value={estadisticas.usuarios.total}
                color="bg-blue-50"
                borderColor="border-blue-200"
              />
              <MetricCard
                icon={Activity}
                title="Pacientes"
                value={estadisticas.usuarios.pacientes}
                color="bg-green-50"
                borderColor="border-green-200"
              />
              <MetricCard
                icon={Activity}
                title="Médicos"
                value={estadisticas.usuarios.medicos}
                color="bg-purple-50"
                borderColor="border-purple-200"
              />
              <MetricCard
                icon={Activity}
                title="Farmacias"
                value={estadisticas.usuarios.farmacias}
                color="bg-amber-50"
                borderColor="border-amber-200"
              />
              <MetricCard
                icon={Activity}
                title="Laboratorios"
                value={estadisticas.usuarios.laboratorios}
                color="bg-rose-50"
                borderColor="border-rose-200"
              />
            </div>
          </TabsContent>

          {/* TAB: CITAS */}
          <TabsContent value="citas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Citas Generales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <span className="flex items-center gap-2 text-green-900">
                      <CheckCircle className="h-5 w-5" /> Completadas
                    </span>
                    <span className="font-bold text-green-900">{estadisticas.citas.completadas}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg">
                    <span className="flex items-center gap-2 text-amber-900">
                      <Clock className="h-5 w-5" /> Pendientes
                    </span>
                    <span className="font-bold text-amber-900">{estadisticas.citas.pendientes}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                    <span className="flex items-center gap-2 text-red-900">
                      <XCircle className="h-5 w-5" /> Canceladas
                    </span>
                    <span className="font-bold text-red-900">{estadisticas.citas.canceladas}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                    <span className="flex items-center gap-2 text-gray-900">
                      <AlertCircle className="h-5 w-5" /> No Show
                    </span>
                    <span className="font-bold text-gray-900">{estadisticas.citas.no_show}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">Tasa de Completación</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                      <div
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${estadisticas.citas.tasa_completacion}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm font-bold mt-1">{estadisticas.citas.tasa_completacion}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Citas Hoy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <div className="text-4xl font-bold text-blue-900">{estadisticas.citas.hoy}</div>
                      <p className="text-blue-700 text-sm mt-2">Citas Programadas Hoy</p>
                    </div>
                    <div className="text-center py-6 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg">
                      <div className="text-3xl font-bold text-amber-900">{estadisticas.citas.hoy_pendientes}</div>
                      <p className="text-amber-700 text-sm mt-2">Pendientes por Completar</p>
                    </div>
                    <Badge className="w-full justify-center py-2 text-center">
                      Actualizado: {new Date(estadisticas.timestamp).toLocaleTimeString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: RECETAS */}
          <TabsContent value="recetas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Recetas Electrónicas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={recetasData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                icon={FileText}
                title="Total Recetas"
                value={estadisticas.recetas.total}
                color="bg-blue-50"
                borderColor="border-blue-200"
              />
              <MetricCard
                icon={CheckCircle}
                title="Dispensadas"
                value={estadisticas.recetas.dispensadas}
                subtitle={`${estadisticas.recetas.tasa_dispensacion}% del total`}
                color="bg-green-50"
                borderColor="border-green-200"
              />
              <MetricCard
                icon={AlertCircle}
                title="Rechazadas"
                value={estadisticas.recetas.rechazada}
                color="bg-red-50"
                borderColor="border-red-200"
              />
            </div>
          </TabsContent>

          {/* TAB: DETALLES */}
          <TabsContent value="detalles" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transacciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Transacciones de Medicamentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <span className="text-blue-900">Total Transacciones</span>
                    <span className="font-bold text-blue-900">{estadisticas.transacciones.total}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <span className="text-green-900">Entregadas</span>
                    <span className="font-bold text-green-900">{estadisticas.transacciones.transacciones_entregadas}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg">
                    <span className="text-amber-900">Pendientes</span>
                    <span className="font-bold text-amber-900">{estadisticas.transacciones.transacciones_pendientes}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      S/. {estadisticas.transacciones.ingresos_totales.toFixed(2)}
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Ticket Promedio</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">
                      S/. {estadisticas.transacciones.ticket_promedio.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Satisfacción */}
              <Card>
                <CardHeader>
                  <CardTitle>Satisfacción de Pacientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6 bg-gradient-to-r from-rose-50 to-rose-100 rounded-lg">
                    <div className="flex justify-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-6 w-6 ${
                            i < Math.round(estadisticas.satisfaccion.promedio)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-3xl font-bold text-rose-900">{estadisticas.satisfaccion.promedio.toFixed(1)}</div>
                    <p className="text-rose-700 text-sm mt-1">De 5 estrellas</p>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <span className="text-green-900">Evaluaciones Positivas</span>
                    <span className="font-bold text-green-900">{estadisticas.satisfaccion.positivas}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                    <span className="text-red-900">Evaluaciones Negativas</span>
                    <span className="font-bold text-red-900">{estadisticas.satisfaccion.negativas}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Tasa de Respuesta</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                      <div
                        className="bg-rose-500 h-3 rounded-full"
                        style={{ width: `${estadisticas.satisfaccion.tasa_respuesta}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm font-bold mt-1">{estadisticas.satisfaccion.tasa_respuesta}%</p>
                  </div>
                </CardContent>
              </Card>

              {/* Laboratorio */}
              <Card>
                <CardHeader>
                  <CardTitle>Solicitudes de Laboratorio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <span className="text-blue-900">Total Solicitudes</span>
                    <span className="font-bold text-blue-900">{estadisticas.laboratorio.solicitudes_totales}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <span className="text-green-900">Completadas</span>
                    <span className="font-bold text-green-900">{estadisticas.laboratorio.completadas}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg">
                    <span className="text-amber-900">Pendientes</span>
                    <span className="font-bold text-amber-900">{estadisticas.laboratorio.pendientes}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Solicitudes Hoy</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{estadisticas.laboratorio.hoy}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Información General */}
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Período:</span>
                    <span className="font-semibold">{estadisticas.periodo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Última actualización:</span>
                    <span className="font-semibold">{new Date(estadisticas.timestamp).toLocaleString()}</span>
                  </div>
                  <Button className="w-full mt-4" onClick={fetchEstadisticas}>
                    <Eye className="h-4 w-4 mr-2" /> Actualizar Datos
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: EVALUACIONES */}
          <TabsContent value="evaluaciones" className="space-y-6">
            <EvaluacionesAnalisis token={token} />
          </TabsContent>

          {/* TAB: FARMACIAS */}
          <TabsContent value="farmacias" className="space-y-6">
            <EstadisticasPorFarmacia />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
