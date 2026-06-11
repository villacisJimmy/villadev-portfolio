import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  subject: z.enum(["proyecto", "consultoria", "colaboracion", "otro"]),
  message: z.string().trim().min(20).max(2000),
  hp: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;
