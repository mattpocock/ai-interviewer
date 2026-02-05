import { RuleTester } from "@typescript-eslint/rule-tester";
import { noDuplicateParamTypes } from "./no-duplicate-param-types.js";
import * as vitest from "vitest";

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const ruleTester = new RuleTester();

ruleTester.run("no-duplicate-param-types", noDuplicateParamTypes, {
  valid: [
    // Single parameter - always valid
    {
      code: "function foo(a: string) {}",
    },
    // Different types - valid
    {
      code: "function foo(a: string, b: number) {}",
    },
    // Object parameter - valid
    {
      code: "function foo({ a, b }: { a: string; b: string }) {}",
    },
    // No type annotations - valid (we can't check without types)
    {
      code: "function foo(a, b) {}",
    },
    // Interface with single parameter methods - valid
    {
      code: `
        interface Service {
          getById: (id: string) => void;
        }
      `,
    },
    // Interface with different types - valid
    {
      code: `
        interface Service {
          getById: (id: string, count: number) => void;
        }
      `,
    },
    // Interface method signature syntax with different types - valid
    {
      code: `
        interface Service {
          getById(id: string, count: number): void;
        }
      `,
    },
    // Arrow function with different types - valid
    {
      code: "const foo = (a: string, b: number) => {}",
    },
    // Max of 2 with exactly 2 - valid
    {
      code: "function foo(a: string, b: string) {}",
      options: [{ maxOfSameType: 2 }],
    },
    // Interface with object parameter - valid
    {
      code: `
        interface Service {
          getById: (params: { id: string; userId: string }) => void;
        }
      `,
    },
  ],
  invalid: [
    // Basic function declaration with 2 string params
    {
      code: "function foo(a: string, b: string) {}",
      errors: [
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "string", count: 2, max: 1 },
        },
      ],
    },
    // Function expression with 2 string params
    {
      code: "const foo = function(a: string, b: string) {}",
      errors: [
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "string", count: 2, max: 1 },
        },
      ],
    },
    // Arrow function with 2 string params
    {
      code: "const foo = (a: string, b: string) => {}",
      errors: [
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "string", count: 2, max: 1 },
        },
      ],
    },
    // Interface with function type annotation - THIS IS THE KEY CASE
    {
      code: `
        interface Service {
          getById: (id: string, userId: string) => void;
        }
      `,
      errors: [
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "string", count: 2, max: 1 },
        },
      ],
    },
    // Interface method signature syntax
    {
      code: `
        interface Service {
          getById(id: string, userId: string): void;
        }
      `,
      errors: [
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "string", count: 2, max: 1 },
        },
      ],
    },
    // Multiple methods in interface, each with violations
    {
      code: `
        interface Service {
          getById: (id: string, userId: string) => void;
          create: (name: string, email: string, password: string) => void;
        }
      `,
      errors: [
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "string", count: 2, max: 1 },
        },
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "string", count: 3, max: 1 },
        },
      ],
    },
    // 3 params when max is 2
    {
      code: "function foo(a: string, b: string, c: string) {}",
      options: [{ maxOfSameType: 2 }],
      errors: [
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "string", count: 3, max: 2 },
        },
      ],
    },
    // Type alias function type
    {
      code: "type Foo = (a: string, b: string) => void;",
      errors: [
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "string", count: 2, max: 1 },
        },
      ],
    },
    // Complex types that are the same
    {
      code: `
        interface Service {
          process: (a: Promise<string>, b: Promise<string>) => void;
        }
      `,
      errors: [
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "Promise<string>", count: 2, max: 1 },
        },
      ],
    },
    // Effect types (from the actual codebase)
    {
      code: `
        interface Service {
          getById: (
            id: string,
            userId: string
          ) => Effect.Effect<Item, NotFoundError>;
        }
      `,
      errors: [
        {
          messageId: "tooManyDuplicateTypes",
          data: { type: "string", count: 2, max: 1 },
        },
      ],
    },
  ],
});
