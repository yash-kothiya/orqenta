import { z } from "zod";
import { PermissionError } from "./auth/permissions";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Use as `someAction(input).then(unwrap)` so TanStack Query sees a rejected promise. */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

/**
 * A failure the user is meant to read — "already exists", "still referenced".
 * `runAction` turns it into an `ok: false` result; anything else thrown is a
 * bug and keeps travelling.
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

/**
 * §6.1 — actions return their failures. Next replaces a thrown error with a
 * generic message in production, which would strip every permission and
 * validation message the pages in §10 are specified to show.
 *
 * Unknown errors are rethrown on purpose: `redirect()` and `notFound()` travel
 * as thrown errors, and swallowing them would break navigation.
 */
export async function runAction<T>(
  body: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await body() };
  } catch (error) {
    if (error instanceof ActionError || error instanceof PermissionError) {
      return { ok: false, error: error.message };
    }

    if (error instanceof z.ZodError) {
      const { formErrors, fieldErrors } = z.flattenError(error);
      return {
        ok: false,
        error: formErrors[0] ?? "Please correct the highlighted fields.",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    throw error;
  }
}
