import { z } from "zod";
import { requiredEmail } from "./common";

export const loginSchema = z.object({
  email: requiredEmail,
  password: z.string().min(1, "Informe a senha"),
  redirectTo: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
