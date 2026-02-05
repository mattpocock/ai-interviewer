import { Effect, Layer, Option } from "effect";
import { eq, sql } from "drizzle-orm";
import { TakeRepository } from "@ai-interviewer/shared";
import type { Take, TakeStage } from "@ai-interviewer/shared";
import { takes } from "../schema";
import { DatabaseService } from "./database-service";

function rowToTake(row: typeof takes.$inferSelect): Take {
  return {
    id: row.id,
    interviewId: row.interviewId,
    stage: row.stage as TakeStage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const TakeRepositoryLive = Layer.effect(
  TakeRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService;

    return {
      findById: (id) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db.select().from(takes).where(eq(takes.id, id));
            return Option.fromNullable(result[0] ? rowToTake(result[0]) : null);
          },
          catch: () => Option.none<Take>(),
        }).pipe(Effect.orElse(() => Effect.succeed(Option.none<Take>()))),

      findByInterviewId: (interviewId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db.select().from(takes).where(eq(takes.interviewId, interviewId));
            return result.map(rowToTake);
          },
          catch: () => [] as Take[],
        }).pipe(Effect.orElse(() => Effect.succeed([] as Take[]))),

      create: (data) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .insert(takes)
              .values({
                interviewId: data.interviewId,
                stage: data.stage,
              })
              .returning();
            return rowToTake(result[0]!);
          },
          catch: (error) => {
            throw new Error(`Failed to create take: ${error}`);
          },
        }),

      updateStage: (id, stage) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .update(takes)
              .set({
                stage,
                updatedAt: sql`now()`,
              })
              .where(eq(takes.id, id))
              .returning();
            return Option.fromNullable(result[0] ? rowToTake(result[0]) : null);
          },
          catch: () => Option.none<Take>(),
        }).pipe(Effect.orElse(() => Effect.succeed(Option.none<Take>()))),
    };
  })
);
