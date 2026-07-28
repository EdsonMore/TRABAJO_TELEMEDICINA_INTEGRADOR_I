"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

export default function EquiposPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="border-medical-border">
          <CardHeader>
            <CardTitle>Gestión de Equipos</CardTitle>
            <CardDescription>Control de equipos de laboratorio y mantenimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-medical-text-secondary mx-auto mb-4" />
              <p className="text-medical-text-secondary">Módulo de equipos en desarrollo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
