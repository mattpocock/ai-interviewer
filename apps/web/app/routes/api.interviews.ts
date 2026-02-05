import { Effect, Exit } from "effect";
import { InterviewService } from "@ai-interviewer/shared";
import { requireAuth } from "~/auth/require-auth.server";
import { AppLayer } from "~/db/repositories";
import type { Route } from "./+types/api.interviews";

/**
 * GET /api/interviews - List all interviews for the authenticated user
 */
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);

  const program = Effect.gen(function* () {
    const service = yield* InterviewService;
    return yield* service.listByUser(user.userId);
  });

  const exit = await Effect.runPromiseExit(Effect.provide(program, AppLayer));

  if (Exit.isFailure(exit)) {
    return Response.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }

  return Response.json({ interviews: exit.value });
}

/**
 * POST /api/interviews - Create a new interview
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await requireAuth(request);

  let body: { title?: string; description?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.title || typeof body.title !== "string") {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const program = Effect.gen(function* () {
    const service = yield* InterviewService;
    return yield* service.create(
      user.userId,
      body.title!,
      body.description ?? null
    );
  });

  const exit = await Effect.runPromiseExit(Effect.provide(program, AppLayer));

  if (Exit.isFailure(exit)) {
    return Response.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }

  return Response.json({ interview: exit.value }, { status: 201 });
}
