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
import {
  Users,
  Calendar,
  FileText,
  ShoppingCart,
  Star,
  Activity,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { ReportGenerator } from '@/components/admin/report-generator'
import { MetricCard } from '@/components/admin/metric-card'

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

        {/* Navigation Cards */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Módulos del Sistema</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all border-2"
              onClick={() => router.push('/dashboard/admin/general')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  General
                </CardTitle>
                <CardDescription>Distribución de usuarios y estado de citas</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all border-2"
              onClick={() => router.push('/dashboard/admin/usuarios')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Usuarios
                </CardTitle>
                <CardDescription>Detalle de usuarios registrados por rol</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all border-2"
              onClick={() => router.push('/dashboard/admin/citas')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Citas
                </CardTitle>
                <CardDescription>Estado y estadísticas de citas médicas</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all border-2"
              onClick={() => router.push('/dashboard/admin/recetas')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  Recetas
                </CardTitle>
                <CardDescription>Recetas electrónicas y su estado</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all border-2"
              onClick={() => router.push('/dashboard/admin/farmacias')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-rose-500" />
                  Farmacias
                </CardTitle>
                <CardDescription>Estadísticas por farmacia</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all border-2"
              onClick={() => router.push('/dashboard/admin/evaluaciones')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Evaluaciones
                </CardTitle>
                <CardDescription>Análisis de evaluaciones de pacientes</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all border-2"
              onClick={() => router.push('/dashboard/admin/detalles')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-cyan-500" />
                  Detalles
                </CardTitle>
                <CardDescription>Transacciones, satisfacción y laboratorio</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
