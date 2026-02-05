import { Context, Effect, Layer, Option } from "effect";
import type { Interview } from "../index.js";
import { InterviewRepository, DocumentRepository } from "../repository.js";
import { InterviewNotFoundError, UnauthorizedError } from "../errors.js";

export interface InterviewService {
  readonly getById: (
    id: string,
    userId: string
  ) => Effect.Effect<Interview, InterviewNotFoundError | UnauthorizedError>;
  readonly listByUser: (userId: string) => Effect.Effect<Interview[]>;
  readonly create: (
    userId: string,
    title: string,
    description: string | null
  ) => Effect.Effect<Interview>;
  readonly update: (
    id: string,
    userId: string,
    data: { title?: string; description?: string | null }
  ) => Effect.Effect<Interview, InterviewNotFoundError | UnauthorizedError>;
  readonly delete: (
    id: string,
    userId: string
  ) => Effect.Effect<void, InterviewNotFoundError | UnauthorizedError>;
}

export const InterviewService =
  Context.GenericTag<InterviewService>("InterviewService");

export const InterviewServiceLive = Layer.effect(
  InterviewService,
  Effect.gen(function* () {
    const interviewRepo = yield* InterviewRepository;
    const documentRepo = yield* DocumentRepository;

    return {
      getById: (id, userId) =>
        Effect.gen(function* () {
          const maybeInterview = yield* interviewRepo.findById(id);

          if (Option.isNone(maybeInterview)) {
            return yield* Effect.fail(
              new InterviewNotFoundError({ interviewId: id })
            );
          }

          const interview = maybeInterview.value;

          if (interview.userId !== userId) {
            return yield* Effect.fail(
              new UnauthorizedError({
                message: "You do not have access to this interview",
              })
            );
          }

          return interview;
        }),

      listByUser: (userId) => interviewRepo.findByUserId(userId),

      create: (userId, title, description) =>
        interviewRepo.create({ userId, title, description }),

      update: (id, userId, data) =>
        Effect.gen(function* () {
          const maybeInterview = yield* interviewRepo.findById(id);

          if (Option.isNone(maybeInterview)) {
            return yield* Effect.fail(
              new InterviewNotFoundError({ interviewId: id })
            );
          }

          if (maybeInterview.value.userId !== userId) {
            return yield* Effect.fail(
              new UnauthorizedError({
                message: "You do not have access to this interview",
              })
            );
          }

          const updated = yield* interviewRepo.update(id, data);

          if (Option.isNone(updated)) {
            return yield* Effect.fail(
              new InterviewNotFoundError({ interviewId: id })
            );
          }

          return updated.value;
        }),

      delete: (id, userId) =>
        Effect.gen(function* () {
          const maybeInterview = yield* interviewRepo.findById(id);

          if (Option.isNone(maybeInterview)) {
            return yield* Effect.fail(
              new InterviewNotFoundError({ interviewId: id })
            );
          }

          if (maybeInterview.value.userId !== userId) {
            return yield* Effect.fail(
              new UnauthorizedError({
                message: "You do not have access to this interview",
              })
            );
          }

          // Delete all documents associated with this interview first
          const documents = yield* documentRepo.findByInterviewId(id);
          for (const doc of documents) {
            yield* documentRepo.delete(doc.id);
          }

          yield* interviewRepo.delete(id);
        }),
    };
  })
);
