'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Star,
  Eye,
} from 'lucide-react'

interface Estadisticas {
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

export default function AdminDetallesPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Detalles</h1>
          <p className="text-sm text-gray-600">Información detallada del sistema</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  )
}
