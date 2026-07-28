'use client'

import { EstadisticasPorFarmacia } from '@/components/admin/estadisticas-por-farmacia'

export default function AdminFarmaciasPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmacias</h1>
          <p className="text-sm text-gray-600">Estadísticas por farmacia</p>
        </div>
        <EstadisticasPorFarmacia />
      </div>
    </div>
  )
}
