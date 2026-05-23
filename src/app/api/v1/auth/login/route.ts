export const dynamic = "force-dynamic";
import { LearningEventType } from "@prisma/client";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);
    const email = data.email.toLowerCase();

    try {
      await signIn("credentials", {
        email,
        password: data.password,
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError && error.type === "CredentialsSignin") {
        return fail(ErrorCode.UNAUTHORIZED, "\u90ae\u7bb1\u6216\u5bc6\u7801\u9519\u8bef");
      }
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return fail(ErrorCode.UNAUTHORIZED, "\u90ae\u7bb1\u6216\u5bc6\u7801\u9519\u8bef");
    }

    await prisma.learningEvent.create({
      data: {
        userId: user.id,
        eventType: LearningEventType.LOGIN,
        payloadJson: { email },
      },
    });

    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
