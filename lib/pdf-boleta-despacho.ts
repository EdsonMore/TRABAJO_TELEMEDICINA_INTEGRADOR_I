// lib/pdf-boleta-despacho.ts
// Generador de boletas/comprobantes para despacho de recetas

import { jsPDF } from "jspdf";

interface MedicamentoDespachado {
  medicamento_id: number;
  nombre_comercial: string;
  nombre_generico?: string;
  cantidad_dispensada: number;
  precio_unitario: number;
  subtotal: number;
  lote: string;
  dosis?: string;
  frecuencia?: string;
}

interface DataBoleta {
  numero_boleta: string;
  fecha_despacho: string;
  codigo_receta: string;
  paciente: {
    nombre: string;
    apellido: string;
    dni: string;
    email?: string;
    telefono?: string;
  };
  farmacia: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono?: string;
  };
  medicamentos: MedicamentoDespachado[];
  subtotal: number;
  igv: number;
  total: number;
  tipo_entrega: "recojo" | "domicilio";
  direccion_entrega?: string;
  observaciones?: string;
}

const COLORS = {
  primary: [25, 85, 169] as [number, number, number],
  secondary: [200, 220, 240] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  text: [0, 0, 0] as [number, number, number],
  lightGray: [245, 245, 245] as [number, number, number],
  darkGray: [100, 100, 100] as [number, number, number],
};

const formatFechaES = (fechaStr: string | Date): string => {
  const fecha = typeof fechaStr === "string" ? new Date(fechaStr) : fechaStr;
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
};

