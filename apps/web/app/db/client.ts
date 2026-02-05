import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Create a Neon client using the DATABASE_URL environment variable
// This is lazy - connection only established when queries are made
function createClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

// Export a function to get the database client
// This allows for lazy initialization and testing flexibility
export const getDb = createClient;

// Export the database type for use in repository implementations
export type Database = ReturnType<typeof createClient>;
