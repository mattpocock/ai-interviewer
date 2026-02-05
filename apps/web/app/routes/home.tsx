import type { Route } from "./+types/home";
import { getOptionalUser } from "~/auth/require-auth.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Interviewer" },
    { name: "description", content: "AI-powered interview assistant" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalUser(request);
  return { user };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>AI Interviewer</h1>
      <p>Welcome to AI Interviewer - your AI-powered interview assistant.</p>

      {user ? (
        <div>
          <p>
            Signed in as <strong>{user.name}</strong> ({user.email})
          </p>
          <p>
            <a href="/auth/logout">Sign out</a>
          </p>
        </div>
      ) : (
        <div>
          <p>
            <a href="/auth/google">Sign in with Google</a>
          </p>
        </div>
      )}
    </div>
  );
}
