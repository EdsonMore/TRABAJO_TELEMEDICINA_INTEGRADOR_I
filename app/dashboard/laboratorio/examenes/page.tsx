"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TestTube, Microscope, CheckCircle, FileText, Search } from "lucide-react"

interface Examen {
  id: number
  fecha_solicitud: string
  tipo_examen: string
  indicaciones: string
  estado: string
  prioridad: string
  nombre_paciente: string
  dni_paciente: string
  telefono_paciente: string
  fecha_nacimiento: string
  nombre_medico: string
  especialidad: string
  cmp: string
}

export default function ExamenesPage() {
  const [examenesPendientes, setExamenesPendientes] = useState<Examen[]>([])
  const [filtroExamenes, setFiltroExamenes] = useState("")
  const [cargando, setCargando] = useState(true)
  const [procesandoExamen, setProcesandoExamen] = useState<number | null>(null)
  const [examenSeleccionado, setExamenSeleccionado] = useState<Examen | null>(null)
  const [resultados, setResultados] = useState("")
  const [observaciones, setObservaciones] = useState("")

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

  const registrarResultados = async () => {
    if (!examenSeleccionado) return

    try {
      setProcesandoExamen(examenSeleccionado.id)
      const token = localStorage.getItem("token")

      const response = await fetch("/api/laboratorio/examenes-pendientes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examenId: examenSeleccionado.id,
          resultados: resultados,
          observaciones: observaciones,
          valores_referencia: "Valores normales según protocolo del laboratorio",
        }),
      })

      if (response.ok) {
        setExamenSeleccionado(null)
        setResultados("")
        setObservaciones("")
        await cargarExamenesPendientes()
      }
    } catch (error) {
      console.error("Error al registrar resultados:", error)
    } finally {
      setProcesandoExamen(null)
    }
  }

  const examenesFiltrados = examenesPendientes.filter(
    (examen) =>
      examen.nombre_paciente.toLowerCase().includes(filtroExamenes.toLowerCase()) ||
      examen.dni_paciente.includes(filtroExamenes) ||
      examen.tipo_examen.toLowerCase().includes(filtroExamenes.toLowerCase()) ||
      examen.nombre_medico.toLowerCase().includes(filtroExamenes.toLowerCase()),
  )

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "urgente":
        return "bg-red-100 text-red-800 border-red-200"
      case "alta":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-medical-text-secondary">Cargando exámenes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-medical-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Exámenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por paciente, DNI, tipo de examen o médico..."
              value={filtroExamenes}
              onChange={(e) => setFiltroExamenes(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-medical-text-primary">
              Lista de Exámenes ({examenesFiltrados.length})
            </h3>

            {examenesFiltrados.length === 0 ? (
              <Card className="border-medical-border">
                <CardContent className="text-center py-8">
                  <TestTube className="h-12 w-12 text-medical-text-secondary mx-auto mb-4" />
                  <p className="text-medical-text-secondary">
                    {filtroExamenes ? "No se encontraron exámenes con ese criterio" : "No hay exámenes pendientes"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              examenesFiltrados.map((examen) => (
                <Card
                  key={examen.id}
                  className={`border-medical-border cursor-pointer transition-all hover:shadow-md ${
                    examenSeleccionado?.id === examen.id ? "ring-2 ring-medical-primary" : ""
                  }`}
                  onClick={() => setExamenSeleccionado(examen)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-medical-primary/10 p-2 rounded-lg">
                          <Microscope className="h-5 w-5 text-medical-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{examen.tipo_examen}</CardTitle>
                          <CardDescription>Examen #{examen.id}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getPrioridadColor(examen.prioridad)} variant="outline">
                          {examen.prioridad}
                        </Badge>
                        <Badge
                          variant={examen.estado === "pendiente" ? "destructive" : "default"}
                          className="capitalize text-xs"
                        >
                          {examen.estado.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Paciente:</span> {examen.nombre_paciente}
                      </p>
                      <p>
                        <span className="font-medium">DNI:</span> {examen.dni_paciente}
                      </p>
                      <p>
                        <span className="font-medium">Médico:</span> Dr(a). {examen.nombre_medico}
                      </p>
                      <p>
                        <span className="font-medium">Fecha:</span>{" "}
                        {new Date(examen.fecha_solicitud).toLocaleDateString("es-PE")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-medical-text-primary">Registro de Resultados</h3>

            {examenSeleccionado ? (
              <Card className="border-medical-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {examenSeleccionado.tipo_examen}
                  </CardTitle>
                  <CardDescription>
                    Examen #{examenSeleccionado.id} - {examenSeleccionado.nombre_paciente}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-medical-background p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-medical-text-primary">Información del Paciente</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <span className="font-medium">Nombre:</span> {examenSeleccionado.nombre_paciente}
                      </p>
                      <p>
                        <span className="font-medium">DNI:</span> {examenSeleccionado.dni_paciente}
                      </p>
                      <p>
                        <span className="font-medium">Teléfono:</span> {examenSeleccionado.telefono_paciente}
                      </p>
                      <p>
                        <span className="font-medium">Edad:</span>{" "}
                        {new Date().getFullYear() - new Date(examenSeleccionado.fecha_nacimiento).getFullYear()} años
                      </p>
                    </div>
                  </div>

                  {examenSeleccionado.indicaciones && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Indicaciones Médicas</Label>
                      <p className="text-sm bg-medical-background p-3 rounded-lg">
                        {examenSeleccionado.indicaciones}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resultados">Resultados del Examen *</Label>
                      <Textarea
                        id="resultados"
                        placeholder="Ingrese los resultados detallados del examen..."
                        value={resultados}
                        onChange={(e) => setResultados(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observaciones">Observaciones Adicionales</Label>
                      <Textarea
                        id="observaciones"
                        placeholder="Observaciones, recomendaciones o notas adicionales..."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-medical-border">
                      <Button
                        onClick={registrarResultados}
                        disabled={!resultados.trim() || procesandoExamen === examenSeleccionado.id}
                        className="bg-medical-primary hover:bg-medical-primary/90"
                      >
                        {procesandoExamen === examenSeleccionado.id ? "Guardando..." : "Registrar Resultados"}
                      </Button>
                      <Button
                        onClick={() => {
                          setExamenSeleccionado(null)
                          setResultados("")
                          setObservaciones("")
                        }}
                        variant="outline"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-medical-border">
                <CardContent className="text-center py-8">
                  <Microscope className="h-12 w-12 text-medical-text-secondary mx-auto mb-4" />
                  <p className="text-medical-text-secondary">
                    Selecciona un examen de la lista para registrar resultados
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
