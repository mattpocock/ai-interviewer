import { getSessionFromRequest } from "~/auth/session.server";
import type { Route } from "./+types/api.auth.me";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
    },
  });
}
