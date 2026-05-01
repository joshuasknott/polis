import { betterAuth } from "better-auth";
import { createAdapterFactory, type CustomAdapter } from "better-auth/adapters";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  return new ConvexHttpClient(url);
}

function getServerSecret() {
  return process.env.CONVEX_SERVER_SECRET || "";
}

function convexAdapterFactory() {
  return createAdapterFactory({
    adapter: ({ getModelName, getFieldName }) => {
      const tableMap: Record<string, string> = {
        user: "users",
        session: "sessions",
        account: "accounts",
        verification: "verifications",
      };

      function getTable(model: string): string {
        return tableMap[model] || model;
      }

      function mapWhere(where: Array<{ field: string; operator: string; value: any; connector?: string }>) {
        return where.map((w) => ({ field: w.field, operator: w.operator || "eq", value: w.value }));
      }

      function mapDocOut(doc: any) {
        if (!doc) return doc;
        return doc;
      }

      const adapter: CustomAdapter = {
        create: async ({ model, data }) => {
          const client = getConvexClient();
          const table = getTable(model);
          const result = await client.mutation(api.authCrud.authCreate, {
            table,
            data,
            serverSecret: getServerSecret(),
          });
          return mapDocOut(result);
        },

        findOne: async ({ model, where, select }) => {
          const client = getConvexClient();
          const table = getTable(model);
          const result = await client.query(api.authCrud.authFindOne, {
            table,
            where: mapWhere(where),
            select,
            serverSecret: getServerSecret(),
          });
          return mapDocOut(result) as any;
        },

        findMany: async ({ model, where, limit, sortBy, offset }) => {
          const client = getConvexClient();
          const table = getTable(model);
          const results = await client.query(api.authCrud.authFindMany, {
            table,
            where: where ? mapWhere(where) : undefined,
            limit: limit ?? 100,
            sortBy: sortBy ? { field: sortBy.field, direction: sortBy.direction } : undefined,
            offset,
            serverSecret: getServerSecret(),
          });
          return (results as any[]).map(mapDocOut);
        },

        update: async ({ model, where, update: updateData }) => {
          const client = getConvexClient();
          const table = getTable(model);
          const result = await client.mutation(api.authCrud.authUpdate, {
            table,
            where: mapWhere(where),
            update: updateData,
            serverSecret: getServerSecret(),
          });
          return mapDocOut(result) as any;
        },

        updateMany: async ({ model, where, update: updateData }) => {
          const client = getConvexClient();
          const table = getTable(model);
          return client.mutation(api.authCrud.authUpdateMany, {
            table,
            where: mapWhere(where),
            update: updateData,
            serverSecret: getServerSecret(),
          });
        },

        delete: async ({ model, where }) => {
          const client = getConvexClient();
          const table = getTable(model);
          await client.mutation(api.authCrud.authDelete, {
            table,
            where: mapWhere(where),
            serverSecret: getServerSecret(),
          });
        },

        deleteMany: async ({ model, where }) => {
          const client = getConvexClient();
          const table = getTable(model);
          return client.mutation(api.authCrud.authDeleteMany, {
            table,
            where: mapWhere(where),
            serverSecret: getServerSecret(),
          });
        },

        count: async ({ model, where }) => {
          const client = getConvexClient();
          const table = getTable(model);
          return client.query(api.authCrud.authCount, {
            table,
            where: where ? mapWhere(where) : undefined,
            serverSecret: getServerSecret(),
          });
        },
      };

      return adapter;
    },
    config: {
      adapterId: "convex",
      adapterName: "Convex",
      supportsDates: false,
      supportsJSON: true,
      supportsBooleans: true,
      supportsArrays: true,
      transaction: false,
      usePlural: false,
      disableIdGeneration: true,
      mapKeysTransformInput: { id: "_id" },
      mapKeysTransformOutput: { _id: "id" },
    },
  });
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  database: convexAdapterFactory(),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 4,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      enabled: !!process.env.GITHUB_ID,
    },
    google: {
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      enabled: !!process.env.GOOGLE_ID,
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || process.env.AUTH_URL || "http://localhost:3000"],
});

export type Auth = typeof auth;
