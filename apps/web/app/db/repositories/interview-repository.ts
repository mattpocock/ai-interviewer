import { Effect, Layer, Option } from "effect";
import { eq, sql } from "drizzle-orm";
import { InterviewRepository } from "@ai-interviewer/shared";
import type { Interview } from "@ai-interviewer/shared";
import { interviews } from "../schema";
import { DatabaseService } from "./database-service";

function rowToInterview(row: typeof interviews.$inferSelect): Interview {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const InterviewRepositoryLive = Layer.effect(
  InterviewRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService;

    return {
      findById: (id) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db.select().from(interviews).where(eq(interviews.id, id));
            return Option.fromNullable(result[0] ? rowToInterview(result[0]) : null);
          },
          catch: () => Option.none<Interview>(),
        }).pipe(Effect.orElse(() => Effect.succeed(Option.none<Interview>()))),

      findByUserId: (userId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db.select().from(interviews).where(eq(interviews.userId, userId));
            return result.map(rowToInterview);
          },
          catch: () => [] as Interview[],
        }).pipe(Effect.orElse(() => Effect.succeed([] as Interview[]))),

      create: (data) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .insert(interviews)
              .values({
                userId: data.userId,
                title: data.title,
                description: data.description,
              })
              .returning();
            return rowToInterview(result[0]!);
          },
          catch: (error) => {
            throw new Error(`Failed to create interview: ${error}`);
          },
        }),

      update: (id, data) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .update(interviews)
              .set({
                ...data,
                updatedAt: sql`now()`,
              })
              .where(eq(interviews.id, id))
              .returning();
            return Option.fromNullable(result[0] ? rowToInterview(result[0]) : null);
          },
          catch: () => Option.none<Interview>(),
        }).pipe(Effect.orElse(() => Effect.succeed(Option.none<Interview>()))),

      delete: (id) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db.delete(interviews).where(eq(interviews.id, id)).returning();
            return result.length > 0;
          },
          catch: () => false,
        }).pipe(Effect.orElse(() => Effect.succeed(false))),
    };
  })
);
