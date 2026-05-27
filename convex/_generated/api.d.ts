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
import type * as ai_crypto from "../ai_crypto.js";
import type * as ai_gemini from "../ai_gemini.js";
import type * as ai_keys from "../ai_keys.js";
import type * as ai_prompts from "../ai_prompts.js";
import type * as ai_providers from "../ai_providers.js";
import type * as ai_zai from "../ai_zai.js";
import type * as arguments from "../arguments.js";
import type * as assignments from "../assignments.js";
import type * as citation from "../citation.js";
import type * as citationSafety from "../citationSafety.js";
import type * as cleanup from "../cleanup.js";
import type * as cothinker from "../cothinker.js";
import type * as cothinker_ask from "../cothinker_ask.js";
import type * as drafts from "../drafts.js";
import type * as evidence from "../evidence.js";
import type * as files from "../files.js";
import type * as folders from "../folders.js";
import type * as ingestion_lib from "../ingestion/lib.js";
import type * as ingestion_process from "../ingestion/process.js";
import type * as judgements from "../judgements.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_citation from "../lib/citation.js";
import type * as lib_integrity from "../lib/integrity.js";
import type * as lib_retrieval from "../lib/retrieval.js";
import type * as lib_validators from "../lib/validators.js";
import type * as modules from "../modules.js";
import type * as notes from "../notes.js";
import type * as observability from "../observability.js";
import type * as rateLimits from "../rateLimits.js";
import type * as retrieval from "../retrieval.js";
import type * as reviews from "../reviews.js";
import type * as sourceAnalyses from "../sourceAnalyses.js";
import type * as sourceAnalysisAI from "../sourceAnalysisAI.js";
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
  ai_crypto: typeof ai_crypto;
  ai_gemini: typeof ai_gemini;
  ai_keys: typeof ai_keys;
  ai_prompts: typeof ai_prompts;
  ai_providers: typeof ai_providers;
  ai_zai: typeof ai_zai;
  arguments: typeof arguments;
  assignments: typeof assignments;
  citation: typeof citation;
  citationSafety: typeof citationSafety;
  cleanup: typeof cleanup;
  cothinker: typeof cothinker;
  cothinker_ask: typeof cothinker_ask;
  drafts: typeof drafts;
  evidence: typeof evidence;
  files: typeof files;
  folders: typeof folders;
  "ingestion/lib": typeof ingestion_lib;
  "ingestion/process": typeof ingestion_process;
  judgements: typeof judgements;
  "lib/auth": typeof lib_auth;
  "lib/citation": typeof lib_citation;
  "lib/integrity": typeof lib_integrity;
  "lib/retrieval": typeof lib_retrieval;
  "lib/validators": typeof lib_validators;
  modules: typeof modules;
  notes: typeof notes;
  observability: typeof observability;
  rateLimits: typeof rateLimits;
  retrieval: typeof retrieval;
  reviews: typeof reviews;
  sourceAnalyses: typeof sourceAnalyses;
  sourceAnalysisAI: typeof sourceAnalysisAI;
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
