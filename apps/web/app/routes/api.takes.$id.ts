import { Effect, Exit, Cause } from "effect";
import {
  TakeService,
  TakeNotFoundError,
  InterviewNotFoundError,
  UnauthorizedError,
  type TakeStage,
} from "@ai-interviewer/shared";
import { requireAuth } from "~/auth/require-auth.server";
import { AppLayer } from "~/db/repositories";
import type { Route } from "./+types/api.takes.$id";

/**
 * GET /api/takes/:id - Get a single take by ID
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { id } = params;

  const program = Effect.gen(function* () {
    const service = yield* TakeService;
    return yield* service.getById(id, user.userId);
  });

  const exit = await Effect.runPromiseExit(Effect.provide(program, AppLayer));

  if (Exit.isFailure(exit)) {
    const cause = exit.cause;
    if (Cause.isFailType(cause)) {
      const error = cause.error;
      if (error instanceof TakeNotFoundError) {
        return Response.json({ error: "Take not found" }, { status: 404 });
      }
      if (error instanceof InterviewNotFoundError) {
        return Response.json({ error: "Interview not found" }, { status: 404 });
      }
      if (error instanceof UnauthorizedError) {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    return Response.json({ error: "Failed to fetch take" }, { status: 500 });
  }

  return Response.json({ take: exit.value });
}

/**
 * PATCH /api/takes/:id - Update take stage (pre-interview -> interview)
 */
export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const { id } = params;

  if (request.method === "PATCH") {
    let body: { stage?: TakeStage };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.stage) {
      return Response.json({ error: "Stage is required" }, { status: 400 });
    }

    if (body.stage !== "pre-interview" && body.stage !== "interview") {
      return Response.json(
        { error: "Stage must be 'pre-interview' or 'interview'" },
        { status: 400 }
      );
    }

    const program = Effect.gen(function* () {
      const service = yield* TakeService;
      return yield* service.updateStage(id, user.userId, body.stage!);
    });

    const exit = await Effect.runPromiseExit(Effect.provide(program, AppLayer));

    if (Exit.isFailure(exit)) {
      const cause = exit.cause;
      if (Cause.isFailType(cause)) {
        const error = cause.error;
        if (error instanceof TakeNotFoundError) {
          return Response.json({ error: "Take not found" }, { status: 404 });
        }
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
      return Response.json({ error: "Failed to update take" }, { status: 500 });
    }

    return Response.json({ take: exit.value });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
