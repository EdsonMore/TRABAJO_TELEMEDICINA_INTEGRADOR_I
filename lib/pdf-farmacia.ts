import jsPDF from 'jspdf';

export interface AlertaFarmacia {
  id: string;
  nombre_comercial: string;
  nombre_generico: string;
  forma_farmaceutica: string;
  concentracion: string;
  stock_actual: number;
  stock_minimo: number;
  lote: string;
  fecha_vencimiento: string;
  precio_venta: number;
  tipo_alerta: 'agotado' | 'stock_bajo' | 'vencido' | 'por_vencer' | 'normal';
  severidad: 'critical' | 'danger' | 'warning' | 'info' | 'success';
}

export interface ReporteData {
  tipo: 'resumen' | 'ventas' | 'recetas' | 'inventario';
  fechaInicio?: string;
  fechaFin?: string;
  ventas?: any[];
  recetas?: { estadisticas: any[]; resumen: any };
  inventario?: { items: any[]; resumen: any };
  resumen?: any;
}

const COLORS = {
  primary: [41, 128, 185],
  success: [46, 204, 113],
  danger: [231, 76, 60],
  warning: [241, 196, 15],
  info: [52, 152, 219],
  text: [44, 62, 80],
  lightGray: [236, 240, 241],
  darkGray: [149, 165, 166],
};

const formatFechaES = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatMoneda = (monto: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(monto);
};

const addHeader = (pdf: jsPDF, title: string, subtitle?: string) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Fondo gradiente azul
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(0, 0, pageWidth, 35, 'F');

  // Título
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, 15, 20);

  // Subtítulo
  if (subtitle) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(subtitle, 15, 28);
  }

  // Línea separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(0, 35, pageWidth, 35);

  return 35;
};

const addFooter = (pdf: jsPDF, pageNumber: number) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  pdf.text(
    `Generado: ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}`,
    15,
    pageHeight - 10
  );
  pdf.text(`Página ${pageNumber}`, pageWidth - 25, pageHeight - 10);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
};

const drawTable = (
  pdf: jsPDF,
  startY: number,
  headers: string[],
  rows: string[][],
  columnWidths: number[],
  options?: {
    headerFill?: [number, number, number];
    headerTextColor?: [number, number, number];
    headerFontSize?: number;
    bodyFontSize?: number;
    marginLeft?: number;
    marginRight?: number;
  }
): number => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginLeft = options?.marginLeft ?? 15;
  const marginRight = options?.marginRight ?? 15;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const headerFill = options?.headerFill ?? COLORS.primary;
  const headerTextColor = options?.headerTextColor ?? [255, 255, 255];
  const headerFontSize = options?.headerFontSize ?? 9;
  const bodyFontSize = options?.bodyFontSize ?? 8;

  const lineHeight = bodyFontSize * 0.5;

  let y = startY;

  const renderHeader = () => {
    pdf.setFillColor(headerFill[0], headerFill[1], headerFill[2]);
    pdf.setDrawColor(200, 200, 200);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(headerFontSize);

    let x = marginLeft;
    for (let i = 0; i < headers.length; i++) {
      const w = columnWidths[i] || (usableWidth / headers.length);
      pdf.rect(x, y, w, headerFontSize + 6, 'F');
      pdf.setTextColor(headerTextColor[0], headerTextColor[1], headerTextColor[2]);
      const txt = pdf.splitTextToSize(headers[i], w - 4);
      pdf.text(txt, x + 2, y + headerFontSize + 2);
      x += w;
    }
    y += headerFontSize + 8;
  };

  const ensurePage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      pdf.addPage();
      y = addHeader(pdf, '', '');
      y += 8;
      renderHeader();
    }
  };

  // draw header once
  renderHeader();

  // draw rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(bodyFontSize);
  for (const row of rows) {
    let maxLines = 1;
    const cellLines: string[][] = [];
    for (let i = 0; i < row.length; i++) {
      const w = columnWidths[i] || (usableWidth / headers.length);
      const lines = pdf.splitTextToSize(row[i]?.toString() || '', w - 4);
      cellLines.push(lines);
      if (lines.length > maxLines) maxLines = lines.length;
    }

    const neededHeight = maxLines * lineHeight + 6;
    ensurePage(neededHeight);

    let x = marginLeft;
    for (let i = 0; i < row.length; i++) {
      const w = columnWidths[i] || (usableWidth / headers.length);
      // cell background alternate
      if ((rows.indexOf(row) % 2) === 1) {
        pdf.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
        pdf.rect(x, y, w, neededHeight, 'F');
      }
      pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      const lines = cellLines[i];
      for (let li = 0; li < lines.length; li++) {
        pdf.text(lines[li], x + 2, y + 4 + li * lineHeight);
      }
      x += w;
    }

    y += neededHeight;
  }

  return y;
};

