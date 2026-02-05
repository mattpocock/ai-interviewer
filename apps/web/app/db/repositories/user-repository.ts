import { Effect, Layer, Option } from "effect";
import { eq } from "drizzle-orm";
import { UserRepository } from "@ai-interviewer/shared";
import type { User } from "@ai-interviewer/shared";
import { users } from "../schema";
import { DatabaseService } from "./database-service";

function rowToUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    googleId: row.googleId,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
  };
}

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService;

    return {
      findById: (id) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .select()
              .from(users)
              .where(eq(users.id, id));
            return Option.fromNullable(result[0] ? rowToUser(result[0]) : null);
          },
          catch: () => Option.none<User>(),
        }).pipe(Effect.orElse(() => Effect.succeed(Option.none<User>()))),

      findByGoogleId: (googleId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .select()
              .from(users)
              .where(eq(users.googleId, googleId));
            return Option.fromNullable(result[0] ? rowToUser(result[0]) : null);
          },
          catch: () => Option.none<User>(),
        }).pipe(Effect.orElse(() => Effect.succeed(Option.none<User>()))),

      create: (data) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .insert(users)
              .values({
                googleId: data.googleId,
                email: data.email,
                name: data.name,
                avatarUrl: data.avatarUrl,
              })
              .returning();
            return rowToUser(result[0]!);
          },
          catch: (error) => {
            throw new Error(`Failed to create user: ${error}`);
          },
        }),
    };
  })
);
