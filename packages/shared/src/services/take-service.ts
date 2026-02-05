import { Context, Effect, Layer, Option } from "effect";
import type { Take, TakeStage } from "../index.js";
import { InterviewRepository, TakeRepository } from "../repository.js";
import {
  TakeNotFoundError,
  InterviewNotFoundError,
  UnauthorizedError,
} from "../errors.js";

export interface TakeService {
  readonly getById: (
    id: string,
    userId: string
  ) => Effect.Effect<
    Take,
    TakeNotFoundError | InterviewNotFoundError | UnauthorizedError
  >;
  readonly listByInterview: (
    interviewId: string,
    userId: string
  ) => Effect.Effect<Take[], InterviewNotFoundError | UnauthorizedError>;
  readonly create: (
    interviewId: string,
    userId: string
  ) => Effect.Effect<Take, InterviewNotFoundError | UnauthorizedError>;
  readonly updateStage: (
    id: string,
    userId: string,
    stage: TakeStage
  ) => Effect.Effect<
    Take,
    TakeNotFoundError | InterviewNotFoundError | UnauthorizedError
  >;
}

export const TakeService = Context.GenericTag<TakeService>("TakeService");

export const TakeServiceLive = Layer.effect(
  TakeService,
  Effect.gen(function* () {
    const interviewRepo = yield* InterviewRepository;
    const takeRepo = yield* TakeRepository;

    const verifyInterviewAccess = (interviewId: string, userId: string) =>
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
      getById: (id, userId) =>
        Effect.gen(function* () {
          const maybeTake = yield* takeRepo.findById(id);

          if (Option.isNone(maybeTake)) {
            return yield* Effect.fail(new TakeNotFoundError({ takeId: id }));
          }

          const take = maybeTake.value;

          // Verify user has access to the parent interview
          yield* verifyInterviewAccess(take.interviewId, userId);

          return take;
        }),

      listByInterview: (interviewId, userId) =>
        Effect.gen(function* () {
          // Verify user has access to the interview
          yield* verifyInterviewAccess(interviewId, userId);

          return yield* takeRepo.findByInterviewId(interviewId);
        }),

      create: (interviewId, userId) =>
        Effect.gen(function* () {
          // Verify user has access to the interview
          yield* verifyInterviewAccess(interviewId, userId);

          return yield* takeRepo.create({
            interviewId,
            stage: "pre-interview",
          });
        }),

      updateStage: (id, userId, stage) =>
        Effect.gen(function* () {
          const maybeTake = yield* takeRepo.findById(id);

          if (Option.isNone(maybeTake)) {
            return yield* Effect.fail(new TakeNotFoundError({ takeId: id }));
          }

          // Verify user has access to the parent interview
          yield* verifyInterviewAccess(maybeTake.value.interviewId, userId);

          const updated = yield* takeRepo.updateStage(id, stage);

          if (Option.isNone(updated)) {
            return yield* Effect.fail(new TakeNotFoundError({ takeId: id }));
          }

          return updated.value;
        }),
    };
  })
);
