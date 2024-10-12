import { z } from "zod";

export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().positive(),
  itemsPerPage: z.coerce.number().int().positive(),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;
