export const ErrorCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  FORBIDDEN: 40300,
  ACCOUNT_EXPIRED: 40301,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  VALIDATION: 42200,
  INTERNAL: 50000,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

const errorMessages: Record<number, string> = {
  [ErrorCode.SUCCESS]: "success",
  [ErrorCode.BAD_REQUEST]: "\u8bf7\u6c42\u53c2\u6570\u9519\u8bef",
  [ErrorCode.UNAUTHORIZED]: "\u672a\u767b\u5f55\u6216\u767b\u5f55\u5df2\u8fc7\u671f",
  [ErrorCode.FORBIDDEN]: "\u65e0\u6743\u9650\u8bbf\u95ee",
  [ErrorCode.ACCOUNT_EXPIRED]: "\u8d26\u6237\u5df2\u8fc7\u671f\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u5ef6\u957f\u4f7f\u7528\u671f\u9650",
  [ErrorCode.NOT_FOUND]: "\u8d44\u6e90\u4e0d\u5b58\u5728",
  [ErrorCode.CONFLICT]: "\u8d44\u6e90\u51b2\u7a81",
  [ErrorCode.VALIDATION]: "\u6570\u636e\u6821\u9a8c\u5931\u8d25",
  [ErrorCode.INTERNAL]: "\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef",
};

export class AppError extends Error {
  constructor(
    public code: ErrorCodeValue,
    message?: string,
    public details?: unknown
  ) {
    super(message ?? errorMessages[code] ?? "error");
    this.name = "AppError";
  }
}

export function getErrorMessage(code: number): string {
  return errorMessages[code] ?? "error";
}
