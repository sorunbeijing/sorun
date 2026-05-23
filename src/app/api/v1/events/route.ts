export const dynamic = "force-dynamic";
import { LearningEventType, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";

const eventSchema = z.object({
  eventType: z.nativeEnum(LearningEventType),
  payload: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = await request.json();
    const data = eventSchema.parse(body);

    const event = await prisma.learningEvent.create({
      data: {
        userId: user.id,
        eventType: data.eventType,
        payloadJson: (data.payload ?? {}) as Prisma.InputJsonValue,
      },
    });

    return success(event);
  } catch (error) {
    return handleApiError(error);
  }
}
