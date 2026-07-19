import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  email: z
    .string()
    .trim()
    .email("Ingresa un correo electrónico válido")
    .max(255, "El correo es demasiado largo"),
  phone: z
    .string()
    .trim()
    .min(6, "El teléfono debe tener al menos 6 dígitos")
    .max(20, "El teléfono es demasiado largo")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .max(1000, "El mensaje es demasiado largo")
    .optional()
    .or(z.literal("")),
});

export const brochureSchema = z.object({
  email: z.string().trim().email("Ingresa un correo electrónico válido"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type BrochureFormData = z.infer<typeof brochureSchema>;
