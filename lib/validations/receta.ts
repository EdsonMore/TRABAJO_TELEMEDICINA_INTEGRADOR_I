// lib/validations/receta.ts
import { z } from "zod";

export const RecetaSchema = z.object({
  id_cita: z.number().int().positive("ID de cita inválido"),
  diagnostico: z
    .string()
    .min(1, "El diagnóstico es requerido")
    .max(1000, "El diagnóstico no puede exceder 1000 caracteres"),
  codigo_enfermedad_id: z.number().int().positive().optional().nullable(),
  observaciones_generales: z
    .string()
    .max(2000, "Las observaciones no pueden exceder 2000 caracteres")
    .optional()
    .default(""),
  medicamentos: z
    .array(
      z.object({
        id_medicamento: z.number().int().positive().optional().nullable(),
        nombre_medicamento: z
          .string()
          .min(1, "El nombre del medicamento es requerido")
          .max(200, "El nombre no puede exceder 200 caracteres"),
        dosis: z
          .string()
          .min(1, "La dosis es requerida")
          .max(100, "La dosis no puede exceder 100 caracteres"),
        frecuencia: z
          .string()
          .min(1, "La frecuencia es requerida")
          .max(100, "La frecuencia no puede exceder 100 caracteres"),
        duracion_dias: z
          .number()
          .int("La duración debe ser un número entero")
          .positive("La duración debe ser positiva")
          .min(1, "La duración mínima es 1 día")
          .max(365, "La duración máxima es 365 días"),
        instrucciones_especiales: z
          .string()
          .max(500, "Las instrucciones no pueden exceder 500 caracteres")
          .optional()
          .default(""),
        cantidad: z
          .number()
          .int("La cantidad debe ser un número entero")
          .positive("La cantidad debe ser positiva")
          .min(1, "La cantidad mínima es 1")
          .max(1000, "La cantidad máxima es 1000"),
      })
    )
    .min(1, "Debe agregar al menos un medicamento")
    .max(20, "Máximo 20 medicamentos por receta"),
});

export const RecetaQuerySchema = z.object({
  estado: z
    .enum(["pendiente", "completada", "expirada", "todas"])
    .optional()
    .default("todas"),
  page: z
    .string()
    .regex(/^\d+$/, "La página debe ser un número")
    .transform(Number)
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/, "El límite debe ser un número")
    .transform(Number)
    .default("10"),
});

export type RecetaInput = z.infer<typeof RecetaSchema>;
export type RecetaQuery = z.infer<typeof RecetaQuerySchema>;
