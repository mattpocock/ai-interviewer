import { Effect, Exit, Cause } from "effect";
import {
  TakeService,
  InterviewNotFoundError,
  UnauthorizedError,
} from "@ai-interviewer/shared";
import { requireAuth } from "~/auth/require-auth.server";
import { AppLayer } from "~/db/repositories";
import type { Route } from "./+types/api.interviews.$id.takes";

/**
 * GET /api/interviews/:id/takes - List all takes for an interview
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { id: interviewId } = params;

  const program = Effect.gen(function* () {
    const service = yield* TakeService;
    return yield* service.listByInterview({
      interviewId,
      userId: user.userId,
    });
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
    return Response.json({ error: "Failed to fetch takes" }, { status: 500 });
  }

  return Response.json({ takes: exit.value });
}

/**
 * POST /api/interviews/:id/takes - Create a new take for an interview
 */
export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await requireAuth(request);
  const { id: interviewId } = params;

  const program = Effect.gen(function* () {
    const service = yield* TakeService;
    return yield* service.create({
      interviewId,
      userId: user.userId,
    });
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
    return Response.json({ error: "Failed to create take" }, { status: 500 });
  }

  return Response.json({ take: exit.value }, { status: 201 });
}
