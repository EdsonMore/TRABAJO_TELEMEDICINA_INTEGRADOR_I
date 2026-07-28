'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'

interface Estadisticas {
  citas: {
    total: number; completadas: number; pendientes: number
    canceladas: number; no_show: number; hoy: number
    hoy_pendientes: number; tasa_completacion: number
  }
  timestamp: string; periodo: string
}

export default function AdminCitasPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-sm text-gray-600">Estado de las citas médicas</p>
        </div>

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
      </div>
    </div>
  )
}
