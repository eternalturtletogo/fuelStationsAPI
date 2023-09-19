import { RequestHandler } from "express";
import { z } from "zod";

interface ZodProblem<E extends number> {
  type: string;
  status: E;
  title: string;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
  issues: { path: (string | number)[]; message: string }[];
}

/**
 * Parse request body with a given Zod schema.
 * If parse fails, respond with a {@link ZodProblem} describing the issues.
 * Does _not_ parse the request body as JSON; use e.g. {@link json} for that.
 * @param input Zod schema or Zod object shape
 * @returns Zod parser request handler
 */
export function validateBody<Z extends z.ZodTypeAny | z.ZodRawShape>(
  input: Z,
): RequestHandler {
  const schema = input instanceof z.ZodType ? input : z.object(input).strict();
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .type("application/json")
          .json(zodProblem(err));
      }
      return next(err);
    }
  };
}

export function validateParams<Z extends z.ZodTypeAny | z.ZodRawShape>(
  input: Z,
): RequestHandler {
  const schema = input instanceof z.ZodType ? input : z.object(input).strict();
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      return next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .type("application/json")
          .json(zodProblem(err));
      }
      return next(err);
    }
  };
}

const zodProblem = (err: z.ZodError): ZodProblem<400> => ({
  type: "INVALID_REQUEST_BODY",
  status: 400,
  title: "Invalid request body.",
  detail: "Validation of request body failed.",
  issues: err.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  })),
});
