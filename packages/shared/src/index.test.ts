import { describe, it, expect } from "vitest";
import type { Interview, Document, Take, Message, User, TakeStage, MessageRole } from "./index";

describe("shared types", () => {
  it("should allow creating Interview objects", () => {
    const interview: Interview = {
      id: "123",
      userId: "user-1",
      title: "Test Interview",
      description: "A test description",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(interview.id).toBe("123");
    expect(interview.title).toBe("Test Interview");
  });

  it("should allow null description on Interview", () => {
    const interview: Interview = {
      id: "123",
      userId: "user-1",
      title: "Test Interview",
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(interview.description).toBeNull();
  });

  it("should allow creating Document objects", () => {
    const doc: Document = {
      id: "doc-1",
      interviewId: "123",
      title: "Background Doc",
      content: "# Markdown content here",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(doc.id).toBe("doc-1");
    expect(doc.content).toContain("Markdown");
  });

  it("should restrict TakeStage to valid values", () => {
    const stage1: TakeStage = "pre-interview";
    const stage2: TakeStage = "interview";
    expect(stage1).toBe("pre-interview");
    expect(stage2).toBe("interview");
  });

  it("should allow creating Take objects", () => {
    const take: Take = {
      id: "take-1",
      interviewId: "123",
      stage: "pre-interview",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(take.stage).toBe("pre-interview");
  });

  it("should restrict MessageRole to valid values", () => {
    const role1: MessageRole = "user";
    const role2: MessageRole = "assistant";
    expect(role1).toBe("user");
    expect(role2).toBe("assistant");
  });

  it("should allow creating Message objects", () => {
    const message: Message = {
      id: "msg-1",
      takeId: "take-1",
      role: "user",
      content: "Hello, I want to discuss TypeScript.",
      enabledDocumentIds: ["doc-1", "doc-2"],
      createdAt: new Date(),
    };
    expect(message.role).toBe("user");
    expect(message.enabledDocumentIds).toHaveLength(2);
  });

  it("should allow creating User objects", () => {
    const user: User = {
      id: "user-1",
      googleId: "google-123",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: "https://example.com/avatar.png",
      createdAt: new Date(),
    };
    expect(user.email).toBe("test@example.com");
  });

  it("should allow null avatarUrl on User", () => {
    const user: User = {
      id: "user-1",
      googleId: "google-123",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: null,
      createdAt: new Date(),
    };
    expect(user.avatarUrl).toBeNull();
  });
});
