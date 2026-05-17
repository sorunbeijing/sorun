import { z } from "zod";
import { ProficiencyLevel } from "@prisma/client";

export const saveInterestsSchema = z.object({
  tagIds: z.array(z.string().min(1)).min(1, "请至少选择一个兴趣"),
  primaryTagId: z.string().optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  level: z.nativeEnum(ProficiencyLevel).optional(),
});

export type SaveInterestsInput = z.infer<typeof saveInterestsSchema>;
