import { Effect, Layer } from "effect";
import { eq, asc } from "drizzle-orm";
import { MessageRepository } from "@ai-interviewer/shared";
import type { Message, MessageRole } from "@ai-interviewer/shared";
import { messages } from "../schema";
import { DatabaseService } from "./database-service";

function rowToMessage(row: typeof messages.$inferSelect): Message {
  return {
    id: row.id,
    takeId: row.takeId,
    role: row.role as MessageRole,
    content: row.content,
    enabledDocumentIds: row.enabledDocumentIds,
    createdAt: row.createdAt,
  };
}

export const MessageRepositoryLive = Layer.effect(
  MessageRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService;

    return {
      findByTakeId: (takeId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .select()
              .from(messages)
              .where(eq(messages.takeId, takeId))
              .orderBy(asc(messages.createdAt));
            return result.map(rowToMessage);
          },
          catch: () => [] as Message[],
        }).pipe(Effect.orElse(() => Effect.succeed([] as Message[]))),

      create: (data) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .insert(messages)
              .values({
                takeId: data.takeId,
                role: data.role,
                content: data.content,
                enabledDocumentIds: data.enabledDocumentIds,
              })
              .returning();
            return rowToMessage(result[0]!);
          },
          catch: (error) => {
            throw new Error(`Failed to create message: ${error}`);
          },
        }),
    };
  })
);
