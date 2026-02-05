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

          const take = yield* takeService.create({
            interviewId: interview.id,
            userId: "user-1",
          });

          return yield* messageService.create({
            takeId: take.id,
            userId: "user-1",
            role: "user",
            content: "Hello, this is my first message",
            enabledDocumentIds: [],
          });
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

          const take = yield* takeService.create({
            interviewId: interview.id,
            userId: "user-1",
          });

          return yield* messageService.create({
            takeId: take.id,
            userId: "user-1",
            role: "user",
            content: "Message with docs",
            enabledDocumentIds: ["doc-1", "doc-2"],
          });
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

          const take = yield* takeService.create({
            interviewId: interview.id,
            userId: "user-1",
          });

          return yield* messageService.create({
            takeId: take.id,
            userId: "user-1",
            role: "assistant",
            content: "I am the AI assistant",
            enabledDocumentIds: [],
          });
        })
      );

      expect(result.role).toBe("assistant");
    });

    it("should fail with TakeNotFoundError when take does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const messageService = yield* MessageService;

          return yield* messageService.create({
            takeId: "non-existent-take",
            userId: "user-1",
            role: "user",
            content: "Hello",
            enabledDocumentIds: [],
          });
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

          const take = yield* takeService.create({
            interviewId: interview.id,
            userId: "user-1",
          });

          return yield* messageService.create({
            takeId: take.id,
            userId: "user-2", // Different user
            role: "user",
            content: "Hello",
            enabledDocumentIds: [],
          });
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

          const take = yield* takeService.create({
            interviewId: interview.id,
            userId: "user-1",
          });

          return yield* messageService.listByTake({
            takeId: take.id,
            userId: "user-1",
          });
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

          const take = yield* takeService.create({
            interviewId: interview.id,
            userId: "user-1",
          });

          yield* messageService.create({
            takeId: take.id,
            userId: "user-1",
            role: "user",
            content: "First message",
            enabledDocumentIds: [],
          });
          yield* messageService.create({
            takeId: take.id,
            userId: "user-1",
            role: "assistant",
            content: "Second message",
            enabledDocumentIds: [],
          });
          yield* messageService.create({
            takeId: take.id,
            userId: "user-1",
            role: "user",
            content: "Third message",
            enabledDocumentIds: [],
          });

          return yield* messageService.listByTake({
            takeId: take.id,
            userId: "user-1",
          });
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

          const take1 = yield* takeService.create({
            interviewId: interview.id,
            userId: "user-1",
          });
          const take2 = yield* takeService.create({
            interviewId: interview.id,
            userId: "user-1",
          });

          yield* messageService.create({
            takeId: take1.id,
            userId: "user-1",
            role: "user",
            content: "Take 1 message",
            enabledDocumentIds: [],
          });
          yield* messageService.create({
            takeId: take2.id,
            userId: "user-1",
            role: "user",
            content: "Take 2 message",
            enabledDocumentIds: [],
          });

          return yield* messageService.listByTake({
            takeId: take1.id,
            userId: "user-1",
          });
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Take 1 message");
    });

    it("should fail with TakeNotFoundError when take does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const messageService = yield* MessageService;

          return yield* messageService.listByTake({
            takeId: "non-existent-take",
            userId: "user-1",
          });
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

          const take = yield* takeService.create({
            interviewId: interview.id,
            userId: "user-1",
          });

          return yield* messageService.listByTake({
            takeId: take.id,
            userId: "user-2", // Different user
          });
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
