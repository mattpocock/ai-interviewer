import { Effect, Layer, Option } from "effect";
import { eq, sql } from "drizzle-orm";
import { DocumentRepository } from "@ai-interviewer/shared";
import type { Document } from "@ai-interviewer/shared";
import { documents } from "../schema";
import { DatabaseService } from "./database-service";

function rowToDocument(row: typeof documents.$inferSelect): Document {
  return {
    id: row.id,
    interviewId: row.interviewId,
    title: row.title,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const DocumentRepositoryLive = Layer.effect(
  DocumentRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService;

    return {
      findById: (id) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .select()
              .from(documents)
              .where(eq(documents.id, id));
            return Option.fromNullable(
              result[0] ? rowToDocument(result[0]) : null
            );
          },
          catch: () => Option.none<Document>(),
        }).pipe(Effect.orElse(() => Effect.succeed(Option.none<Document>()))),

      findByInterviewId: (interviewId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .select()
              .from(documents)
              .where(eq(documents.interviewId, interviewId));
            return result.map(rowToDocument);
          },
          catch: () => [] as Document[],
        }).pipe(Effect.orElse(() => Effect.succeed([] as Document[]))),

      create: (data) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .insert(documents)
              .values({
                interviewId: data.interviewId,
                title: data.title,
                content: data.content,
              })
              .returning();
            return rowToDocument(result[0]!);
          },
          catch: (error) => {
            throw new Error(`Failed to create document: ${error}`);
          },
        }),

      update: (id, data) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .update(documents)
              .set({
                ...data,
                updatedAt: sql`now()`,
              })
              .where(eq(documents.id, id))
              .returning();
            return Option.fromNullable(
              result[0] ? rowToDocument(result[0]) : null
            );
          },
          catch: () => Option.none<Document>(),
        }).pipe(Effect.orElse(() => Effect.succeed(Option.none<Document>()))),

      delete: (id) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .delete(documents)
              .where(eq(documents.id, id))
              .returning();
            return result.length > 0;
          },
          catch: () => false,
        }).pipe(Effect.orElse(() => Effect.succeed(false))),
    };
  })
);
