// Shared types and schemas for AI Interviewer

export interface Interview {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  interviewId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TakeStage = "pre-interview" | "interview";

export interface Take {
  id: string;
  interviewId: string;
  stage: TakeStage;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  takeId: string;
  role: MessageRole;
  content: string;
  enabledDocumentIds: string[];
  createdAt: Date;
}

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}
