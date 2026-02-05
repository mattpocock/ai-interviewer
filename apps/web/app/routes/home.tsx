import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Interviewer" },
    { name: "description", content: "AI-powered interview assistant" },
  ];
}

export default function Home() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>AI Interviewer</h1>
      <p>Welcome to AI Interviewer - your AI-powered interview assistant.</p>
    </div>
  );
}
