import { Context, Effect, Layer, Option } from "effect";
import type { Message, MessageRole } from "../index.js";
import {
  InterviewRepository,
  TakeRepository,
  MessageRepository,
} from "../repository.js";
import {
  TakeNotFoundError,
  InterviewNotFoundError,
  UnauthorizedError,
} from "../errors.js";

export interface MessageService {
  readonly listByTake: (
    takeId: string,
    userId: string
  ) => Effect.Effect<
    Message[],
    TakeNotFoundError | InterviewNotFoundError | UnauthorizedError
  >;
  readonly create: (
    takeId: string,
    userId: string,
    role: MessageRole,
    content: string,
    enabledDocumentIds: string[]
  ) => Effect.Effect<
    Message,
    TakeNotFoundError | InterviewNotFoundError | UnauthorizedError
  >;
}

export const MessageService =
  Context.GenericTag<MessageService>("MessageService");

export const MessageServiceLive = Layer.effect(
  MessageService,
  Effect.gen(function* () {
    const interviewRepo = yield* InterviewRepository;
    const takeRepo = yield* TakeRepository;
    const messageRepo = yield* MessageRepository;

    const verifyTakeAccess = (takeId: string, userId: string) =>
      Effect.gen(function* () {
        const maybeTake = yield* takeRepo.findById(takeId);

        if (Option.isNone(maybeTake)) {
          return yield* Effect.fail(new TakeNotFoundError({ takeId }));
        }

        const take = maybeTake.value;

        // Verify user has access to the parent interview
        const maybeInterview = yield* interviewRepo.findById(take.interviewId);

        if (Option.isNone(maybeInterview)) {
          return yield* Effect.fail(
            new InterviewNotFoundError({ interviewId: take.interviewId })
          );
        }

        if (maybeInterview.value.userId !== userId) {
          return yield* Effect.fail(
            new UnauthorizedError({
              message: "You do not have access to this take",
            })
          );
        }

        return take;
      });

    return {
      listByTake: (takeId, userId) =>
        Effect.gen(function* () {
          // Verify user has access to the take
          yield* verifyTakeAccess(takeId, userId);

          return yield* messageRepo.findByTakeId(takeId);
        }),

      create: (takeId, userId, role, content, enabledDocumentIds) =>
        Effect.gen(function* () {
          // Verify user has access to the take
          yield* verifyTakeAccess(takeId, userId);

          return yield* messageRepo.create({
            takeId,
            role,
            content,
            enabledDocumentIds,
          });
        }),
    };
  })
);
