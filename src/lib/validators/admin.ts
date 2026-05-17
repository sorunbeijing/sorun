import { z } from "zod";
import { ProficiencyLevel } from "@prisma/client";

export const patchUserExpireSchema = z.object({
  expiresAt: z.union([z.string().min(1), z.null()]),
});

export const adminLessonSchema = z.object({
  slug: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  baseLevel: z.nativeEnum(ProficiencyLevel),
  durationMinutes: z.number().int().min(1).max(300),
  difficulty: z.number().int().min(1).max(10),
  contentJson: z.record(z.unknown()),
  quizJson: z.record(z.unknown()),
  isActive: z.boolean().optional(),
});

export const adminInterestTagSchema = z.object({
  slug: z.string().min(1).max(50),
  nameZh: z.string().min(1),
  nameJa: z.string().min(1),
  category: z.string().min(1),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
