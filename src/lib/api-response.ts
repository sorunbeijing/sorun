import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, ErrorCode, getErrorMessage } from "@/lib/errors";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export function success<T>(data: T, message = "success"): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    code: ErrorCode.SUCCESS,
    message,
    data,
  });
}

export function fail(
  code: number,
  message?: string,
  data: unknown = null,
  status = 200
): NextResponse<ApiResponse<unknown>> {
  return NextResponse.json(
    {
      code,
      message: message ?? getErrorMessage(code),
      data,
    },
    { status }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<unknown>> {
  if (error instanceof AppError) {
    const status =
      error.code === ErrorCode.UNAUTHORIZED
        ? 401
        : error.code === ErrorCode.FORBIDDEN || error.code === ErrorCode.ACCOUNT_EXPIRED
          ? 403
          : error.code === ErrorCode.NOT_FOUND
            ? 404
            : 200;
    return fail(error.code, error.message, error.details ?? null, status);
  }

  if (error instanceof ZodError) {
    return fail(ErrorCode.VALIDATION, "数据校验失败", error.flatten());
  }

  console.error("[API Error]", error);
  return fail(ErrorCode.INTERNAL, getErrorMessage(ErrorCode.INTERNAL), null, 500);
}
