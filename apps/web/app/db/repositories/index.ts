import { Layer } from "effect";
import {
  InterviewServiceLive,
  DocumentServiceLive,
  TakeServiceLive,
  MessageServiceLive,
} from "@ai-interviewer/shared";

export { DatabaseService, DatabaseServiceLive } from "./database-service";
export { UserRepositoryLive } from "./user-repository";
export { InterviewRepositoryLive } from "./interview-repository";
export { DocumentRepositoryLive } from "./document-repository";
export { TakeRepositoryLive } from "./take-repository";
export { MessageRepositoryLive } from "./message-repository";

// Import individual repository layers
import { DatabaseServiceLive } from "./database-service";
import { UserRepositoryLive } from "./user-repository";
import { InterviewRepositoryLive } from "./interview-repository";
import { DocumentRepositoryLive } from "./document-repository";
import { TakeRepositoryLive } from "./take-repository";
import { MessageRepositoryLive } from "./message-repository";

// Compose all repository layers with DatabaseService
export const AllRepositoriesLive = Layer.mergeAll(
  UserRepositoryLive,
  InterviewRepositoryLive,
  DocumentRepositoryLive,
  TakeRepositoryLive,
  MessageRepositoryLive
).pipe(Layer.provide(DatabaseServiceLive));

// Compose all services with repositories
export const AllServicesLive = Layer.mergeAll(
  InterviewServiceLive,
  DocumentServiceLive,
  TakeServiceLive,
  MessageServiceLive
);

// Full application layer: services + repositories + database
export const AppLayer = AllServicesLive.pipe(
  Layer.provide(AllRepositoriesLive)
);
