// lib/schemas.ts
import { z } from "zod";

// Schema para parámetros de consulta de recetas
export const RecetaQuerySchema = z.object({
  estado: z.string().optional().default("todas"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Schema para crear recetas
export const RecetaSchema = z.object({
  id_cita: z.string().uuid("ID de cita inválido"),
  diagnostico_principal_id: z.number().int().positive().optional(),
  diagnostico_principal_texto: z
    .string()
    .min(1, "Diagnóstico principal es requerido"),
  diagnosticos_secundarios: z
    .array(
      z.object({
        codigo_cie10_id: z.number().int().positive(),
        observaciones: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  observaciones: z.string().optional(),
  fecha_vencimiento: z.string().optional(),
  medicamentos: z
    .array(
      z.object({
        medicamento_id: z
          .number()
          .int()
          .positive("ID de medicamento requerido"),
        cantidad: z.number().int().positive("Cantidad debe ser mayor a 0"),
        dosis: z.string().min(1, "Dosis es requerida"),
        frecuencia: z.string().min(1, "Frecuencia es requerida"),
        duracion_dias: z
          .number()
          .int()
          .positive("Duración en días es requerida")
          .optional(),
        via_administracion: z.string().optional(),
        instrucciones_especiales: z.string().optional(),
        tratamiento_recomendado_id: z.number().int().positive().optional(),
      })
    )
    .min(1, "Al menos un medicamento es requerido"),
});

// Schema para medicamentos
export const MedicamentoSchema = z.object({
  nombre_comercial: z.string().min(1, "Nombre comercial es requerido"),
  nombre_generico: z.string().min(1, "Nombre genérico es requerido"),
  codigo_digemid: z.string().min(1, "Código DIGEMID es requerido"),
  forma_farmaceutica: z.string().optional(),
  concentracion: z.string().optional(),
  laboratorio: z.string().optional(),
  principio_activo: z.string().optional(),
  categoria_terapeutica: z.string().optional(),
  requiere_receta: z.boolean().default(true),
  contraindicaciones: z.string().optional(),
  efectos_secundarios: z.string().optional(),
});

// Schema para enfermedades (CIE-10)
export const EnfermedadSchema = z.object({
  codigo: z.string().min(1, "Código CIE-10 es requerido"),
  nombre: z.string().min(1, "Nombre es requerido"),
  descripcion: z.string().optional(),
  categoria: z.string().optional(),
  capitulo: z.string().optional(),
});

export type RecetaQueryInput = z.infer<typeof RecetaQuerySchema>;
export type RecetaInput = z.infer<typeof RecetaSchema>;
export type MedicamentoInput = z.infer<typeof MedicamentoSchema>;
export type EnfermedadInput = z.infer<typeof EnfermedadSchema>;
