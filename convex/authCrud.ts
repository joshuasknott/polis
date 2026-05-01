import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const AUTH_TABLES = ["users", "sessions", "accounts", "verifications"] as const;
type AuthTable = (typeof AUTH_TABLES)[number];

function requireServerSecret(serverSecret?: string) {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (expected && serverSecret !== expected) {
    throw new Error("Unauthorized Convex server operation");
  }
}

function validateTable(table: string): AuthTable {
  if (!AUTH_TABLES.includes(table as AuthTable)) {
    throw new Error(`Invalid auth table: ${table}`);
  }
  return table as AuthTable;
}

function matchWhere(doc: any, where: Array<{ field: string; operator: string; value: any }>): boolean {
  for (const w of where) {
    const val = doc[w.field];
    switch (w.operator) {
      case "eq":
        if (val !== w.value) return false;
        break;
      case "ne":
        if (val === w.value) return false;
        break;
      case "lt":
        if (!(val < w.value)) return false;
        break;
      case "lte":
        if (!(val <= w.value)) return false;
        break;
      case "gt":
        if (!(val > w.value)) return false;
        break;
      case "gte":
        if (!(val >= w.value)) return false;
        break;
      case "in":
        if (!w.value.includes(val)) return false;
        break;
      case "not_in":
        if (w.value.includes(val)) return false;
        break;
      case "contains":
        if (typeof val !== "string" || !val.toLowerCase().includes(String(w.value).toLowerCase())) return false;
        break;
      case "starts_with":
        if (typeof val !== "string" || !val.toLowerCase().startsWith(String(w.value).toLowerCase())) return false;
        break;
      case "ends_with":
        if (typeof val !== "string" || !val.toLowerCase().endsWith(String(w.value).toLowerCase())) return false;
        break;
    }
  }
  return true;
}

export const authCreate = mutation({
  args: {
    table: v.string(),
    data: v.any(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { table, data, serverSecret }) => {
    requireServerSecret(serverSecret);
    const t = validateTable(table);
    const id = await ctx.db.insert(t, data);
    const doc = await ctx.db.get(id) as any;
    return doc ? { ...doc, id: doc._id } : null;
  },
});

export const authFindOne = query({
  args: {
    table: v.string(),
    where: v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.any(),
    })),
    select: v.optional(v.array(v.string())),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { table, where, select, serverSecret }) => {
    requireServerSecret(serverSecret);
    const t = validateTable(table);
    const docs = await ctx.db.query(t).collect();
    const match = docs.find((d) => matchWhere(d, where));
    if (!match) return null;
    let result: any = { ...match, id: match._id };
    if (select) {
      result = {};
      for (const s of select) {
        result[s] = (match as any)[s];
      }
      result.id = match._id;
    }
    return result;
  },
});

export const authFindMany = query({
  args: {
    table: v.string(),
    where: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.any(),
    }))),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.object({ field: v.string(), direction: v.string() })),
    offset: v.optional(v.number()),
    select: v.optional(v.array(v.string())),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { table, where, limit, sortBy, offset, select, serverSecret }) => {
    requireServerSecret(serverSecret);
    const t = validateTable(table);
    let docs = await ctx.db.query(t).collect();

    if (where && where.length > 0) {
      docs = docs.filter((d) => matchWhere(d, where));
    }

    if (sortBy) {
      const { field, direction } = sortBy;
      docs.sort((a, b) => {
        const aVal = (a as any)[field];
        const bVal = (b as any)[field];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === "desc" ? -cmp : cmp;
      });
    }

    const start = offset ?? 0;
    const end = limit != null ? start + limit : undefined;
    docs = docs.slice(start, end);

    return docs.map((d) => {
      let result: any = { ...d, id: d._id };
      if (select) {
        result = {};
        for (const s of select) {
          result[s] = (d as any)[s];
        }
        result.id = d._id;
      }
      return result;
    });
  },
});

export const authUpdate = mutation({
  args: {
    table: v.string(),
    where: v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.any(),
    })),
    update: v.any(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { table, where, update, serverSecret }) => {
    requireServerSecret(serverSecret);
    const t = validateTable(table);
    const docs = await ctx.db.query(t).collect();
    const match = docs.find((d) => matchWhere(d, where));
    if (!match) return null;
    await ctx.db.patch(match._id, update);
    const updated = await ctx.db.get(match._id) as any;
    return updated ? { ...updated, id: updated._id } : null;
  },
});

export const authUpdateMany = mutation({
  args: {
    table: v.string(),
    where: v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.any(),
    })),
    update: v.any(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { table, where, update, serverSecret }) => {
    requireServerSecret(serverSecret);
    const t = validateTable(table);
    const docs = await ctx.db.query(t).collect();
    const matches = docs.filter((d) => matchWhere(d, where));
    for (const match of matches) {
      await ctx.db.patch(match._id, update);
    }
    return matches.length;
  },
});

export const authDelete = mutation({
  args: {
    table: v.string(),
    where: v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.any(),
    })),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { table, where, serverSecret }) => {
    requireServerSecret(serverSecret);
    const t = validateTable(table);
    const docs = await ctx.db.query(t).collect();
    const match = docs.find((d) => matchWhere(d, where));
    if (match) {
      await ctx.db.delete(match._id);
    }
  },
});

export const authDeleteMany = mutation({
  args: {
    table: v.string(),
    where: v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.any(),
    })),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { table, where, serverSecret }) => {
    requireServerSecret(serverSecret);
    const t = validateTable(table);
    const docs = await ctx.db.query(t).collect();
    const matches = docs.filter((d) => matchWhere(d, where));
    for (const match of matches) {
      await ctx.db.delete(match._id);
    }
    return matches.length;
  },
});

export const authCount = query({
  args: {
    table: v.string(),
    where: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.any(),
    }))),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { table, where, serverSecret }) => {
    requireServerSecret(serverSecret);
    const t = validateTable(table);
    let docs = await ctx.db.query(t).collect();
    if (where && where.length > 0) {
      docs = docs.filter((d) => matchWhere(d, where));
    }
    return docs.length;
  },
});
