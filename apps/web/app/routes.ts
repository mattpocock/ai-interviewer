import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // Auth routes
  route("auth/google", "routes/auth.google.ts"),
  route("auth/google/callback", "routes/auth.google.callback.ts"),
  route("auth/logout", "routes/auth.logout.ts"),
  route("auth/error", "routes/auth.error.tsx"),
  // API routes
  route("api/auth/me", "routes/api.auth.me.ts"),
  // Interview API routes
  route("api/interviews", "routes/api.interviews.ts"),
  route("api/interviews/:id", "routes/api.interviews.$id.ts"),
  route(
    "api/interviews/:id/documents",
    "routes/api.interviews.$id.documents.ts"
  ),
  // Document API routes
  route("api/documents/:id", "routes/api.documents.$id.ts"),
  // Take API routes
  route("api/interviews/:id/takes", "routes/api.interviews.$id.takes.ts"),
  route("api/takes/:id", "routes/api.takes.$id.ts"),
] satisfies RouteConfig;
