# AI Interviewer - Project Guidelines

## Project Overview

A two-component system for conducting AI-powered interviews:
- **Web Application** (React Router 7 on Vercel): Full-featured interface
- **Mobile Application** (Expo/React Native): Lightweight mobile interface

See Issue #1 for the full PRD.

## Commands

```bash
# Development
npm run dev          # Start dev server (apps/web)
npm run build        # Build all packages
npm run typecheck    # Run TypeScript type checking

# Testing
npm run test         # Run all tests
npm run test:watch   # Watch mode for TDD

# Database (apps/web)
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## Architecture

- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: Effect.ts for business logic with dependency injection
- **Database**: Drizzle ORM with Neon serverless Postgres
- **Testing**: Vitest with mock repositories

## Testing Guidelines

### What Makes a Good Test

A good test:
- Tests **external behavior** through public interfaces, not implementation details
- Is **deterministic** - no flaky dependencies on timing, network, or environment
- Uses **dependency injection** to swap real services for test doubles
- Tests **one behavior** per test case
- Has a clear **arrange-act-assert** structure

### What Makes a Shit Test

Do NOT write tests that:
- Test TypeScript types at runtime (the compiler already checks this)
- Simply assign values and read them back
- Test that object shapes match interfaces
- Mock the thing being tested
- Test private methods or internal state

**Example of a shit test:**
```typescript
// ❌ BAD - Tests nothing. TypeScript already ensures this compiles.
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
```

**Example of a good test:**
```typescript
// ✅ GOOD - Tests actual behavior through public interface
it("should fail with UnauthorizedError when user does not own interview", async () => {
  const exit = await runTestExit(
    Effect.gen(function* () {
      const service = yield* InterviewService;
      const created = yield* service.create("user-1", "My Interview", null);
      return yield* service.getById(created.id, "user-2");
    })
  );

  expect(Exit.isFailure(exit)).toBe(true);
  if (Exit.isFailure(exit)) {
    const error = exit.cause;
    if (error._tag === "Fail") {
      expect(error.error).toBeInstanceOf(UnauthorizedError);
    }
  }
});
```

### Test Layer Pattern

Services are tested with mock repositories:

```typescript
// Tests use mock implementations
const TestLayer = Layer.provide(
  InterviewServiceLive,
  Layer.merge(InterviewRepositoryMock, DocumentRepositoryMock)
);

// Run tests with the test layer
const runTest = <A, E>(effect: Effect.Effect<A, E, InterviewService>) =>
  Effect.runPromise(Effect.provide(effect, TestLayer));
```

### What to Test

- **Service methods**: CRUD operations, authorization checks, business logic
- **Error conditions**: Not found, unauthorized, validation failures
- **Edge cases**: Empty lists, null values, boundary conditions
- **Prompt generation**: Structure and content of AI prompts (pure functions)

### What NOT to Test

- TypeScript types (the compiler handles this)
- Database queries directly (mock the repository layer)
- Third-party library internals
- Trivial getters/setters

## Code Style

- Use Effect.ts `Effect.gen` for async/await-like syntax
- Use `Data.TaggedError` for typed errors
- Repository interfaces live in `packages/shared`
- Concrete implementations live in `apps/web/app/db/repositories`
