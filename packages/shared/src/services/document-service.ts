import { Context, Effect, Layer, Option } from "effect";
import type { Document } from "../index.js";
import { InterviewRepository, DocumentRepository } from "../repository.js";
import {
  DocumentNotFoundError,
  InterviewNotFoundError,
  UnauthorizedError,
} from "../errors.js";

export interface DocumentService {
  readonly getById: (params: {
    id: string;
    userId: string;
  }) => Effect.Effect<
    Document,
    DocumentNotFoundError | InterviewNotFoundError | UnauthorizedError
  >;
  readonly listByInterview: (params: {
    interviewId: string;
    userId: string;
  }) => Effect.Effect<Document[], InterviewNotFoundError | UnauthorizedError>;
  readonly create: (params: {
    interviewId: string;
    userId: string;
    title: string;
    content: string;
  }) => Effect.Effect<Document, InterviewNotFoundError | UnauthorizedError>;
  readonly update: (params: {
    id: string;
    userId: string;
    data: { title?: string; content?: string };
  }) => Effect.Effect<
    Document,
    DocumentNotFoundError | InterviewNotFoundError | UnauthorizedError
  >;
  readonly delete: (params: {
    id: string;
    userId: string;
  }) => Effect.Effect<
    void,
    DocumentNotFoundError | InterviewNotFoundError | UnauthorizedError
  >;
}

export const DocumentService =
  Context.GenericTag<DocumentService>("DocumentService");

export const DocumentServiceLive = Layer.effect(
  DocumentService,
  Effect.gen(function* () {
    const interviewRepo = yield* InterviewRepository;
    const documentRepo = yield* DocumentRepository;

    const verifyInterviewAccess = ({
      interviewId,
      userId,
    }: {
      interviewId: string;
      userId: string;
    }) =>
      Effect.gen(function* () {
        const maybeInterview = yield* interviewRepo.findById(interviewId);

        if (Option.isNone(maybeInterview)) {
          return yield* Effect.fail(
            new InterviewNotFoundError({ interviewId })
          );
        }

        if (maybeInterview.value.userId !== userId) {
          return yield* Effect.fail(
            new UnauthorizedError({
              message: "You do not have access to this interview",
            })
          );
        }

        return maybeInterview.value;
      });

    return {
      getById: ({ id, userId }) =>
        Effect.gen(function* () {
          const maybeDocument = yield* documentRepo.findById(id);

          if (Option.isNone(maybeDocument)) {
            return yield* Effect.fail(
              new DocumentNotFoundError({ documentId: id })
            );
          }

          const document = maybeDocument.value;

          // Verify user has access to the parent interview
          yield* verifyInterviewAccess({
            interviewId: document.interviewId,
            userId,
          });

          return document;
        }),

      listByInterview: ({ interviewId, userId }) =>
        Effect.gen(function* () {
          // Verify user has access to the interview
          yield* verifyInterviewAccess({ interviewId, userId });

          return yield* documentRepo.findByInterviewId(interviewId);
        }),

      create: ({ interviewId, userId, title, content }) =>
        Effect.gen(function* () {
          // Verify user has access to the interview
          yield* verifyInterviewAccess({ interviewId, userId });

          return yield* documentRepo.create({ interviewId, title, content });
        }),

      update: ({ id, userId, data }) =>
        Effect.gen(function* () {
          const maybeDocument = yield* documentRepo.findById(id);

          if (Option.isNone(maybeDocument)) {
            return yield* Effect.fail(
              new DocumentNotFoundError({ documentId: id })
            );
          }

          // Verify user has access to the parent interview
          yield* verifyInterviewAccess({
            interviewId: maybeDocument.value.interviewId,
            userId,
          });

          const updated = yield* documentRepo.update(id, data);

          if (Option.isNone(updated)) {
            return yield* Effect.fail(
              new DocumentNotFoundError({ documentId: id })
            );
          }

          return updated.value;
        }),

      delete: ({ id, userId }) =>
        Effect.gen(function* () {
          const maybeDocument = yield* documentRepo.findById(id);

          if (Option.isNone(maybeDocument)) {
            return yield* Effect.fail(
              new DocumentNotFoundError({ documentId: id })
            );
          }

          // Verify user has access to the parent interview
          yield* verifyInterviewAccess({
            interviewId: maybeDocument.value.interviewId,
            userId,
          });

          yield* documentRepo.delete(id);
        }),
    };
  })
);
