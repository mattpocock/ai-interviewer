import { Context, Layer } from "effect";
import type { Database } from "../client";
import { getDb } from "../client";

// Database service tag for dependency injection
export interface DatabaseService {
  readonly db: Database;
}

export const DatabaseService = Context.GenericTag<DatabaseService>("DatabaseService");

// Live implementation that uses the real database
export const DatabaseServiceLive = Layer.sync(DatabaseService, () => ({
  db: getDb(),
}));
