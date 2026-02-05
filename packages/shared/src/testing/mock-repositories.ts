import { Effect, Layer, Option } from "effect";
import type { Interview, Document, Take, Message, User } from "../index.js";
import {
  InterviewRepository,
  DocumentRepository,
  TakeRepository,
  MessageRepository,
  UserRepository,
} from "../repository.js";

function generateId(): string {
  return crypto.randomUUID();
}

function createInMemoryInterviewRepository(): InterviewRepository {
  const store = new Map<string, Interview>();

  return {
    findById: (id) =>
      Effect.sync(() => Option.fromNullable(store.get(id))),

    findByUserId: (userId) =>
      Effect.sync(() =>
        Array.from(store.values()).filter((i) => i.userId === userId)
      ),

    create: (data) =>
      Effect.sync(() => {
        const now = new Date();
        const interview: Interview = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        store.set(interview.id, interview);
        return interview;
      }),

    update: (id, data) =>
      Effect.sync(() => {
        const existing = store.get(id);
        if (!existing) return Option.none();

        const updated: Interview = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        store.set(id, updated);
        return Option.some(updated);
      }),

    delete: (id) =>
      Effect.sync(() => store.delete(id)),
  };
}

function createInMemoryDocumentRepository(): DocumentRepository {
  const store = new Map<string, Document>();

  return {
    findById: (id) =>
      Effect.sync(() => Option.fromNullable(store.get(id))),

    findByInterviewId: (interviewId) =>
      Effect.sync(() =>
        Array.from(store.values()).filter((d) => d.interviewId === interviewId)
      ),

    create: (data) =>
      Effect.sync(() => {
        const now = new Date();
        const document: Document = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        store.set(document.id, document);
        return document;
      }),

    update: (id, data) =>
      Effect.sync(() => {
        const existing = store.get(id);
        if (!existing) return Option.none();

        const updated: Document = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        store.set(id, updated);
        return Option.some(updated);
      }),

    delete: (id) =>
      Effect.sync(() => store.delete(id)),
  };
}

function createInMemoryTakeRepository(): TakeRepository {
  const store = new Map<string, Take>();

  return {
    findById: (id) =>
      Effect.sync(() => Option.fromNullable(store.get(id))),

    findByInterviewId: (interviewId) =>
      Effect.sync(() =>
        Array.from(store.values()).filter((t) => t.interviewId === interviewId)
      ),

    create: (data) =>
      Effect.sync(() => {
        const now = new Date();
        const take: Take = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        store.set(take.id, take);
        return take;
      }),

    updateStage: (id, stage) =>
      Effect.sync(() => {
        const existing = store.get(id);
        if (!existing) return Option.none();

        const updated: Take = {
          ...existing,
          stage,
          updatedAt: new Date(),
        };
        store.set(id, updated);
        return Option.some(updated);
      }),
  };
}

function createInMemoryMessageRepository(): MessageRepository {
  const store = new Map<string, Message>();

  return {
    findByTakeId: (takeId) =>
      Effect.sync(() =>
        Array.from(store.values())
          .filter((m) => m.takeId === takeId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      ),

    create: (data) =>
      Effect.sync(() => {
        const message: Message = {
          id: generateId(),
          ...data,
          createdAt: new Date(),
        };
        store.set(message.id, message);
        return message;
      }),
  };
}

function createInMemoryUserRepository(): UserRepository {
  const store = new Map<string, User>();

  return {
    findById: (id) =>
      Effect.sync(() => Option.fromNullable(store.get(id))),

    findByGoogleId: (googleId) =>
      Effect.sync(() =>
        Option.fromNullable(
          Array.from(store.values()).find((u) => u.googleId === googleId)
        )
      ),

    create: (data) =>
      Effect.sync(() => {
        const user: User = {
          id: generateId(),
          ...data,
          createdAt: new Date(),
        };
        store.set(user.id, user);
        return user;
      }),
  };
}

export const InterviewRepositoryMock = Layer.sync(
  InterviewRepository,
  createInMemoryInterviewRepository
);

export const DocumentRepositoryMock = Layer.sync(
  DocumentRepository,
  createInMemoryDocumentRepository
);

export const TakeRepositoryMock = Layer.sync(
  TakeRepository,
  createInMemoryTakeRepository
);

export const MessageRepositoryMock = Layer.sync(
  MessageRepository,
  createInMemoryMessageRepository
);

export const UserRepositoryMock = Layer.sync(
  UserRepository,
  createInMemoryUserRepository
);

export const AllRepositoriesMock = Layer.mergeAll(
  InterviewRepositoryMock,
  DocumentRepositoryMock,
  TakeRepositoryMock,
  MessageRepositoryMock,
  UserRepositoryMock
);
