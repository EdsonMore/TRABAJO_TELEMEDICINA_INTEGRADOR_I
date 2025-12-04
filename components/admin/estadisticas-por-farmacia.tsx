'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertCircle, Loader2, TrendingUp } from 'lucide-react'

interface FarmaciaStats {
  farmacia_id: string
  nombre_farmacia: string
  email_farmacia: string
  total_transacciones: number
  transacciones_hoy: number
  transacciones_entregadas: number
  transacciones_pendientes: number
  ingresos_totales: number
  ingresos_hoy: number
  ticket_promedio: number
  ticket_promedio_hoy: number
}

interface Totales {
  total_farmacias: number
  total_transacciones_todas: number
  total_transacciones_hoy: number
  ingresos_totales_todas: number
  ingresos_totales_hoy: number
  ticket_promedio_general: number
}

export function EstadisticasPorFarmacia() {
  const { token } = useAuth()
  const [farmacias, setFarmacias] = useState<FarmaciaStats[]>([])
  const [totales, setTotales] = useState<Totales | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterTab, setFilterTab] = useState<'ingresos' | 'transacciones'>('ingresos')

  useEffect(() => {
    fetchEstadisticas()
  }, [token])

  const fetchEstadisticas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/estadisticas-farmacia', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Error al obtener estadísticas')

      const data = await response.json()
      setFarmacias(data.farmacias)
      setTotales(data.totales)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle /> Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Filtrar y ordenar según tab
  const dataFiltrada = filterTab === 'ingresos'
    ? farmacias.sort((a, b) => b.ingresos_totales - a.ingresos_totales)
    : farmacias.sort((a, b) => b.total_transacciones - a.total_transacciones)

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      {totales && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Farmacias Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totales.total_farmacias}</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transacciones Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totales.total_transacciones_todas}</div>
              <p className="text-xs text-gray-600 mt-1">{totales.total_transacciones_hoy} hoy</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">S/. {totales.ingresos_totales_todas.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">S/. {totales.ingresos_totales_hoy.toFixed(2)} hoy</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">S/. {totales.ticket_promedio_general.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de Filtro */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Desglose por Farmacia</CardTitle>
          <CardDescription>Visualiza datos detallados de cada farmacia</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Botones de Tab */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setFilterTab('ingresos')}
              className={`pb-2 px-4 font-medium transition-colors ${
                filterTab === 'ingresos'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💰 Ingresos por Farmacia
            </button>
            <button
              onClick={() => setFilterTab('transacciones')}
              className={`pb-2 px-4 font-medium transition-colors ${
                filterTab === 'transacciones'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Transacciones por Farmacia
            </button>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Farmacia</TableHead>
                  {filterTab === 'ingresos' ? (
                    <>
                      <TableHead className="text-right">Ingresos Totales</TableHead>
                      <TableHead className="text-right">Ingresos Hoy</TableHead>
                      <TableHead className="text-right">Ticket Promedio</TableHead>
                      <TableHead className="text-right">Transacciones</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Hoy</TableHead>
                      <TableHead className="text-right">Entregadas</TableHead>
                      <TableHead className="text-right">Pendientes</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataFiltrada.map((farmacia) => (
                  <TableRow key={farmacia.farmacia_id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{farmacia.nombre_farmacia}</p>
                        <p className="text-xs text-gray-500">{farmacia.email_farmacia}</p>
                      </div>
                    </TableCell>
                    {filterTab === 'ingresos' ? (
                      <>
                        <TableCell className="text-right">
                          <span className="font-bold text-green-600">
                            S/. {farmacia.ingresos_totales.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-green-50">
                            S/. {farmacia.ingresos_hoy.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm">S/. {farmacia.ticket_promedio.toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-gray-600">{farmacia.total_transacciones}</span>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right">
                          <Badge className="bg-blue-100 text-blue-800">
                            {farmacia.total_transacciones}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-purple-100 text-purple-800">
                            {farmacia.transacciones_hoy}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-green-100 text-green-800">
                            {farmacia.transacciones_entregadas}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-amber-100 text-amber-800">
                            {farmacia.transacciones_pendientes}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {farmacias.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay datos de farmacias disponibles
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
