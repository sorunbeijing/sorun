import bcrypt from "bcryptjs";
import { LearningEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { success, handleApiError } from "@/lib/api-response";
import { AppError, ErrorCode } from "@/lib/errors";
import { registerSchema } from "@/lib/validators/auth";
import { defaultExpiresAt } from "@/lib/user-expiry";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(ErrorCode.CONFLICT, "该邮箱已注册");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: data.name,
        expiresAt: defaultExpiresAt(),
        profile: {
          create: {
            displayName: data.name ?? email.split("@")[0],
          },
        },
      },
      include: { profile: true },
    });

    await prisma.learningEvent.create({
      data: {
        userId: user.id,
        eventType: LearningEventType.REGISTER,
        payloadJson: { email },
      },
    });

    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      profile: user.profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