export function generarBoletaDespacho(data: DataBoleta, tipo: "farmacia" | "paciente" = "farmacia"): Buffer {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // ==================== HEADER ====================
  // Fondo azul
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(0, 0, pageWidth, 35, "F");

  // Título
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  const titulo = tipo === "farmacia" ? "BOLETA DE DESPACHO" : "NOTA DE VENTA";
  pdf.text(titulo, margin, 15);

  // Subtítulo
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Farmacia: ${data.farmacia.nombre}`, margin, 23);
  pdf.text(`RUC: ${data.farmacia.ruc}`, margin, 28);

  // Número de boleta y fecha a la derecha
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Boleta #: ${data.numero_boleta}`, pageWidth - margin - 60, 15);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Fecha: ${formatFechaES(data.fecha_despacho)}`, pageWidth - margin - 60, 23);

  y = 40;

  // ==================== INFORMACIÓN DEL RECETARIO ====================
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.text("INFORMACIÓN DE LA RECETA", margin, y);
  y += 7;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Código de Receta: ${data.codigo_receta}`, margin, y);
  y += 5;

  // ==================== INFORMACIÓN DEL PACIENTE ====================
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.text("DATOS DEL PACIENTE", margin, y);
  y += 7;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  const nombrePaciente = `${data.paciente.nombre} ${data.paciente.apellido}`;
  pdf.text(`Nombre: ${nombrePaciente}`, margin, y);
  y += 5;
  pdf.text(`DNI: ${data.paciente.dni}`, margin, y);
  y += 5;
  if (data.paciente.email) {
    pdf.text(`Email: ${data.paciente.email}`, margin, y);
    y += 5;
  }
  if (data.paciente.telefono) {
    pdf.text(`Teléfono: ${data.paciente.telefono}`, margin, y);
    y += 5;
  }

  // ==================== TIPO DE ENTREGA ====================
  y += 2;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  const tipoEntrega = data.tipo_entrega === "domicilio" ? "ENTREGA A DOMICILIO" : "RECOJO EN FARMACIA";
  pdf.text(tipoEntrega, margin, y);
  y += 6;

  if (data.tipo_entrega === "domicilio" && data.direccion_entrega) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(`Dirección: ${data.direccion_entrega}`, contentWidth - 10);
    pdf.text(lines, margin, y);
    y += lines.length * 4 + 2;
  }

  y += 5;

  // ==================== TABLA DE MEDICAMENTOS ====================
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.text("MEDICAMENTOS DESPACHADOS", margin, y);
  y += 7;

  // Headers de tabla
  pdf.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  pdf.rect(margin, y - 5, contentWidth, 6, "F");

  pdf.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");

  const colWidths = {
    nombre: contentWidth * 0.35,
    cantidad: contentWidth * 0.12,
    precio: contentWidth * 0.15,
    subtotal: contentWidth * 0.15,
    lote: contentWidth * 0.23,
  };

  let xPos = margin;
  pdf.text("MEDICAMENTO", xPos, y);
  xPos += colWidths.nombre;
  pdf.text("CANT.", xPos, y);
  xPos += colWidths.cantidad;
  pdf.text("P.U.", xPos, y);
  xPos += colWidths.precio;
  pdf.text("SUBTOTAL", xPos, y);
  xPos += colWidths.subtotal;
  pdf.text("LOTE", xPos, y);

  y += 7;

  // Medicamentos
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");

  data.medicamentos.forEach((med) => {
    // Nombre comercial
    xPos = margin;
    const lineas = pdf.splitTextToSize(med.nombre_comercial, colWidths.nombre - 2);
    lineas.forEach((linea: string, idx: number) => {
      pdf.text(linea, xPos, y + idx * 3);
    });
    const lineHeight = lineas.length * 3;

    // Cantidad
    xPos = margin + colWidths.nombre;
    pdf.text(med.cantidad_dispensada.toString(), xPos, y);

    // Precio unitario
    xPos += colWidths.cantidad;
    const precioUnitario = typeof med.precio_unitario === 'string' ? parseFloat(med.precio_unitario) : med.precio_unitario;
    pdf.text(`S/. ${precioUnitario.toFixed(2)}`, xPos, y);

    // Subtotal
    xPos += colWidths.precio;
    const subtotal = typeof med.subtotal === 'string' ? parseFloat(med.subtotal) : med.subtotal;
    pdf.text(`S/. ${subtotal.toFixed(2)}`, xPos, y);

    // Lote
    xPos += colWidths.subtotal;
    pdf.text(med.lote || "-", xPos, y);

    y += Math.max(lineHeight, 4) + 1;

    // Genérico si existe
    if (med.nombre_generico) {
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "italic");
      pdf.text(`${med.nombre_generico}`, margin + 1, y);
      y += 3;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
    }
  });

  y += 3;

  // ==================== TOTALES ====================
  const totalY = y;
  const totalesX = margin + contentWidth - 50;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  // Subtotal
  pdf.text("Subtotal:", totalesX, totalY);
  pdf.setFont("helvetica", "bold");
  const subtotalTotal = typeof data.subtotal === 'string' ? parseFloat(data.subtotal) : data.subtotal;
  pdf.text(`S/. ${subtotalTotal.toFixed(2)}`, totalesX + 30, totalY);

  // IGV
  pdf.setFont("helvetica", "normal");
  pdf.text("IGV (18%):", totalesX, totalY + 6);
  pdf.setFont("helvetica", "bold");
  const igvTotal = typeof data.igv === 'string' ? parseFloat(data.igv) : data.igv;
  pdf.text(`S/. ${igvTotal.toFixed(2)}`, totalesX + 30, totalY + 6);

  // Total
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(totalesX - 5, totalY + 10, 55, 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("TOTAL:", totalesX, totalY + 15);
  const totalFinal = typeof data.total === 'string' ? parseFloat(data.total) : data.total;
  pdf.text(`S/. ${totalFinal.toFixed(2)}`, totalesX + 30, totalY + 15);

  y = totalY + 22;

  // ==================== OBSERVACIONES ====================
  if (data.observaciones) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("Observaciones:", margin, y);
    y += 4;
    const lineas = pdf.splitTextToSize(data.observaciones, contentWidth - 5);
    lineas.forEach((linea: string) => {
      pdf.text(linea, margin + 2, y);
      y += 3;
    });
    y += 2;
  }

  // ==================== FOOTER ====================
  y = pageHeight - 20;

  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  pdf.setFont("helvetica", "normal");

  // Línea separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, y, pageWidth - margin, y);

  y += 3;
  pdf.text(
    `Farmacia: ${data.farmacia.nombre} | RUC: ${data.farmacia.ruc}`,
    margin,
    y
  );
  y += 3;
  pdf.text(
    `Generado: ${new Date().toLocaleDateString("es-PE")} a las ${new Date().toLocaleTimeString("es-PE")}`,
    margin,
    y
  );
  y += 3;
  if (data.farmacia.direccion) {
    pdf.text(`Dirección: ${data.farmacia.direccion}`, margin, y);
  }

  // Aviso de confidencialidad
  y = pageHeight - 8;
  pdf.setFontSize(6);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    "Este documento es un comprobante de transacción. Conserve para sus registros.",
    margin,
    y
  );

  return Buffer.from(pdf.output("arraybuffer"));
}
