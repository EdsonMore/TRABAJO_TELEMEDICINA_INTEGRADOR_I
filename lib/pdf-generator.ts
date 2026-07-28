// lib/pdf-generator.ts
// Generador profesional de PDF para historial médico del paciente

import jsPDF from "jspdf";

// Función auxiliar para formatear fechas
export function formatFechaES(fechaStr: string): string {
  if (!fechaStr) return "-";
  try {
    const date = new Date(fechaStr);
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "-";
  }
}

// Función auxiliar para calcular IMC
export function calcularIMC(peso: number | undefined, altura: number | undefined): string {
  if (!peso || !altura) return "-";
  const imc = peso / ((altura / 100) ** 2);
  return imc.toFixed(1);
}

// Función para generar el PDF profesional del historial médico
export function generarPDFHistorial(historial: any): Buffer {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 15;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // ==================== FUNCIONES AUXILIARES ====================
    const addPage = () => {
      pdf.addPage();
      currentY = margin;
      // Agregar header en cada página
      pdf.setFontSize(8);
      pdf.setFont("", "normal");
      pdf.text(
        "MediLink+ - Sistema de Gestión Médica | " +
        historial.paciente.usuario.nombre + " " + historial.paciente.usuario.apellido,
        margin,
        10
      );
      pdf.text(
        "DNI: " + historial.paciente.informacion_personal.dni,
        pageWidth - margin - 30,
        10
      );
      
      // Línea separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, 12, pageWidth - margin, 12);
    };

    const checkPageBreak = (requiredSpace: number = 25) => {
      if (currentY + requiredSpace > pageHeight - margin - 10) {
        addPage();
      }
    };

    const addTitle = (text: string, size: number = 16) => {
      pdf.setFontSize(size);
      pdf.setFont("", "bold");
      pdf.setTextColor(25, 85, 169); // Azul profesional
      pdf.text(text, margin, currentY);
      currentY += size / 2.2;
      pdf.setTextColor(0, 0, 0);
    };

    const addSubtitle = (text: string, size: number = 12) => {
      pdf.setFontSize(size);
      pdf.setFont("", "bold");
      pdf.setTextColor(50, 50, 50);
      pdf.text(text, margin, currentY);
      currentY += size / 2.2;
      pdf.setTextColor(0, 0, 0);
    };

    const addSectionHeader = (text: string) => {
      checkPageBreak(10);
      pdf.setFontSize(11);
      pdf.setFont("", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(25, 85, 169); // Azul
      pdf.rect(margin, currentY - 4, contentWidth, 7, "F");
      pdf.text(text, margin + 3, currentY);
      currentY += 8;
      pdf.setTextColor(0, 0, 0);
    };

    const addText = (text: string, size: number = 10) => {
      pdf.setFontSize(size);
      pdf.setFont("", "normal");
      const lines = pdf.splitTextToSize(text, contentWidth);
      pdf.text(lines, margin, currentY);
      currentY += (lines.length * size) / 2.2;
    };

    const addKeyValue = (label: string, value: string) => {
      pdf.setFontSize(10);
      pdf.setFont("", "bold");
      pdf.text(label + ":", margin, currentY);
      pdf.setFont("", "normal");
      const lines = pdf.splitTextToSize(value || "-", contentWidth - 60);
      pdf.text(lines, margin + 60, currentY);
      currentY += Math.max(5, (lines.length - 1) * 4 + 5);
    };

    const addInfoBox = (items: Array<{ label: string; value: string }>) => {
      pdf.setFillColor(240, 240, 240);
      const boxHeight = items.length * 7 + 4;
      pdf.rect(margin, currentY - 3, contentWidth, boxHeight, "F");

      pdf.setFontSize(9);
      items.forEach((item) => {
        pdf.setFont("", "bold");
        pdf.text(item.label + ":", margin + 3, currentY);
        pdf.setFont("", "normal");
        pdf.text(item.value || "-", margin + 45, currentY);
        currentY += 7;
      });
    };

    // ==================== PORTADA ====================
    currentY = pageHeight / 4;
    pdf.setFillColor(25, 85, 169);
    pdf.rect(0, 0, pageWidth, pageHeight / 5, "F");

    pdf.setFontSize(24);
    pdf.setFont("", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text("HISTORIAL MÉDICO COMPLETO", margin, currentY);
    
    currentY += 15;
    pdf.setFontSize(14);
    pdf.text(
      historial.paciente.usuario.nombre + " " + historial.paciente.usuario.apellido,
      margin,
      currentY
    );
    currentY += 10;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    currentY = pageHeight / 2;
    addKeyValue("DNI", historial.paciente.informacion_personal.dni);
    currentY += 5;
    addKeyValue("Edad", historial.paciente.informacion_personal.edad + " años");
    currentY += 5;
    addKeyValue("Sexo", historial.paciente.informacion_personal.sexo || "-");
    currentY += 5;
    addKeyValue("Email", historial.paciente.usuario.email);
    currentY += 5;
    addKeyValue("Teléfono", historial.paciente.usuario.telefono || "-");

    currentY = pageHeight - 40;
    pdf.setFontSize(9);
    pdf.setFont("", "normal");
    pdf.text("Generado: " + new Date().toLocaleDateString("es-PE") + " a las " + 
             new Date().toLocaleTimeString("es-PE"), margin, currentY);
    pdf.text("Sistema MediLink+ v1.0", pageWidth - margin - 40, currentY);

    // ==================== PÁGINA 2: INFORMACIÓN PERSONAL ====================
    addPage();
    addTitle("1. INFORMACIÓN PERSONAL Y DE CONTACTO");
    currentY += 5;

    addSectionHeader("Datos Personales");
    addInfoBox([
      { label: "Nombre Completo", value: historial.paciente.usuario.nombre + " " + historial.paciente.usuario.apellido },
      { label: "DNI", value: historial.paciente.informacion_personal.dni },
      { label: "Edad", value: historial.paciente.informacion_personal.edad + " años" },
      { label: "Sexo", value: historial.paciente.informacion_personal.sexo || "-" },
    ]);

    currentY += 5;
    addSectionHeader("Información de Contacto");
    addInfoBox([
      { label: "Email", value: historial.paciente.usuario.email },
      { label: "Teléfono", value: historial.paciente.usuario.telefono || "-" },
      { label: "Dirección", value: historial.paciente.informacion_personal.direccion || "-" },
      { label: "Ubicación", value: (historial.paciente.informacion_personal.ubicacion?.distrito || "-") + 
                               ", " + (historial.paciente.informacion_personal.ubicacion?.provincia || "-") },
    ]);

    // ==================== INFORMACIÓN MÉDICA ====================
    checkPageBreak(50);
    addSectionHeader("INFORMACIÓN MÉDICA");
    
    addSubtitle("Medidas Antropométricas");
    addInfoBox([
      { label: "Peso", value: (historial.paciente.informacion_medica.peso_kg || "-") + " kg" },
      { label: "Altura", value: (historial.paciente.informacion_medica.altura_cm || "-") + " cm" },
      { label: "IMC", value: calcularIMC(
          historial.paciente.informacion_medica.peso_kg,
          historial.paciente.informacion_medica.altura_cm
        ) },
    ]);

    currentY += 5;
    addSubtitle("Antecedentes Médicos");
    addInfoBox([
      { label: "Tipo de Sangre", value: historial.paciente.informacion_personal.tipo_sangre || "-" },
      { label: "Alergias", value: historial.paciente.informacion_medica.alergias || "No reportadas" },
      { label: "Enfermedades Crónicas", value: historial.paciente.informacion_medica.enfermedades_cronicas || "Ninguna" },
    ]);

    if (historial.paciente.informacion_medica.seguro_medico) {
      currentY += 5;
      addSubtitle("Cobertura Médica");
      addInfoBox([
        { label: "Aseguradora", value: historial.paciente.informacion_medica.seguro_medico },
        { label: "Nº de Póliza", value: historial.paciente.informacion_medica.numero_seguro || "-" },
      ]);
    }

    // ==================== HISTORIAL DE CITAS ====================
    addPage();
    addTitle("2. HISTORIAL DE CITAS MÉDICAS");
    currentY += 5;

    if (historial.historial_citas.length === 0) {
      pdf.setFontSize(10);
      pdf.setFont("", "normal");
      pdf.text("No hay citas registradas en el sistema.", margin, currentY);
      currentY += 10;
    } else {
      historial.historial_citas.forEach((cita: any, index: number) => {
        checkPageBreak(40);

        addSubtitle(`Cita #${index + 1}`);
        
        const colorEstado = cita.estado === "completada" ? [34, 197, 94] : [239, 68, 68] as [number, number, number];
        pdf.setFillColor(colorEstado[0], colorEstado[1], colorEstado[2]);
        pdf.rect(margin, currentY - 4, 30, 6, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont("", "bold");
        pdf.text(cita.estado.toUpperCase(), margin + 2, currentY + 0.5);
        pdf.setTextColor(0, 0, 0);
        currentY += 8;

        addInfoBox([
          { label: "Tipo de Cita", value: cita.tipo_cita.charAt(0).toUpperCase() + cita.tipo_cita.slice(1) },
          { label: "Fecha", value: formatFechaES(cita.fecha_cita) },
          { label: "Hora", value: cita.hora_cita || "-" },
          { label: "Médico", value: cita.medico.nombre + " " + cita.medico.apellido + " (" + cita.medico.especialidad + ")" },
          { label: "Motivo de la Consulta", value: cita.motivo_consulta },
        ]);

        if (cita.diagnostico) {
          currentY += 3;
          addSubtitle("Diagnóstico", 10);
          addText(cita.diagnostico, 9);
        }

        if (cita.tratamiento) {
          currentY += 3;
          addSubtitle("Tratamiento Recomendado", 10);
          addText(cita.tratamiento, 9);
        }

        if (cita.observaciones_medico) {
          currentY += 3;
          addSubtitle("Observaciones", 10);
          addText(cita.observaciones_medico, 9);
        }

        if (cita.costo) {
          currentY += 3;
          pdf.setFontSize(10);
          pdf.setFont("", "bold");
          pdf.text("Costo de la Consulta: S/ " + Number(cita.costo).toFixed(2), margin, currentY);
          currentY += 5;
        }

        currentY += 5;
      });
    }

    // ==================== RECETAS MÉDICAS ====================
    addPage();
    addTitle("3. RECETAS MÉDICAS");
    currentY += 5;

    if (historial.recetas.length === 0) {
      pdf.setFontSize(10);
      pdf.setFont("", "normal");
      pdf.text("No hay recetas registradas en el sistema.", margin, currentY);
      currentY += 10;
    } else {
      historial.recetas.forEach((receta: any, index: number) => {
        checkPageBreak(50);

        addSubtitle(`Receta #${index + 1} - ${receta.codigo_receta}`);

        addInfoBox([
          { label: "Código", value: receta.codigo_receta },
          { label: "Emitida", value: formatFechaES(receta.fecha_emision) },
          { label: "Vencimiento", value: formatFechaES(receta.fecha_vencimiento) },
          { label: "Estado", value: receta.estado.toUpperCase() },
          { label: "Médico", value: receta.medico.nombre + " " + receta.medico.apellido },
        ]);

        // Medicamentos con detalles
        if (receta.medicamentos && receta.medicamentos.length > 0) {
          currentY += 5;
          addSubtitle("Medicamentos Prescritos", 10);

          receta.medicamentos.forEach((med: any, medIndex: number) => {
            checkPageBreak(15);

            pdf.setFontSize(9);
            pdf.setFont("", "bold");
            pdf.setTextColor(25, 85, 169);
            pdf.text(`${medIndex + 1}. ${med.nombre_comercial || med.nombre_generico || "Medicamento"}`, 
                     margin + 3, currentY);
            currentY += 5;

            pdf.setTextColor(0, 0, 0);
            pdf.setFont("", "normal");
            pdf.setFontSize(8);

            const medicamentoInfo = [];
            if (med.nombre_generico) medicamentoInfo.push({ label: "Genérico", value: med.nombre_generico });
            if (med.concentracion) medicamentoInfo.push({ label: "Concentración", value: med.concentracion });
            if (med.laboratorio) medicamentoInfo.push({ label: "Laboratorio", value: med.laboratorio });
            medicamentoInfo.push({ label: "Dosis", value: med.dosis || "-" });
            medicamentoInfo.push({ label: "Frecuencia", value: med.frecuencia || "-" });
            medicamentoInfo.push({ label: "Cantidad", value: (med.cantidad || "-") + " unidades" });
            if (med.duracion_dias) medicamentoInfo.push({ label: "Duración", value: med.duracion_dias + " días" });
            if (med.via_administracion) medicamentoInfo.push({ label: "Vía", value: med.via_administracion });
            if (med.instrucciones_especiales) medicamentoInfo.push({ label: "Instrucciones", value: med.instrucciones_especiales });

            // Mostrar en 2 columnas
            const mid = Math.ceil(medicamentoInfo.length / 2);
            for (let i = 0; i < mid; i++) {
              const info1 = medicamentoInfo[i];
              const info2 = medicamentoInfo[mid + i];

              pdf.setFont("", "bold");
              pdf.text(info1.label + ":", margin + 5, currentY);
              pdf.setFont("", "normal");
              pdf.text(info1.value, margin + 35, currentY);

              if (info2) {
                pdf.setFont("", "bold");
                pdf.text(info2.label + ":", margin + contentWidth / 2 + 5, currentY);
                pdf.setFont("", "normal");
                pdf.text(info2.value, margin + contentWidth / 2 + 35, currentY);
              }

              currentY += 4;
            }

            currentY += 2;
          });
        }

        currentY += 3;
      });
    }

    // ==================== EXÁMENES DE LABORATORIO ====================
    addPage();
    addTitle("4. EXÁMENES DE LABORATORIO");
    currentY += 5;

    if (historial.examenes_laboratorio.length === 0) {
      pdf.setFontSize(10);
      pdf.setFont("", "normal");
      pdf.text("No hay exámenes de laboratorio registrados en el sistema.", margin, currentY);
      currentY += 10;
    } else {
      historial.examenes_laboratorio.forEach((examen: any, index: number) => {
        checkPageBreak(25);

        addSubtitle(`Examen #${index + 1}`);

        addInfoBox([
          { label: "Código de Solicitud", value: examen.codigo_solicitud },
          { label: "Fecha de Solicitud", value: formatFechaES(examen.fecha_solicitud) },
          { label: "Estado", value: examen.estado.toUpperCase() },
          { label: "Laboratorio", value: examen.laboratorio || "-" },
          { label: "Médico Solicitante", value: examen.medico.nombre + " " + examen.medico.apellido },
        ]);

        currentY += 5;
      });
    }

    // ==================== PÁGINA FINAL: NOTAS IMPORTANTES ====================
    addPage();
    addTitle("NOTAS IMPORTANTES Y RECOMENDACIONES");
    currentY += 10;

    pdf.setFillColor(255, 248, 225); // Amarillo pálido
    pdf.rect(margin, currentY - 3, contentWidth, 50, "F");

    pdf.setFontSize(10);
    pdf.setFont("", "bold");
    pdf.setTextColor(156, 74, 10);
    pdf.text("⚠️ AVISO DE CONFIDENCIALIDAD:", margin + 3, currentY);
    
    currentY += 6;
    pdf.setFont("", "normal");
    pdf.setTextColor(0, 0, 0);
    const confidencialidad = pdf.splitTextToSize(
      "Este documento contiene información médica confidencial y de carácter personal. " +
      "Solo debe ser accesible al paciente y a los profesionales de salud autorizados. " +
      "Se prohíbe su reproducción, distribución o uso sin consentimiento expreso del paciente.",
      contentWidth - 6
    );
    pdf.text(confidencialidad, margin + 3, currentY);

    currentY += 35;
    
    // Secciones finales
    addSubtitle("Recomendaciones Médicas");
    addText("• Seguir todas las indicaciones de los médicos tratantes");
    addText("• Completar los tratamientos prescritos según lo indicado");
    addText("• Realizar los exámenes de seguimiento en las fechas programadas");
    addText("• Reportar cualquier síntoma o complicación al médico");

    currentY += 5;
    pdf.setFontSize(8);
    pdf.setFont("", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      "Documento generado electrónicamente por MediLink+ - " + 
      new Date().toLocaleDateString("es-PE") + " - Válido solo con firma electrónica",
      margin,
      pageHeight - 10
    );

    // Retornar buffer del PDF
    return Buffer.from(pdf.output("arraybuffer"));
  } catch (error) {
    console.error("Error generando PDF:", error);
    throw new Error("No se pudo generar el PDF del historial");
  }
}
