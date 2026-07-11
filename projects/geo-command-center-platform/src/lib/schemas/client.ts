import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(2),
  websiteUrl: z.string().url(),
  industry: z.string().min(2).optional().nullable(),
  regions: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();

