'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Estadisticas {
  usuarios: {
    total: number; pacientes: number; medicos: number
    farmacias: number; laboratorios: number
  }
  citas: {
    total: number; completadas: number; pendientes: number
    canceladas: number; no_show: number; hoy: number
    hoy_pendientes: number; tasa_completacion: number
  }
  recetas: {
    total: number; no_enviadas: number; enviadas: number
    recibidas: number; en_proceso: number; dispensadas: number
    rechazada: number; tasa_dispensacion: number
  }
  transacciones: {
    total: number; ingresos_totales: number
    transacciones_entregadas: number
    transacciones_pendientes: number
    ingresos_hoy: number; ticket_promedio: number
    tasa_entrega: number
  }
  satisfaccion: {
    evaluaciones_totales: number; promedio: number
    positivas: number; negativas: number; tasa_respuesta: number
  }
  laboratorio: {
    solicitudes_totales: number; completadas: number
    pendientes: number; hoy: number; tasa_completacion: number
  }
  timestamp: string; periodo: string
}

export default function AdminGeneralPage() {
  const router = useRouter()
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEstadisticas = async () => {
    try {
      const token = localStorage.getItem('medilink_token')
      if (!token) {
        router.push('/auth/login')
        return
      }
      const response = await fetch('/api/admin/estadisticas', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Error al obtener estadísticas')
      const data = await response.json()
      setEstadisticas(data.estadisticas || data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEstadisticas()
  }, [])

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
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{error || 'No se pudieron cargar las estadísticas'}</p>
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

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vista General</h1>
          <p className="text-sm text-gray-600">Distribución de usuarios y estado de citas</p>
        </div>

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
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
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
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
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
      </div>
    </div>
  )
}
