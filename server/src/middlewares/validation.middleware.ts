import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type ValidationTarget = "body" | "query" | "params";

const validate = (
    schema: ZodType,
    target: ValidationTarget
): RequestHandler => {
    return (req, _res, next): void => {
        const result = schema.safeParse(req[target]);

        if (!result.success) {
            next(result.error);
            return;
        }

        req[target] = result.data;
        next();
    };
};

export const validateBody = (schema: ZodType): RequestHandler =>
    validate(schema, "body");

export const validateQuery = (schema: ZodType): RequestHandler =>
    validate(schema, "query");

export const validateParams = (schema: ZodType): RequestHandler =>
    validate(schema, "params");

export default validate;