import { describe, it, expect } from "vitest";
import { Effect, Layer, Exit } from "effect";
import { MessageService, MessageServiceLive } from "./message-service.js";
import { TakeService, TakeServiceLive } from "./take-service.js";
import { InterviewService, InterviewServiceLive } from "./interview-service.js";
import {
  InterviewRepositoryMock,
  TakeRepositoryMock,
  DocumentRepositoryMock,
  MessageRepositoryMock,
} from "../testing/mock-repositories.js";
import { TakeNotFoundError, UnauthorizedError } from "../errors.js";

const RepositoryLayer = Layer.mergeAll(
  InterviewRepositoryMock,
  TakeRepositoryMock,
  DocumentRepositoryMock,
  MessageRepositoryMock
);

const TestLayer = Layer.provide(
  Layer.mergeAll(MessageServiceLive, TakeServiceLive, InterviewServiceLive),
  RepositoryLayer
);

type TestServices = MessageService | TakeService | InterviewService;

const runTest = <A, E>(effect: Effect.Effect<A, E, TestServices>) =>
  Effect.runPromise(Effect.provide(effect, TestLayer));

const runTestExit = <A, E>(effect: Effect.Effect<A, E, TestServices>) =>
  Effect.runPromise(Effect.exit(Effect.provide(effect, TestLayer)));

describe("MessageService", () => {
  describe("create", () => {
    it("should create a message for a take the user owns", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;
          const messageService = yield* MessageService;

          const interview = yield* interviewService.create({
            userId: "user-1",
            title: "My Interview",
            description: null,
          });

          const take = yield* takeService.create(interview.id, "user-1");

          return yield* messageService.create(
            take.id,
            "user-1",
            "user",
            "Hello, this is my first message",
            []
          );
        })
      );

      expect(result.id).toBeDefined();
      expect(result.role).toBe("user");
      expect(result.content).toBe("Hello, this is my first message");
      expect(result.enabledDocumentIds).toEqual([]);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("should create a message with enabled document IDs", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;
          const messageService = yield* MessageService;

          const interview = yield* interviewService.create({
            userId: "user-1",
            title: "My Interview",
            description: null,
          });

          const take = yield* takeService.create(interview.id, "user-1");

          return yield* messageService.create(
            take.id,
            "user-1",
            "user",
            "Message with docs",
            ["doc-1", "doc-2"]
          );
        })
      );

      expect(result.enabledDocumentIds).toEqual(["doc-1", "doc-2"]);
    });

    it("should create assistant messages", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;
          const messageService = yield* MessageService;

          const interview = yield* interviewService.create({
            userId: "user-1",
            title: "My Interview",
            description: null,
          });

          const take = yield* takeService.create(interview.id, "user-1");

          return yield* messageService.create(
            take.id,
            "user-1",
            "assistant",
            "I am the AI assistant",
            []
          );
        })
      );

      expect(result.role).toBe("assistant");
    });

    it("should fail with TakeNotFoundError when take does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const messageService = yield* MessageService;

          return yield* messageService.create(
            "non-existent-take",
            "user-1",
            "user",
            "Hello",
            []
          );
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(TakeNotFoundError);
        }
      }
    });

    it("should fail with UnauthorizedError when user does not own parent interview", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;
          const messageService = yield* MessageService;

          const interview = yield* interviewService.create({
            userId: "user-1",
            title: "My Interview",
            description: null,
          });

          const take = yield* takeService.create(interview.id, "user-1");

          return yield* messageService.create(
            take.id,
            "user-2", // Different user
            "user",
            "Hello",
            []
          );
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(UnauthorizedError);
        }
      }
    });
  });

  describe("listByTake", () => {
    it("should return empty array when take has no messages", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;
          const messageService = yield* MessageService;

          const interview = yield* interviewService.create({
            userId: "user-1",
            title: "My Interview",
            description: null,
          });

          const take = yield* takeService.create(interview.id, "user-1");

          return yield* messageService.listByTake(take.id, "user-1");
        })
      );

      expect(result).toEqual([]);
    });

    it("should return all messages belonging to the take in order", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;
          const messageService = yield* MessageService;

          const interview = yield* interviewService.create({
            userId: "user-1",
            title: "My Interview",
            description: null,
          });

          const take = yield* takeService.create(interview.id, "user-1");

          yield* messageService.create(
            take.id,
            "user-1",
            "user",
            "First message",
            []
          );
          yield* messageService.create(
            take.id,
            "user-1",
            "assistant",
            "Second message",
            []
          );
          yield* messageService.create(
            take.id,
            "user-1",
            "user",
            "Third message",
            []
          );

          return yield* messageService.listByTake(take.id, "user-1");
        })
      );

      expect(result).toHaveLength(3);
      expect(result[0].content).toBe("First message");
      expect(result[1].content).toBe("Second message");
      expect(result[2].content).toBe("Third message");
    });

    it("should not return messages from other takes", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;
          const messageService = yield* MessageService;

          const interview = yield* interviewService.create({
            userId: "user-1",
            title: "My Interview",
            description: null,
          });

          const take1 = yield* takeService.create(interview.id, "user-1");
          const take2 = yield* takeService.create(interview.id, "user-1");

          yield* messageService.create(
            take1.id,
            "user-1",
            "user",
            "Take 1 message",
            []
          );
          yield* messageService.create(
            take2.id,
            "user-1",
            "user",
            "Take 2 message",
            []
          );

          return yield* messageService.listByTake(take1.id, "user-1");
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Take 1 message");
    });

    it("should fail with TakeNotFoundError when take does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const messageService = yield* MessageService;

          return yield* messageService.listByTake(
            "non-existent-take",
            "user-1"
          );
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(TakeNotFoundError);
        }
      }
    });

    it("should fail with UnauthorizedError when user does not own parent interview", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;
          const messageService = yield* MessageService;

          const interview = yield* interviewService.create({
            userId: "user-1",
            title: "My Interview",
            description: null,
          });

          const take = yield* takeService.create(interview.id, "user-1");

          return yield* messageService.listByTake(
            take.id,
            "user-2" // Different user
          );
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(UnauthorizedError);
        }
      }
    });
  });
});
