import { UnprocessableEntityException } from "@nestjs/common";
import type { ZodType } from "zod";

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (result.success) return result.data;

  throw new UnprocessableEntityException({
    code: "VALIDATION_ERROR",
    message: "Invalid request body",
    details: result.error.issues,
  });
}
