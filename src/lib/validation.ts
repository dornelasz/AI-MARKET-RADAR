import { z } from "zod";

export const sourceTypeEnum = z.enum([
  "RSS",
  "ATOM",
  "BLOG",
  "GITHUB_RELEASES",
  "ARXIV",
  "WEBPAGE",
  "OTHER",
]);

export const relevanceEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const createSourceSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(200),
  url: z.string().url("URL inválida"),
  type: sourceTypeEnum.default("RSS"),
  category: z.string().max(100).nullish(),
  isActive: z.boolean().optional(),
  fetchIntervalMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  notes: z.string().max(1000).nullish(),
});

export const updateSourceSchema = z
  .object({
    name: z.string().min(1).max(200),
    url: z.string().url("URL inválida"),
    type: sourceTypeEnum,
    category: z.string().max(100).nullish(),
    isActive: z.boolean(),
    fetchIntervalMinutes: z.coerce.number().int().min(1).max(1440),
    notes: z.string().max(1000).nullish(),
  })
  .partial();

export const createAlertSchema = z
  .object({
    name: z.string().min(1, "Nome obrigatório").max(200),
    keyword: z.string().max(200).nullish(),
    company: z.string().max(200).nullish(),
    category: z.string().max(200).nullish(),
    minRelevance: relevanceEnum.nullish(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      Boolean(value.keyword || value.company || value.category || value.minRelevance),
    {
      message:
        "Defina ao menos um critério: palavra-chave, empresa, categoria ou relevância mínima.",
    },
  );

export const updateAlertSchema = z
  .object({
    name: z.string().min(1).max(200),
    keyword: z.string().max(200).nullish(),
    company: z.string().max(200).nullish(),
    category: z.string().max(200).nullish(),
    minRelevance: relevanceEnum.nullish(),
    isActive: z.boolean(),
  })
  .partial();