export const generarPDFAlertas = (alertas: AlertaFarmacia[], estadisticas: any): Buffer => {
  const pdf = new jsPDF('p', 'mm', 'A4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = addHeader(pdf, '⚠️ REPORTE DE ALERTAS FARMACÉUTICAS', 'Control de Inventario Crítico');

  // Fecha de generación
  pdf.setFontSize(9);
  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFont('helvetica', 'normal');
  yPosition += 10;
  pdf.text(`Fecha de Generación: ${formatFechaES(new Date().toISOString())}`, 15, yPosition);
  yPosition += 8;

  // Estadísticas generales
  const statsData: any[] = [];
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  yPosition += 5;
  pdf.text('RESUMEN DE ALERTAS', 15, yPosition);
  yPosition += 8;

  const stats = [
    ['TIPO', 'CANTIDAD', 'DESCRIPCIÓN'],
    ['🔴 Críticas', estadisticas.critical.toString(), 'Requieren atención inmediata'],
    ['🟠 Peligro', estadisticas.danger.toString(), 'Atención dentro de 24 horas'],
    ['🟡 Advertencia', estadisticas.warning.toString(), 'Revisar en próximos días'],
    ['🔵 Información', estadisticas.info.toString(), 'Para seguimiento'],
  ];

  {
    const headers = stats[0];
    const rows = stats.slice(1) as string[][];
    const colWidths = [40, 30, 90];
    yPosition = drawTable(pdf, yPosition, headers, rows, colWidths) + 10;
  }

  // Detalle de alertas agrupadas
  if (alertas.length > 0) {
    yPosition += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('DETALLE DE ALERTAS', 15, yPosition);
    yPosition += 8;

    const alertasTableData = alertas.map((alerta) => [
      alerta.nombre_comercial,
      alerta.nombre_generico,
      alerta.concentracion,
      `${alerta.stock_actual} / ${alerta.stock_minimo}`,
      formatFechaES(alerta.fecha_vencimiento),
      alerta.lote,
      alerta.tipo_alerta.toUpperCase(),
    ]);

    {
      const headers = ['COMERCIAL', 'GENÉRICO', 'CONCENTRACIÓN', 'STOCK', 'VENCIMIENTO', 'LOTE', 'TIPO ALERTA'];
      const rows = alertasTableData as string[][];
      const colWidths = [25, 20, 20, 18, 20, 18, 25];
      yPosition = drawTable(pdf, yPosition, headers, rows, colWidths);
    }
  }

  // Footer
  addFooter(pdf, 1);

  return Buffer.from(pdf.output('arraybuffer'));
};

export const generarPDFReportes = (reporte: ReporteData): Buffer => {
  const pdf = new jsPDF('p', 'mm', 'A4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let pageNumber = 1;
  let yPosition = addHeader(pdf, '📊 REPORTE DE FARMACÉUTICA', `Tipo: ${reporte.tipo.toUpperCase()}`);

  // Información del período
  pdf.setFontSize(9);
  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFont('helvetica', 'normal');
  yPosition += 10;
  pdf.text(`Fecha de Generación: ${formatFechaES(new Date().toISOString())}`, 15, yPosition);
  yPosition += 6;
  if (reporte.fechaInicio && reporte.fechaFin) {
    pdf.text(`Período: ${formatFechaES(reporte.fechaInicio)} al ${formatFechaES(reporte.fechaFin)}`, 15, yPosition);
    yPosition += 8;
  } else {
    yPosition += 8;
  }

  // RESUMEN
  if (reporte.resumen) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('RESUMEN GENERAL', 15, yPosition);
    yPosition += 7;

    const resumenData = Object.entries(reporte.resumen).map(([key, value]) => [
      key.replace(/_/g, ' ').toUpperCase(),
      typeof value === 'number' ? (key.includes('total') || key.includes('cantidad') ? value.toString() : formatMoneda(value as number)) : value?.toString() || '0',
    ]);

    {
      const headers = ['MÉTRICA', 'VALOR'];
      const rows = resumenData as string[][];
      const colWidths = [80, 90];
      yPosition = drawTable(pdf, yPosition, headers, rows, colWidths) + 10;
    }
  }

  // VENTAS
  if (reporte.ventas && reporte.ventas.length > 0) {
    if (yPosition > 240) {
      pdf.addPage();
      pageNumber++;
      yPosition = addHeader(pdf, '💰 REPORTE DE VENTAS', 'Continuación');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('DETALLE DE VENTAS', 15, yPosition);
    yPosition += 7;

    const ventasData = reporte.ventas.map((venta) => [
      formatFechaES(venta.fecha),
      venta.recetas_dispensadas?.toString() || '0',
      venta.medicamentos_vendidos?.toString() || '0',
      formatMoneda(venta.ingreso_total || 0),
    ]);

    {
      const headers = ['FECHA', 'RECETAS DISPENSADAS', 'MEDICAMENTOS', 'INGRESO TOTAL'];
      const rows = ventasData as string[][];
      const colWidths = [40, 40, 35, 50];
      yPosition = drawTable(pdf, yPosition, headers, rows, colWidths) + 10;
    }
  }

  // RECETAS
  if (reporte.recetas?.estadisticas && reporte.recetas.estadisticas.length > 0) {
    if (yPosition > 240) {
      pdf.addPage();
      pageNumber++;
      yPosition = addHeader(pdf, '📄 REPORTE DE RECETAS', 'Continuación');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('DISTRIBUCIÓN POR ESTADO', 15, yPosition);
    yPosition += 7;

    const recetasData = reporte.recetas.estadisticas.map((stat: any) => [
      stat.estado.toUpperCase(),
      stat.cantidad?.toString() || '0',
      stat.dispensadas?.toString() || '0',
      stat.canceladas?.toString() || '0',
      stat.vencidas?.toString() || '0',
    ]);

    {
      const headers = ['ESTADO', 'TOTAL', 'DISPENSADAS', 'CANCELADAS', 'VENCIDAS'];
      const rows = recetasData as string[][];
      const colWidths = [40, 30, 35, 35, 35];
      yPosition = drawTable(pdf, yPosition, headers, rows, colWidths) + 10;
    }
  }

  // INVENTARIO
  if (reporte.inventario?.items && reporte.inventario.items.length > 0) {
    if (yPosition > 220) {
      pdf.addPage();
      pageNumber++;
      yPosition = addHeader(pdf, '📦 DETALLE DE INVENTARIO', 'Continuación');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('RESUMEN DE INVENTARIO', 15, yPosition);
    yPosition += 7;

    const inventarioSummaryData = [
      ['Total de Items', reporte.inventario.resumen?.total?.toString() || '0'],
      ['Stock Normal', (reporte.inventario.items.filter((i: any) => i.estado === 'normal').length).toString()],
      ['Stock Bajo', (reporte.inventario.items.filter((i: any) => i.estado === 'bajo').length).toString()],
      ['Agotados', (reporte.inventario.items.filter((i: any) => i.estado === 'agotado').length).toString()],
      ['Por Vencer', (reporte.inventario.items.filter((i: any) => i.estado === 'por_vencer').length).toString()],
      ['Valor Total', formatMoneda(reporte.inventario.resumen?.valor_total || 0)],
    ];

    {
      const headers = ['CONCEPTO', 'VALOR'];
      const rows = inventarioSummaryData as string[][];
      const colWidths = [100, 70];
      yPosition = drawTable(pdf, yPosition, headers, rows, colWidths) + 15;
    }

    // Detalle de items críticos
    const itemsCriticos = reporte.inventario.items.filter(
      (i: any) => i.estado === 'agotado' || i.estado === 'bajo' || i.estado === 'por_vencer'
    );

    if (itemsCriticos.length > 0) {
      if (yPosition > 220) {
        pdf.addPage();
        pageNumber++;
        yPosition = addHeader(pdf, '⚠️ ITEMS CRÍTICOS EN INVENTARIO', 'Continuación');
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('DETALLE DE ITEMS CON ALERTA', 15, yPosition);
      yPosition += 7;

      const itemsData = itemsCriticos.map((item: any) => [
        item.nombre_comercial,
        item.concentracion || 'N/A',
        item.stock_actual?.toString() || '0',
        formatMoneda(item.precio_venta || 0),
        formatFechaES(item.fecha_vencimiento),
        item.estado.toUpperCase(),
      ]);

      {
        const headers = ['MEDICAMENTO', 'CONCENTRACIÓN', 'STOCK', 'PRECIO', 'VENCIMIENTO', 'ESTADO'];
        const rows = itemsData as string[][];
        const colWidths = [30, 20, 15, 20, 25, 20];
        yPosition = drawTable(pdf, yPosition, headers, rows, colWidths);
      }
    }
  }

  // Footer en última página
  addFooter(pdf, pageNumber);

  return Buffer.from(pdf.output('arraybuffer'));
};
