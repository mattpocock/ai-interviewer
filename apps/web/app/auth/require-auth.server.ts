import { redirect } from "react-router";
import { getSessionFromRequest } from "./session.server";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
}

/**
 * Require authentication for a route.
 * Throws a redirect to the login page if not authenticated.
 */
export async function requireAuth(
  request: Request
): Promise<AuthenticatedUser> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    throw redirect("/auth/google");
  }

  return session;
}

/**
 * Get the current user if authenticated, or null if not.
 * Does not redirect - useful for pages that show different content based on auth status.
 */
export async function getOptionalUser(
  request: Request
): Promise<AuthenticatedUser | null> {
  return getSessionFromRequest(request);
}
