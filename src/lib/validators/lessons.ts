import { z } from "zod";

export const progressSchema = z.object({
  progressPercent: z.number().min(0).max(100),
  currentStep: z.number().min(0).optional(),
});

export const quizSubmitSchema = z.object({
  lessonId: z.string().min(1),
  answers: z.record(z.string(), z.number()),
});

export type ProgressInput = z.infer<typeof progressSchema>;
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;
