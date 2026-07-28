"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function ReportesPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="border-medical-border">
          <CardHeader>
            <CardTitle>Reportes y Estadísticas</CardTitle>
            <CardDescription>Análisis de exámenes realizados y rendimiento del laboratorio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-medical-text-secondary mx-auto mb-4" />
              <p className="text-medical-text-secondary">Módulo de reportes en desarrollo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
