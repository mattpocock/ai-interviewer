import { describe, it, expect } from "vitest";
import { Effect, Layer, Exit } from "effect";
import { TakeService, TakeServiceLive } from "./take-service.js";
import { InterviewService, InterviewServiceLive } from "./interview-service.js";
import {
  InterviewRepositoryMock,
  TakeRepositoryMock,
  DocumentRepositoryMock,
} from "../testing/mock-repositories.js";
import {
  TakeNotFoundError,
  InterviewNotFoundError,
  UnauthorizedError,
} from "../errors.js";

const RepositoryLayer = Layer.mergeAll(
  InterviewRepositoryMock,
  TakeRepositoryMock,
  DocumentRepositoryMock
);

const TestLayer = Layer.provide(
  Layer.merge(TakeServiceLive, InterviewServiceLive),
  RepositoryLayer
);

type TestServices = TakeService | InterviewService;

const runTest = <A, E>(effect: Effect.Effect<A, E, TestServices>) =>
  Effect.runPromise(Effect.provide(effect, TestLayer));

const runTestExit = <A, E>(effect: Effect.Effect<A, E, TestServices>) =>
  Effect.runPromise(Effect.exit(Effect.provide(effect, TestLayer)));

describe("TakeService", () => {
  describe("create", () => {
    it("should create a take for an interview the user owns", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          return yield* takeService.create(interview.id, "user-1");
        })
      );

      expect(result.id).toBeDefined();
      expect(result.stage).toBe("pre-interview");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should fail with InterviewNotFoundError when interview does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const takeService = yield* TakeService;

          return yield* takeService.create(
            "non-existent-interview",
            "user-1"
          );
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(InterviewNotFoundError);
        }
      }
    });

    it("should fail with UnauthorizedError when user does not own interview", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          return yield* takeService.create(
            interview.id,
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

  describe("listByInterview", () => {
    it("should return empty array when interview has no takes", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          return yield* takeService.listByInterview(interview.id, "user-1");
        })
      );

      expect(result).toEqual([]);
    });

    it("should return all takes belonging to the interview", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          yield* takeService.create(interview.id, "user-1");
          yield* takeService.create(interview.id, "user-1");

          return yield* takeService.listByInterview(interview.id, "user-1");
        })
      );

      expect(result).toHaveLength(2);
    });

    it("should fail with InterviewNotFoundError when interview does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const takeService = yield* TakeService;

          return yield* takeService.listByInterview(
            "non-existent-interview",
            "user-1"
          );
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(InterviewNotFoundError);
        }
      }
    });

    it("should fail with UnauthorizedError when user does not own interview", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          return yield* takeService.listByInterview(
            interview.id,
            "user-2" // Different user
          );
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(UnauthorizedError);
        }
      }
    });
  });

  describe("getById", () => {
    it("should return take when user owns parent interview", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const take = yield* takeService.create(interview.id, "user-1");

          return yield* takeService.getById(take.id, "user-1");
        })
      );

      expect(result.stage).toBe("pre-interview");
    });

    it("should fail with TakeNotFoundError when take does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const takeService = yield* TakeService;

          return yield* takeService.getById("non-existent-take", "user-1");
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(TakeNotFoundError);
          expect((error.error as TakeNotFoundError).takeId).toBe(
            "non-existent-take"
          );
        }
      }
    });

    it("should fail with UnauthorizedError when user does not own parent interview", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const take = yield* takeService.create(interview.id, "user-1");

          return yield* takeService.getById(take.id, "user-2");
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(UnauthorizedError);
        }
      }
    });
  });

  describe("updateStage", () => {
    it("should update take stage from pre-interview to interview", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const takeService = yield* TakeService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const take = yield* takeService.create(interview.id, "user-1");
          expect(take.stage).toBe("pre-interview");

          return yield* takeService.updateStage(take.id, "user-1", "interview");
        })
      );

      expect(result.stage).toBe("interview");
    });

    it("should fail with TakeNotFoundError when take does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const takeService = yield* TakeService;

          return yield* takeService.updateStage(
            "non-existent-take",
            "user-1",
            "interview"
          );
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
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

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const take = yield* takeService.create(interview.id, "user-1");

          return yield* takeService.updateStage(
            take.id,
            "user-2", // Different user
            "interview"
          );
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(UnauthorizedError);
        }
      }
    });
  });
});
