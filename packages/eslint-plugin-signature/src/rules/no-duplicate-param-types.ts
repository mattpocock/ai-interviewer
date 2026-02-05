import {
  ESLintUtils,
  TSESTree,
  AST_NODE_TYPES,
} from "@typescript-eslint/utils";

type MessageIds = "tooManyDuplicateTypes";

type Options = [
  {
    maxOfSameType?: number;
  },
];

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/mattpocock/ai-interviewer/blob/main/packages/eslint-plugin-signature/docs/rules/${name}.md`
);

/**
 * Get the type annotation text for a parameter
 */
function getParamTypeText(
  param: TSESTree.Parameter,
  sourceCode: Readonly<
    TSESTree.Comment[] & { getText: (node: TSESTree.Node) => string }
  >
): string | null {
  // Handle regular parameters with type annotations
  if (param.type === AST_NODE_TYPES.Identifier && param.typeAnnotation) {
    return sourceCode.getText(param.typeAnnotation.typeAnnotation);
  }

  // Handle rest parameters (...args: string[])
  if (param.type === AST_NODE_TYPES.RestElement) {
    const argument = param.argument;
    if (argument.type === AST_NODE_TYPES.Identifier && param.typeAnnotation) {
      return sourceCode.getText(param.typeAnnotation.typeAnnotation);
    }
  }

  // Handle assignment patterns (param: string = "default")
  if (param.type === AST_NODE_TYPES.AssignmentPattern) {
    const left = param.left;
    if (left.type === AST_NODE_TYPES.Identifier && left.typeAnnotation) {
      return sourceCode.getText(left.typeAnnotation.typeAnnotation);
    }
  }

  return null;
}

/**
 * Get parameter type text from a TSFunctionType parameter
 */
function getTSFunctionParamTypeText(
  param: TSESTree.Parameter,
  sourceCode: Readonly<
    TSESTree.Comment[] & { getText: (node: TSESTree.Node) => string }
  >
): string | null {
  if (param.type === AST_NODE_TYPES.Identifier && param.typeAnnotation) {
    return sourceCode.getText(param.typeAnnotation.typeAnnotation);
  }
  return null;
}

/**
 * Check parameters for duplicate types and report if exceeding max
 */
function checkParams(
  params: TSESTree.Parameter[],
  context: Readonly<{
    report: (descriptor: {
      node: TSESTree.Node;
      messageId: MessageIds;
      data: Record<string, unknown>;
    }) => void;
    sourceCode: {
      getText: (node: TSESTree.Node) => string;
    };
    options: Options;
  }>,
  node: TSESTree.Node
): void {
  const maxOfSameType = context.options[0]?.maxOfSameType ?? 1;
  const typeCounts = new Map<string, number>();

  for (const param of params) {
    const typeText = getParamTypeText(
      param,
      context.sourceCode as Readonly<
        TSESTree.Comment[] & { getText: (node: TSESTree.Node) => string }
      >
    );
    if (typeText) {
      const count = (typeCounts.get(typeText) ?? 0) + 1;
      typeCounts.set(typeText, count);
    }
  }

  for (const [typeText, count] of typeCounts) {
    if (count > maxOfSameType) {
      context.report({
        node,
        messageId: "tooManyDuplicateTypes",
        data: {
          type: typeText,
          count,
          max: maxOfSameType,
        },
      });
      // Only report once per function
      break;
    }
  }
}

/**
 * Check TSFunctionType parameters for duplicate types
 */
function checkTSFunctionParams(
  params: TSESTree.Parameter[],
  context: Readonly<{
    report: (descriptor: {
      node: TSESTree.Node;
      messageId: MessageIds;
      data: Record<string, unknown>;
    }) => void;
    sourceCode: {
      getText: (node: TSESTree.Node) => string;
    };
    options: Options;
  }>,
  node: TSESTree.Node
): void {
  const maxOfSameType = context.options[0]?.maxOfSameType ?? 1;
  const typeCounts = new Map<string, number>();

  for (const param of params) {
    const typeText = getTSFunctionParamTypeText(
      param,
      context.sourceCode as Readonly<
        TSESTree.Comment[] & { getText: (node: TSESTree.Node) => string }
      >
    );
    if (typeText) {
      const count = (typeCounts.get(typeText) ?? 0) + 1;
      typeCounts.set(typeText, count);
    }
  }

  for (const [typeText, count] of typeCounts) {
    if (count > maxOfSameType) {
      context.report({
        node,
        messageId: "tooManyDuplicateTypes",
        data: {
          type: typeText,
          count,
          max: maxOfSameType,
        },
      });
      // Only report once per function
      break;
    }
  }
}

export const noDuplicateParamTypes = createRule<Options, MessageIds>({
  name: "no-duplicate-param-types",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow functions with multiple parameters of the same type to prevent argument confusion",
    },
    schema: [
      {
        type: "object",
        properties: {
          maxOfSameType: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyDuplicateTypes:
        'Too many parameters of the same type "{{type}}" ({{count}} > {{max}}). Use an object parameter to avoid argument confusion.',
    },
  },
  defaultOptions: [{ maxOfSameType: 1 }],
  create(context) {
    return {
      // Regular function declarations
      FunctionDeclaration(node) {
        checkParams(node.params, context, node);
      },

      // Function expressions
      FunctionExpression(node) {
        checkParams(node.params, context, node);
      },

      // Arrow functions
      ArrowFunctionExpression(node) {
        checkParams(node.params, context, node);
      },

      // TypeScript function types in interfaces (e.g., readonly getById: (id: string, userId: string) => Effect)
      TSFunctionType(node) {
        checkTSFunctionParams(node.params, context, node);
      },

      // TypeScript method signatures in interfaces (e.g., getById(id: string, userId: string): Effect)
      TSMethodSignature(node) {
        checkTSFunctionParams(node.params, context, node);
      },

      // TypeScript call signatures in interfaces (e.g., (id: string, userId: string): Effect)
      TSCallSignatureDeclaration(node) {
        checkTSFunctionParams(node.params, context, node);
      },

      // TypeScript construct signatures (e.g., new(id: string, userId: string): Effect)
      TSConstructSignatureDeclaration(node) {
        checkTSFunctionParams(node.params, context, node);
      },
    };
  },
});

export default noDuplicateParamTypes;
