import { Effect, Exit, Cause } from "effect";
import {
  DocumentService,
  DocumentNotFoundError,
  InterviewNotFoundError,
  UnauthorizedError,
} from "@ai-interviewer/shared";
import { requireAuth } from "~/auth/require-auth.server";
import { AppLayer } from "~/db/repositories";
import type { Route } from "./+types/api.documents.$id";

/**
 * GET /api/documents/:id - Get a single document by ID
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const { id } = params;

  const program = Effect.gen(function* () {
    const service = yield* DocumentService;
    return yield* service.getById(id, user.userId);
  });

  const exit = await Effect.runPromiseExit(Effect.provide(program, AppLayer));

  if (Exit.isFailure(exit)) {
    const cause = exit.cause;
    if (Cause.isFailType(cause)) {
      const error = cause.error;
      if (error instanceof DocumentNotFoundError) {
        return Response.json({ error: "Document not found" }, { status: 404 });
      }
      if (error instanceof InterviewNotFoundError) {
        return Response.json({ error: "Interview not found" }, { status: 404 });
      }
      if (error instanceof UnauthorizedError) {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    return Response.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }

  return Response.json({ document: exit.value });
}

/**
 * PATCH /api/documents/:id - Update a document
 * DELETE /api/documents/:id - Delete a document
 */
export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const { id } = params;

  if (request.method === "PATCH") {
    let body: { title?: string; content?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const program = Effect.gen(function* () {
      const service = yield* DocumentService;
      return yield* service.update(id, user.userId, body);
    });

    const exit = await Effect.runPromiseExit(Effect.provide(program, AppLayer));

    if (Exit.isFailure(exit)) {
      const cause = exit.cause;
      if (Cause.isFailType(cause)) {
        const error = cause.error;
        if (error instanceof DocumentNotFoundError) {
          return Response.json(
            { error: "Document not found" },
            { status: 404 }
          );
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
      return Response.json(
        { error: "Failed to update document" },
        { status: 500 }
      );
    }

    return Response.json({ document: exit.value });
  }

  if (request.method === "DELETE") {
    const program = Effect.gen(function* () {
      const service = yield* DocumentService;
      return yield* service.delete(id, user.userId);
    });

    const exit = await Effect.runPromiseExit(Effect.provide(program, AppLayer));

    if (Exit.isFailure(exit)) {
      const cause = exit.cause;
      if (Cause.isFailType(cause)) {
        const error = cause.error;
        if (error instanceof DocumentNotFoundError) {
          return Response.json(
            { error: "Document not found" },
            { status: 404 }
          );
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
      return Response.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
