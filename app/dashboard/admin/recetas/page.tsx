'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { MetricCard } from '@/components/admin/metric-card'

interface Estadisticas {
  recetas: {
    total: number; no_enviadas: number; enviadas: number
    recibidas: number; en_proceso: number; dispensadas: number
    rechazada: number; tasa_dispensacion: number
  }
  timestamp: string; periodo: string
}

export default function AdminRecetasPage() {
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

  const recetasData = [
    { name: 'No Enviadas', value: estadisticas.recetas.no_enviadas },
    { name: 'Enviadas', value: estadisticas.recetas.enviadas },
    { name: 'En Proceso', value: estadisticas.recetas.en_proceso },
    { name: 'Dispensadas', value: estadisticas.recetas.dispensadas },
    { name: 'Rechazadas', value: estadisticas.recetas.rechazada },
  ]

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recetas Electrónicas</h1>
          <p className="text-sm text-gray-600">Estado de las recetas electrónicas en el sistema</p>
        </div>

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
      </div>
    </div>
  )
}
