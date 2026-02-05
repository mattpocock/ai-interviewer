import { noDuplicateParamTypes } from "./rules/no-duplicate-param-types.js";

const plugin = {
  meta: {
    name: "@ai-interviewer/eslint-plugin-signature",
    version: "0.0.0",
  },
  rules: {
    "no-duplicate-param-types": noDuplicateParamTypes,
  },
};

export default plugin;
export { noDuplicateParamTypes };
