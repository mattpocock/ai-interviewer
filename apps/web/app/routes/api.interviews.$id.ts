import { Effect, Exit, Cause } from "effect";
import {
  InterviewService,
  InterviewNotFoundError,
  UnauthorizedError,
} from "@ai-interviewer/shared";
import { requireAuth } from "~/auth/require-auth.server";
import { AppLayer } from "~/db/repositories";
import type { Route } from "./+types/api.interviews.$id";

/**
 * GET /api/interviews/:id - Get a single interview by ID
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { id } = params;

  const program = Effect.gen(function* () {
    const service = yield* InterviewService;
    return yield* service.getById({ id, userId: user.userId });
  });

  const exit = await Effect.runPromiseExit(Effect.provide(program, AppLayer));

  if (Exit.isFailure(exit)) {
    const cause = exit.cause;
    if (Cause.isFailType(cause)) {
      const error = cause.error;
      if (error instanceof InterviewNotFoundError) {
        return Response.json({ error: "Interview not found" }, { status: 404 });
      }
      if (error instanceof UnauthorizedError) {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    return Response.json(
      { error: "Failed to fetch interview" },
      { status: 500 }
    );
  }

  return Response.json({ interview: exit.value });
}

/**
 * PATCH /api/interviews/:id - Update an interview
 * DELETE /api/interviews/:id - Delete an interview
 */
export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const { id } = params;

  if (request.method === "PATCH") {
    let body: { title?: string; description?: string | null };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const program = Effect.gen(function* () {
      const service = yield* InterviewService;
      return yield* service.update({ id, userId: user.userId, data: body });
    });

    const exit = await Effect.runPromiseExit(Effect.provide(program, AppLayer));

    if (Exit.isFailure(exit)) {
      const cause = exit.cause;
      if (Cause.isFailType(cause)) {
        const error = cause.error;
        if (error instanceof InterviewNotFoundError) {
          return Response.json(
            { error: "Interview not found" },
            { status: 404 }
          );
        }
        if (error instanceof UnauthorizedError) {
          return Response.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
      return Response.json(
        { error: "Failed to update interview" },
        { status: 500 }
      );
    }

    return Response.json({ interview: exit.value });
  }

  if (request.method === "DELETE") {
    const program = Effect.gen(function* () {
      const service = yield* InterviewService;
      return yield* service.delete({ id, userId: user.userId });
    });

    const exit = await Effect.runPromiseExit(Effect.provide(program, AppLayer));

    if (Exit.isFailure(exit)) {
      const cause = exit.cause;
      if (Cause.isFailType(cause)) {
        const error = cause.error;
        if (error instanceof InterviewNotFoundError) {
          return Response.json(
            { error: "Interview not found" },
            { status: 404 }
          );
        }
        if (error instanceof UnauthorizedError) {
          return Response.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
      return Response.json(
        { error: "Failed to delete interview" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
