import { Data } from "effect";

export class InterviewNotFoundError extends Data.TaggedError(
  "InterviewNotFoundError"
)<{
  readonly interviewId: string;
}> {}

export class DocumentNotFoundError extends Data.TaggedError(
  "DocumentNotFoundError"
)<{
  readonly documentId: string;
}> {}

export class TakeNotFoundError extends Data.TaggedError("TakeNotFoundError")<{
  readonly takeId: string;
}> {}

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly userId: string;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly message: string;
}> {}
