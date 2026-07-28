'use client'

import { useEffect, useState } from 'react'
import { EvaluacionesAnalisis } from '@/components/admin/evaluaciones-analisis'

export default function AdminEvaluacionesPage() {
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    const storedToken = localStorage.getItem('medilink_token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluaciones</h1>
          <p className="text-sm text-gray-600">Análisis de evaluaciones de pacientes</p>
        </div>
        {token && <EvaluacionesAnalisis token={token} />}
      </div>
    </div>
  )
}
