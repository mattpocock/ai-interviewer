import { describe, it, expect } from "vitest";
import { Effect, Layer, Exit } from "effect";
import { DocumentService, DocumentServiceLive } from "./document-service.js";
import { InterviewService, InterviewServiceLive } from "./interview-service.js";
import {
  InterviewRepositoryMock,
  DocumentRepositoryMock,
} from "../testing/mock-repositories.js";
import {
  DocumentNotFoundError,
  InterviewNotFoundError,
  UnauthorizedError,
} from "../errors.js";

const RepositoryLayer = Layer.merge(
  InterviewRepositoryMock,
  DocumentRepositoryMock
);

const TestLayer = Layer.provide(
  Layer.merge(DocumentServiceLive, InterviewServiceLive),
  RepositoryLayer
);

type TestServices = DocumentService | InterviewService;

const runTest = <A, E>(effect: Effect.Effect<A, E, TestServices>) =>
  Effect.runPromise(Effect.provide(effect, TestLayer));

const runTestExit = <A, E>(effect: Effect.Effect<A, E, TestServices>) =>
  Effect.runPromise(Effect.exit(Effect.provide(effect, TestLayer)));

describe("DocumentService", () => {
  describe("create", () => {
    it("should create a document for an interview the user owns", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          return yield* documentService.create(
            interview.id,
            "user-1",
            "My Document",
            "Some content here"
          );
        })
      );

      expect(result.id).toBeDefined();
      expect(result.title).toBe("My Document");
      expect(result.content).toBe("Some content here");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should fail with InterviewNotFoundError when interview does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const documentService = yield* DocumentService;

          return yield* documentService.create(
            "non-existent-interview",
            "user-1",
            "My Document",
            "Content"
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
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          return yield* documentService.create(
            interview.id,
            "user-2", // Different user
            "My Document",
            "Content"
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
    it("should return empty array when interview has no documents", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          return yield* documentService.listByInterview(interview.id, "user-1");
        })
      );

      expect(result).toEqual([]);
    });

    it("should return all documents belonging to the interview", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          yield* documentService.create(
            interview.id,
            "user-1",
            "Doc 1",
            "Content 1"
          );
          yield* documentService.create(
            interview.id,
            "user-1",
            "Doc 2",
            "Content 2"
          );

          return yield* documentService.listByInterview(interview.id, "user-1");
        })
      );

      expect(result).toHaveLength(2);
      expect(result.map((d) => d.title).sort()).toEqual(["Doc 1", "Doc 2"]);
    });

    it("should fail with InterviewNotFoundError when interview does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const documentService = yield* DocumentService;

          return yield* documentService.listByInterview(
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
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          return yield* documentService.listByInterview(
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
    it("should return document when user owns parent interview", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const document = yield* documentService.create(
            interview.id,
            "user-1",
            "My Document",
            "Content"
          );

          return yield* documentService.getById(document.id, "user-1");
        })
      );

      expect(result.title).toBe("My Document");
      expect(result.content).toBe("Content");
    });

    it("should fail with DocumentNotFoundError when document does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const documentService = yield* DocumentService;

          return yield* documentService.getById("non-existent-doc", "user-1");
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(DocumentNotFoundError);
          expect((error.error as DocumentNotFoundError).documentId).toBe(
            "non-existent-doc"
          );
        }
      }
    });

    it("should fail with UnauthorizedError when user does not own parent interview", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const document = yield* documentService.create(
            interview.id,
            "user-1",
            "My Document",
            "Content"
          );

          return yield* documentService.getById(document.id, "user-2");
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

  describe("update", () => {
    it("should update document title", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const document = yield* documentService.create(
            interview.id,
            "user-1",
            "Original Title",
            "Content"
          );

          return yield* documentService.update(document.id, "user-1", {
            title: "New Title",
          });
        })
      );

      expect(result.title).toBe("New Title");
      expect(result.content).toBe("Content");
    });

    it("should update document content", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const document = yield* documentService.create(
            interview.id,
            "user-1",
            "My Document",
            "Original content"
          );

          return yield* documentService.update(document.id, "user-1", {
            content: "New content",
          });
        })
      );

      expect(result.title).toBe("My Document");
      expect(result.content).toBe("New content");
    });

    it("should fail with DocumentNotFoundError when document does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const documentService = yield* DocumentService;

          return yield* documentService.update("non-existent-doc", "user-1", {
            title: "New Title",
          });
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(DocumentNotFoundError);
        }
      }
    });

    it("should fail with UnauthorizedError when user does not own parent interview", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const document = yield* documentService.create(
            interview.id,
            "user-1",
            "My Document",
            "Content"
          );

          return yield* documentService.update(document.id, "user-2", {
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
    it("should delete document when user owns parent interview", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const document = yield* documentService.create(
            interview.id,
            "user-1",
            "My Document",
            "Content"
          );

          yield* documentService.delete(document.id, "user-1");

          // Verify it's gone
          return yield* documentService.listByInterview(interview.id, "user-1");
        })
      );

      expect(result).toHaveLength(0);
    });

    it("should fail with DocumentNotFoundError when document does not exist", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const documentService = yield* DocumentService;

          return yield* documentService.delete("non-existent-doc", "user-1");
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(DocumentNotFoundError);
        }
      }
    });

    it("should fail with UnauthorizedError when user does not own parent interview", async () => {
      const exit = await runTestExit(
        Effect.gen(function* () {
          const interviewService = yield* InterviewService;
          const documentService = yield* DocumentService;

          const interview = yield* interviewService.create(
            "user-1",
            "My Interview",
            null
          );

          const document = yield* documentService.create(
            interview.id,
            "user-1",
            "My Document",
            "Content"
          );

          return yield* documentService.delete(document.id, "user-2");
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
