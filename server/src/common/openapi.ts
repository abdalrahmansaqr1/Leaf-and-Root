import type { ApiResponseSchemaHost } from "@nestjs/swagger";
import { z, type ZodType } from "zod";

export type OpenApiSchema = ApiResponseSchemaHost["schema"];

/** Derives an OpenAPI-compatible JSON Schema from a Zod schema so docs cannot drift from validation. */
export function toOpenApiSchema(schema: ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
  }) as Record<string, unknown>;
  return rest;
}

export const userOpenApiSchema: OpenApiSchema = {
  type: "object",
  required: ["id", "email", "name", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    name: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

export const userEnvelopeOpenApiSchema: OpenApiSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: {
      type: "object",
      required: ["user"],
      properties: { user: userOpenApiSchema },
    },
  },
};

/** Returned instead of a cookie when the client asks for `X-Auth-Transport: bearer`. */
export const bearerEnvelopeOpenApiSchema: OpenApiSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: {
      type: "object",
      required: ["user", "token", "expiresAt"],
      properties: {
        user: userOpenApiSchema,
        token: { type: "string", description: "Opaque session token; send as `Authorization: Bearer`." },
        expiresAt: { type: "string", format: "date-time" },
      },
    },
  },
};

export const errorOpenApiSchema: OpenApiSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: { type: "string", example: "VALIDATION_ERROR" },
        message: { type: "string" },
        details: {},
      },
    },
  },
};
