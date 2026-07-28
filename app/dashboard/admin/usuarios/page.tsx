'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Users, Activity } from 'lucide-react'
import { MetricCard } from '@/components/admin/metric-card'

interface Estadisticas {
  usuarios: {
    total: number; pacientes: number; medicos: number
    farmacias: number; laboratorios: number
  }
  timestamp: string; periodo: string
}

export default function AdminUsuariosPage() {
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

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-600">Distribución de usuarios registrados en el sistema</p>
        </div>

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
      </div>
    </div>
  )
}
