import { Effect, Exit, Cause } from "effect";
import {
  DocumentService,
  InterviewNotFoundError,
  UnauthorizedError,
} from "@ai-interviewer/shared";
import { requireAuth } from "~/auth/require-auth.server";
import { AppLayer } from "~/db/repositories";
import type { Route } from "./+types/api.interviews.$id.documents";

/**
 * GET /api/interviews/:id/documents - List all documents for an interview
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { id: interviewId } = params;

  const program = Effect.gen(function* () {
    const service = yield* DocumentService;
    return yield* service.listByInterview(interviewId, user.userId);
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
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }

  return Response.json({ documents: exit.value });
}

/**
 * POST /api/interviews/:id/documents - Create a new document for an interview
 */
export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await requireAuth(request);
  const { id: interviewId } = params;

  let body: { title?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.title || typeof body.title !== "string") {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  if (!body.content || typeof body.content !== "string") {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  const program = Effect.gen(function* () {
    const service = yield* DocumentService;
    return yield* service.create(
      interviewId,
      user.userId,
      body.title!,
      body.content!
    );
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
      { error: "Failed to create document" },
      { status: 500 }
    );
  }

  return Response.json({ document: exit.value }, { status: 201 });
}
