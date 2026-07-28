"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TestTube, Microscope, Clock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react"

interface Examen {
  id: number
  fecha_solicitud: string
  tipo_examen: string
  estado: string
  prioridad: string
  nombre_paciente: string
  dni_paciente: string
  fecha_nacimiento: string
  nombre_medico: string
}

export default function DashboardLaboratorio() {
  const { usuario } = useAuth()
  const router = useRouter()
  const [examenesPendientes, setExamenesPendientes] = useState<Examen[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarExamenesPendientes()
  }, [])

  const cargarExamenesPendientes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/laboratorio/examenes-pendientes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setExamenesPendientes(data.examenes || [])
      }
    } catch (error) {
      console.error("Error al cargar exámenes:", error)
    } finally {
      setCargando(false)
    }
  }

  const estadisticas = {
    pendientes: examenesPendientes.filter((e) => e.estado === "pendiente").length,
    enProceso: examenesPendientes.filter((e) => e.estado === "en_proceso").length,
    urgentes: examenesPendientes.filter((e) => e.prioridad === "urgente").length,
    totalHoy: examenesPendientes.filter((e) => {
      const hoy = new Date().toISOString().split("T")[0]
      return e.fecha_solicitud.startsWith(hoy)
    }).length,
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-medical-text-secondary">Cargando dashboard de laboratorio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-medical-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-medical-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-medical-text-primary mb-2">Dashboard de Laboratorio</h1>
              <p className="text-medical-text-secondary">
                Bienvenido, {usuario?.nombre || "Usuario"} - Gestiona exámenes y resultados
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-medical-text-secondary">Fecha actual</p>
                <p className="font-semibold text-medical-text-primary">
                  {new Date().toLocaleDateString("es-PE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <TestTube className="h-12 w-12 text-medical-primary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-medical-border bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-text-secondary">Exámenes Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-medical-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text-primary">{estadisticas.pendientes}</div>
              <p className="text-xs text-medical-text-secondary">Esperando procesamiento</p>
            </CardContent>
          </Card>

          <Card className="border-medical-border bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-text-secondary">En Proceso</CardTitle>
              <TestTube className="h-4 w-4 text-medical-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text-primary">{estadisticas.enProceso}</div>
              <p className="text-xs text-medical-text-secondary">Siendo analizados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Casos Urgentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{estadisticas.urgentes}</div>
              <p className="text-xs text-red-600">Prioridad alta</p>
            </CardContent>
          </Card>

          <Card className="border-medical-border bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-medical-text-secondary">Exámenes Hoy</CardTitle>
              <CheckCircle className="h-4 w-4 text-medical-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-medical-text-primary">{estadisticas.totalHoy}</div>
              <p className="text-xs text-medical-text-secondary">Recibidos hoy</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-lg transition-all duration-200 cursor-pointer border-0"
            onClick={() => router.push("/dashboard/laboratorio/examenes")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Microscope className="h-5 w-5 text-indigo-600" />
                  <span className="text-gray-800">Exámenes Pendientes</span>
                </CardTitle>
                <ArrowRight className="h-5 w-5 text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Revisa y gestiona los exámenes pendientes de procesar. Registra resultados y observaciones.
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-cyan-50 to-cyan-100 hover:shadow-lg transition-all duration-200 cursor-pointer border-0"
            onClick={() => router.push("/dashboard/laboratorio/equipos")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-cyan-600" />
                  <span className="text-gray-800">Equipos</span>
                </CardTitle>
                <ArrowRight className="h-5 w-5 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Control de equipos de laboratorio y mantenimiento preventivo.
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-lg transition-all duration-200 cursor-pointer border-0"
            onClick={() => router.push("/dashboard/laboratorio/reportes")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="text-gray-800">Reportes</span>
                </CardTitle>
                <ArrowRight className="h-5 w-5 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Análisis de exámenes realizados y rendimiento del laboratorio.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
