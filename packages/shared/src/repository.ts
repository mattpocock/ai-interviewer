import { Context, Effect, Option } from "effect";
import type { Interview, Document, Take, Message, User } from "./index.js";

export interface InterviewRepository {
  readonly findById: (
    id: string
  ) => Effect.Effect<Option.Option<Interview>, never, never>;
  readonly findByUserId: (
    userId: string
  ) => Effect.Effect<Interview[], never, never>;
  readonly create: (
    interview: Omit<Interview, "id" | "createdAt" | "updatedAt">
  ) => Effect.Effect<Interview, never, never>;
  readonly update: (
    id: string,
    data: Partial<Pick<Interview, "title" | "description">>
  ) => Effect.Effect<Option.Option<Interview>, never, never>;
  readonly delete: (id: string) => Effect.Effect<boolean, never, never>;
}

export const InterviewRepository = Context.GenericTag<InterviewRepository>(
  "InterviewRepository"
);

export interface DocumentRepository {
  readonly findById: (
    id: string
  ) => Effect.Effect<Option.Option<Document>, never, never>;
  readonly findByInterviewId: (
    interviewId: string
  ) => Effect.Effect<Document[], never, never>;
  readonly create: (
    document: Omit<Document, "id" | "createdAt" | "updatedAt">
  ) => Effect.Effect<Document, never, never>;
  readonly update: (
    id: string,
    data: Partial<Pick<Document, "title" | "content">>
  ) => Effect.Effect<Option.Option<Document>, never, never>;
  readonly delete: (id: string) => Effect.Effect<boolean, never, never>;
}

export const DocumentRepository =
  Context.GenericTag<DocumentRepository>("DocumentRepository");

export interface TakeRepository {
  readonly findById: (
    id: string
  ) => Effect.Effect<Option.Option<Take>, never, never>;
  readonly findByInterviewId: (
    interviewId: string
  ) => Effect.Effect<Take[], never, never>;
  readonly create: (
    take: Omit<Take, "id" | "createdAt" | "updatedAt">
  ) => Effect.Effect<Take, never, never>;
  readonly updateStage: (
    id: string,
    stage: Take["stage"]
  ) => Effect.Effect<Option.Option<Take>, never, never>;
}

export const TakeRepository =
  Context.GenericTag<TakeRepository>("TakeRepository");

export interface MessageRepository {
  readonly findByTakeId: (
    takeId: string
  ) => Effect.Effect<Message[], never, never>;
  readonly create: (
    message: Omit<Message, "id" | "createdAt">
  ) => Effect.Effect<Message, never, never>;
}

export const MessageRepository =
  Context.GenericTag<MessageRepository>("MessageRepository");

export interface UserRepository {
  readonly findById: (
    id: string
  ) => Effect.Effect<Option.Option<User>, never, never>;
  readonly findByGoogleId: (
    googleId: string
  ) => Effect.Effect<Option.Option<User>, never, never>;
  readonly create: (
    user: Omit<User, "id" | "createdAt">
  ) => Effect.Effect<User, never, never>;
}

export const UserRepository =
  Context.GenericTag<UserRepository>("UserRepository");
