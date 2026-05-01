/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiProviders from "../aiProviders.js";
import type * as auth from "../auth.js";
import type * as authCrud from "../authCrud.js";
import type * as conversations from "../conversations.js";
import type * as essays from "../essays.js";
import type * as folders from "../folders.js";
import type * as modules from "../modules.js";
import type * as notes from "../notes.js";
import type * as seed from "../seed.js";
import type * as serverAuth from "../serverAuth.js";
import type * as sourceChunks from "../sourceChunks.js";
import type * as sources from "../sources.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiProviders: typeof aiProviders;
  auth: typeof auth;
  authCrud: typeof authCrud;
  conversations: typeof conversations;
  essays: typeof essays;
  folders: typeof folders;
  modules: typeof modules;
  notes: typeof notes;
  seed: typeof seed;
  serverAuth: typeof serverAuth;
  sourceChunks: typeof sourceChunks;
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
