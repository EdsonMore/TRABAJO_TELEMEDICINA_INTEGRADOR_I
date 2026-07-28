"use client"

import { useState, useEffect } from "react"
import jsPDF from "jspdf"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"

interface ReportData {
  fecha_generacion: string
  periodo?: string
  metricas_clave: {
    usuarios_registrados: {
      total: number
      pacientes: number
      medicos: number
    }
    citas_medicas: {
      total: number
      completadas: number
      pendientes: number
      tasa_completacion: number
    }
    recetas_electronicas: {
      total: number
      dispensadas: number
      tasa_dispensacion: number
    }
    transacciones_medicamentos: {
      total_transacciones: number
      ingresos_totales: number
      ingreso_promedio: string | number
    }
    satisfaccion_pacientes: {
      promedio: number
      evaluaciones_totales: number
    }
  }
}

export function ReportGenerator({
  token,
  dashboardRef,
}: {
  token: string
  dashboardRef: React.RefObject<HTMLDivElement>
}) {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/reportes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Error al obtener datos del reporte")

      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar los datos del reporte")
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    try {
      setLoading(true)
      let data = reportData
      if (!data) {
        const response = await fetch("/api/admin/reportes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) throw new Error("Error al obtener datos del reporte")
        data = await response.json()
      }

      if (!data) {
        alert("No hay datos disponibles para generar el PDF")
        return
      }

      // Usar jsPDF directamente (funciona en cliente)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPos = 15

      // Header
      doc.setFont("Helvetica", "bold")
      doc.setFontSize(18)
      doc.setTextColor(2, 132, 199)
      doc.text("REPORTE MEDILINK+", pageWidth / 2, yPos, { align: "center" })

      yPos += 8
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text("Reporte Integral de Métricas del Negocio", pageWidth / 2, yPos, { align: "center" })

      yPos += 15

      // Metadata
      doc.setFontSize(9)
      doc.setTextColor(50, 50, 50)
      const fechaGen = data.fecha_generacion || new Date().toLocaleString('es-PE')
      const periodo = data.periodo || 'Reporte Completo del Sistema'
      doc.text(`Fecha: ${fechaGen}`, 15, yPos)
      doc.text(`Periodo: ${periodo}`, 15, yPos + 6)
      doc.text(`Generado por: Sistema MediLink+`, 15, yPos + 12)

      yPos += 25

      const metrics = data.metricas_clave

      // Helper para agregar sección
      const addMetricSection = (title: string, items: any[], startY: number) => {
        let y = startY
        doc.setFont("Helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(2, 132, 199)
        doc.text(title, 15, y)
        y += 7

        doc.setFont("Helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(50, 50, 50)

        items.forEach((item) => {
          doc.text(`${item.label}: ${item.value}`, 20, y)
          y += 5
        })

        return y + 4
      }

      // Métrica 1: Usuarios
      const usuarios = metrics.usuarios_registrados || {}
      yPos = addMetricSection("USUARIOS REGISTRADOS", [
        { label: "Total Activos", value: usuarios.total || 0 },
        { label: "Pacientes", value: usuarios.pacientes || 0 },
        { label: "Medicos", value: usuarios.medicos || 0 },
      ], yPos)

      // Métrica 2: Citas
      const citas = metrics.citas_medicas || {}
      yPos = addMetricSection("CITAS MEDICAS", [
        { label: "Total", value: citas.total || 0 },
        { label: "Completadas", value: citas.completadas || 0 },
        { label: "Pendientes", value: citas.pendientes || 0 },
        { label: "Tasa Completacion", value: `${citas.tasa_completacion || 0}%` },
      ], yPos)

      // Métrica 3: Recetas
      const recetas = metrics.recetas_electronicas || {}
      yPos = addMetricSection("RECETAS ELECTRONICAS", [
        { label: "Total", value: recetas.total || 0 },
        { label: "Dispensadas", value: recetas.dispensadas || 0 },
        { label: "Tasa Dispensacion", value: `${recetas.tasa_dispensacion || 0}%` },
      ], yPos)

      // Métrica 4: Transacciones
      const transacciones = metrics.transacciones_medicamentos || {}
      yPos = addMetricSection("TRANSACCIONES DE MEDICAMENTOS", [
        { label: "Total Transacciones", value: transacciones.total_transacciones || 0 },
        { label: "Ingresos Totales", value: `S/ ${transacciones.ingresos_totales?.toFixed(2) || "0.00"}` },
        { label: "Ingreso Promedio", value: `S/ ${transacciones.ingreso_promedio || "0.00"}` },
      ], yPos)

      // Métrica 5: Satisfacción
      const satisfaccion = metrics.satisfaccion_pacientes || {}
      yPos = addMetricSection("SATISFACCION DE PACIENTES", [
        { label: "Calificacion Promedio", value: `${satisfaccion.promedio?.toFixed(1) || "0.0"} / 5.0` },
        { label: "Total Evaluaciones", value: satisfaccion.evaluaciones_totales || 0 },
      ], yPos)

      // Footer
      doc.setFont("Helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text("Este reporte fue generado automaticamente por Sistema MediLink+", pageWidth / 2, pageHeight - 10, {
        align: "center",
      })

      doc.save(`reporte-medilink-${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error generando PDF:", error)
      alert("Error al generar el PDF. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const printReport = async () => {
    try {
      setLoading(true)
      let data = reportData
      if (!data) {
        const response = await fetch("/api/admin/reportes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) throw new Error("Error al obtener datos del reporte")
        data = await response.json()
      }

      const printWindow = window.open("", "", "width=800,height=600")
      if (!printWindow) {
        alert("Por favor permite pop-ups para imprimir")
        return
      }

      printWindow.document.write(generateReportHTML(data))
      printWindow.document.close()

      setTimeout(() => {
        printWindow.print()
      }, 250)
    } catch (error) {
      console.error("Error imprimiendo:", error)
      alert("Error al imprimir el reporte")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Button
        onClick={generatePDF}
        disabled={loading}
        variant="outline"
        size="sm"
        className="gap-2 w-full sm:w-auto text-xs md:text-sm"
      >
        <Download className="w-4 h-4" />
        {loading ? "Generando..." : "Descargar PDF"}
      </Button>
      <Button
        onClick={printReport}
        disabled={loading}
        variant="outline"
        size="sm"
        className="gap-2 w-full sm:w-auto text-xs md:text-sm"
      >
        <Printer className="w-4 h-4" />
        {loading ? "Preparando..." : "Imprimir"}
      </Button>
    </div>
  )
}

function generateReportHTML(data: ReportData | any): string {
  // Manejar tanto objeto directo como con wrapper metricas_clave
  let metrics = data?.metricas_clave || data
  const fechaGen = data?.fecha_generacion || new Date().toLocaleString('es-PE')
  const periodo = data?.periodo || 'Reporte Completo del Sistema'
  
  // Asegurar que metrics tiene la estructura correcta
  const usuarios = metrics?.usuarios_registrados || {}
  const citas = metrics?.citas_medicas || {}
  const recetas = metrics?.recetas_electronicas || {}
  const transacciones = metrics?.transacciones_medicamentos || {}
  const satisfaccion = metrics?.satisfaccion_pacientes || {}

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte MediLink+</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          line-height: 1.6;
          background: white;
        }
        .container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #0ea5e9;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #0ea5e9;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .metadata {
          display: flex;
          justify-content: space-between;
          background: #e0f2fe;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
          font-size: 12px;
          border: 1px solid #0ea5e9;
        }
        .metadata-item {
          display: flex;
          flex-direction: column;
        }
        .metadata-label {
          color: #0284c7;
          font-weight: 600;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .metric-card {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          page-break-inside: avoid;
        }
        .metric-card h3 {
          color: #0284c7;
          font-size: 16px;
          margin-bottom: 15px;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 10px;
        }
        .metric-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        .metric-row:last-child {
          border-bottom: none;
        }
        .metric-label {
          color: #666;
          font-weight: 500;
          flex: 1;
        }
        .metric-value {
          color: #0284c7;
          font-weight: 700;
          font-size: 16px;
          text-align: right;
          min-width: 60px;
        }
        .metric-value.percentage {
          background: #dbeafe;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .summary-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .summary-item-label {
          font-size: 12px;
          opacity: 0.9;
        }
        .summary-item-value {
          font-size: 18px;
          font-weight: 700;
          margin-top: 5px;
          word-break: break-word;
        }
        @media (max-width: 768px) {
          .container {
            max-width: 100%;
            padding: 10px;
          }
          .metric-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          .header h1 {
            font-size: 20px;
          }
          .header p {
            font-size: 12px;
          }
          .metadata {
            flex-direction: column;
            padding: 10px;
            gap: 8px;
          }
          .metadata-item {
            margin-bottom: 5px;
          }
          .metric-card {
            padding: 15px;
          }
          .metric-card h3 {
            font-size: 14px;
          }
          .metric-row {
            font-size: 12px;
            padding: 6px 0;
          }
          .metric-label {
            font-size: 12px;
          }
          .metric-value {
            font-size: 14px;
          }
          .summary-grid {
            grid-template-columns: 1fr;
          }
          .summary-item-value {
            font-size: 16px;
          }
          .footer {
            font-size: 10px;
            padding-top: 15px;
            margin-top: 20px;
          }
        }
        @media (max-width: 480px) {
          .container {
            padding: 8px;
          }
          .header h1 {
            font-size: 16px;
          }
          .metric-card {
            padding: 12px;
          }
          .metric-card h3 {
            font-size: 12px;
            margin-bottom: 10px;
          }
          .metric-row {
            font-size: 11px;
            padding: 4px 0;
            flex-wrap: wrap;
          }
          .metric-label {
            font-size: 11px;
            flex: 1 100%;
          }
          .metric-value {
            font-size: 12px;
            width: 100%;
            text-align: left;
            margin-top: 3px;
          }
          .summary-item {
            padding: 10px;
          }
          .summary-item-value {
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Reporte del Sistema MediLink+</h1>
          <p>Reporte Integral de Métricas del Negocio</p>
        </div>

        <div class="metadata">
          <div class="metadata-item">
            <span class="metadata-label">Fecha de Generación:</span>
            <span>${fechaGen}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Período:</span>
            <span>${periodo}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Generado por:</span>
            <span>Sistema MediLink+</span>
          </div>
        </div>

        <div class="metric-grid">
          <!-- Métrica 1: Usuarios -->
          <div class="metric-card">
            <h3>👥 Usuarios Registrados</h3>
            <div class="metric-row">
              <span class="metric-label">Total de Usuarios Activos:</span>
              <span class="metric-value">${usuarios?.total || 0}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Pacientes:</span>
              <span class="metric-value">${usuarios?.pacientes || 0}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Médicos:</span>
              <span class="metric-value">${usuarios?.medicos || 0}</span>
            </div>
          </div>

          <!-- Métrica 2: Citas -->
          <div class="metric-card">
            <h3>📅 Citas Médicas</h3>
            <div class="metric-row">
              <span class="metric-label">Total de Citas:</span>
              <span class="metric-value">${citas?.total || 0}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Completadas:</span>
              <span class="metric-value">${citas?.completadas || 0}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Pendientes:</span>
              <span class="metric-value">${citas?.pendientes || 0}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Tasa de Completación:</span>
              <span class="metric-value percentage">${citas?.tasa_completacion || 0}%</span>
            </div>
          </div>

          <!-- Métrica 3: Recetas -->
          <div class="metric-card">
            <h3>💊 Recetas Electrónicas</h3>
            <div class="metric-row">
              <span class="metric-label">Total de Recetas:</span>
              <span class="metric-value">${recetas?.total || 0}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Dispensadas:</span>
              <span class="metric-value">${recetas?.dispensadas || 0}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Tasa de Dispensación:</span>
              <span class="metric-value percentage">${recetas?.tasa_dispensacion || 0}%</span>
            </div>
          </div>

          <!-- Métrica 4: Transacciones -->
          <div class="metric-card">
            <h3>💰 Transacciones de Medicamentos</h3>
            <div class="metric-row">
              <span class="metric-label">Total de Transacciones:</span>
              <span class="metric-value">${transacciones?.total_transacciones || 0}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Ingresos Totales:</span>
              <span class="metric-value">S/ ${transacciones?.ingresos_totales?.toFixed(2) || "0.00"}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Ingreso Promedio:</span>
              <span class="metric-value">S/ ${transacciones?.ingreso_promedio || "0.00"}</span>
            </div>
          </div>

          <!-- Métrica 5: Satisfacción -->
          <div class="metric-card">
            <h3>⭐ Satisfacción de Pacientes</h3>
            <div class="metric-row">
              <span class="metric-label">Calificación Promedio:</span>
              <span class="metric-value">${satisfaccion?.promedio?.toFixed(1) || "0.0"} / 5.0</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Total de Evaluaciones:</span>
              <span class="metric-value">${satisfaccion?.evaluaciones_totales || 0}</span>
            </div>
          </div>
        </div>

        <div class="summary">
          <h3>📈 Resumen Ejecutivo</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-item-label">Sistema Activo</div>
              <div class="summary-item-value">${usuarios?.total || 0} Usuarios</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">Actividad Médica</div>
              <div class="summary-item-value">${citas?.total || 0} Citas</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">Medicamentos</div>
              <div class="summary-item-value">S/ ${transacciones?.ingresos_totales?.toFixed(0) || "0"}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-label">Satisfacción</div>
              <div class="summary-item-value">${satisfaccion?.promedio?.toFixed(1) || "0"}★</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Este reporte fue generado automáticamente por el Sistema MediLink+</p>
          <p>Para más información, contacte al administrador del sistema</p>
        </div>
      </div>
    </body>
    </html>
  `
}
