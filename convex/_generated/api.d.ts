/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as arguments from "../arguments.js";
import type * as assignments from "../assignments.js";
import type * as cothinker from "../cothinker.js";
import type * as drafts from "../drafts.js";
import type * as evidence from "../evidence.js";
import type * as files from "../files.js";
import type * as folders from "../folders.js";
import type * as lib_auth from "../lib/auth.js";
import type * as modules from "../modules.js";
import type * as notes from "../notes.js";
import type * as reviews from "../reviews.js";
import type * as sourceAnalyses from "../sourceAnalyses.js";
import type * as sources from "../sources.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  arguments: typeof arguments;
  assignments: typeof assignments;
  cothinker: typeof cothinker;
  drafts: typeof drafts;
  evidence: typeof evidence;
  files: typeof files;
  folders: typeof folders;
  "lib/auth": typeof lib_auth;
  modules: typeof modules;
  notes: typeof notes;
  reviews: typeof reviews;
  sourceAnalyses: typeof sourceAnalyses;
  sources: typeof sources;
  usage: typeof usage;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
