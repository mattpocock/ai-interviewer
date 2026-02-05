import { describe, it, expect } from "vitest";
import { Effect, Layer, Exit } from "effect";
import { InterviewService, InterviewServiceLive } from "./interview-service.js";
import {
  InterviewRepositoryMock,
  DocumentRepositoryMock,
} from "../testing/mock-repositories.js";
import { InterviewNotFoundError, UnauthorizedError } from "../errors.js";

const TestLayer = Layer.provide(
  InterviewServiceLive,
  Layer.merge(InterviewRepositoryMock, DocumentRepositoryMock)
);

const runTest = <A, E>(effect: Effect.Effect<A, E, InterviewService>) =>
  Effect.runPromise(Effect.provide(effect, TestLayer));

const runTestExit = <A, E>(effect: Effect.Effect<A, E, InterviewService>) =>
  Effect.runPromise(Effect.exit(Effect.provide(effect, TestLayer)));

describe("InterviewService", () => {
  describe("create", () => {
    it("should create an interview with title and description", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          return yield* service.create(
            "user-1",
            "My Interview",
            "A description"
          );
        })
      );

      expect(result.id).toBeDefined();
      expect(result.userId).toBe("user-1");
      expect(result.title).toBe("My Interview");
      expect(result.description).toBe("A description");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should create an interview with null description", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          return yield* service.create("user-1", "My Interview", null);
        })
      );

      expect(result.description).toBeNull();
    });
  });

  describe("listByUser", () => {
    it("should return empty array when user has no interviews", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          return yield* service.listByUser("user-with-no-interviews");
        })
      );

      expect(result).toEqual([]);
    });

    it("should return only interviews belonging to the user", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* InterviewService;

          yield* service.create("user-1", "Interview 1", null);
          yield* service.create("user-1", "Interview 2", null);
          yield* service.create("user-2", "Other User Interview", null);

          return yield* service.listByUser("user-1");
        })
      );

      expect(result).toHaveLength(2);
      expect(result.every((i) => i.userId === "user-1")).toBe(true);
    });
  });

  describe("getById", () => {
    it("should return interview when user owns it", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          const created = yield* service.create(
            "user-1",
            "My Interview",
            "Description"
          );
          return yield* service.getById(created.id, "user-1");
        })
      );

      expect(result.title).toBe("My Interview");
    });

    it("should fail with InterviewNotFoundError when interview does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          return yield* service.getById("non-existent-id", "user-1");
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(InterviewNotFoundError);
          expect((error.error as InterviewNotFoundError).interviewId).toBe(
            "non-existent-id"
          );
        }
      }
    });

    it("should fail with UnauthorizedError when user does not own interview", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          const created = yield* service.create("user-1", "My Interview", null);
          return yield* service.getById(created.id, "user-2");
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

  describe("update", () => {
    it("should update interview title", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          const created = yield* service.create(
            "user-1",
            "Original Title",
            null
          );
          return yield* service.update(created.id, "user-1", {
            title: "New Title",
          });
        })
      );

      expect(result.title).toBe("New Title");
    });

    it("should update interview description", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          const created = yield* service.create("user-1", "My Interview", null);
          return yield* service.update(created.id, "user-1", {
            description: "New description",
          });
        })
      );

      expect(result.description).toBe("New description");
    });

    it("should fail with InterviewNotFoundError when interview does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          return yield* service.update("non-existent-id", "user-1", {
            title: "New Title",
          });
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
          const service = yield* InterviewService;
          const created = yield* service.create("user-1", "My Interview", null);
          return yield* service.update(created.id, "user-2", {
            title: "Hacked Title",
          });
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

  describe("delete", () => {
    it("should delete interview when user owns it", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          const created = yield* service.create("user-1", "My Interview", null);
          yield* service.delete(created.id, "user-1");

          // Verify it's gone
          const list = yield* service.listByUser("user-1");
          return list;
        })
      );

      expect(result).toHaveLength(0);
    });

    it("should fail with InterviewNotFoundError when interview does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const service = yield* InterviewService;
          return yield* service.delete("non-existent-id", "user-1");
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
          const service = yield* InterviewService;
          const created = yield* service.create("user-1", "My Interview", null);
          return yield* service.delete(created.id, "user-2");
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
