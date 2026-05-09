/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts", { eager: false });

const TEST_USER = {
  tokenIdentifier: "user_a_token",
  subject: "user_a",
  issuer: "https://clerk.test",
  email: "usera@test.com",
  name: "User A",
};

const OTHER_USER = {
  tokenIdentifier: "user_b_token",
  subject: "user_b",
  issuer: "https://clerk.test",
  email: "userb@test.com",
  name: "User B",
};

function asUser(t: ReturnType<typeof convexTest>, user = TEST_USER) {
  return t.withIdentity({ ...user });
}

describe("modules", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  test("create and list modules for authenticated user", async () => {
    const asA = asUser(t);
    const moduleId = await asA.mutation(api.modules.create, {
      title: "Sociology 101",
      code: "SO101",
    });

    expect(typeof moduleId).toBe("string");

    const mods = await asA.query(api.modules.list, {});
    expect(mods).toHaveLength(1);
    expect(mods[0].title).toBe("Sociology 101");
    expect(mods[0].code).toBe("SO101");
  });

  test("create module generates default folders", async () => {
    const asA = asUser(t);
    const moduleId = await asA.mutation(api.modules.create, {
      title: "Test Module",
      code: "T101",
    });

    const folders = await asA.query(api.folders.list, { moduleId });
    expect(folders.length).toBe(7);
    const names = folders.map((f) => f.name);
    expect(names).toContain("Readings");
    expect(names).toContain("Assignments");
  });

  test("modules are scoped to user - cannot see other user modules", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    await asA.mutation(api.modules.create, {
      title: "User A Module",
      code: "A101",
    });

    const modsB = await asB.query(api.modules.list, {});
    expect(modsB).toHaveLength(0);
  });

  test("get module by id returns null for other user", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    const moduleId = await asA.mutation(api.modules.create, {
      title: "User A Module",
      code: "A101",
    });

    const result = await asB.query(api.modules.get, { moduleId });
    expect(result).toBeNull();
  });

  test("update module succeeds for owner", async () => {
    const asA = asUser(t);
    const moduleId = await asA.mutation(api.modules.create, {
      title: "Old Title",
      code: "T101",
    });

    await asA.mutation(api.modules.update, {
      moduleId,
      title: "New Title",
    });

    const mod = await asA.query(api.modules.get, { moduleId });
    expect(mod!.title).toBe("New Title");
  });

  test("update module throws for non-owner", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    const moduleId = await asA.mutation(api.modules.create, {
      title: "Module",
      code: "T101",
    });

    await expect(
      asB.mutation(api.modules.update, { moduleId, title: "Hacked" }),
    ).rejects.toThrow("Not found");
  });

  test("remove module succeeds for owner", async () => {
    const asA = asUser(t);
    const moduleId = await asA.mutation(api.modules.create, {
      title: "Module",
      code: "T101",
    });

    await asA.mutation(api.modules.remove, { moduleId });

    const mods = await asA.query(api.modules.list, {});
    expect(mods).toHaveLength(0);
  });

  test("remove module throws for non-owner", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    const moduleId = await asA.mutation(api.modules.create, {
      title: "Module",
      code: "T101",
    });

    await expect(
      asB.mutation(api.modules.remove, { moduleId }),
    ).rejects.toThrow("Not found");
  });
});

describe("assignments", () => {
  let t: ReturnType<typeof convexTest>;
  let moduleId: Id<"modules">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    moduleId = await asA.mutation(api.modules.create, {
      title: "Test Module",
      code: "T101",
    });
  });

  test("create assignment within owned module", async () => {
    const asA = asUser(t);
    const assignmentId = await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay 1",
      question: "Discuss the role of...",
    });

    expect(typeof assignmentId).toBe("string");

    const assignment = await asA.query(api.assignments.get, { assignmentId });
    expect(assignment!.title).toBe("Essay 1");
    expect(assignment!.stage).toBe("ingest");
  });

  test("create assignment rejects for other user module", async () => {
    const asB = asUser(t, OTHER_USER);

    await expect(
      asB.mutation(api.assignments.create, {
        moduleId,
        title: "Hacked",
      }),
    ).rejects.toThrow("Not found");
  });

  test("list assignments scoped to user and module", async () => {
    const asA = asUser(t);

    await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay 1",
    });
    await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay 2",
    });

    const list = await asA.query(api.assignments.list, { moduleId });
    expect(list).toHaveLength(2);
  });

  test("update stage", async () => {
    const asA = asUser(t);
    const assignmentId = await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay",
    });

    await asA.mutation(api.assignments.updateStage, {
      assignmentId,
      stage: "understand",
    });

    const assignment = await asA.query(api.assignments.get, { assignmentId });
    expect(assignment!.stage).toBe("understand");
  });

  test("other user cannot see assignment", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    const assignmentId = await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay",
    });

    const result = await asB.query(api.assignments.get, { assignmentId });
    expect(result).toBeNull();
  });

  test("add source to assignment requires same module", async () => {
    const asA = asUser(t);

    const otherModuleId = await asA.mutation(api.modules.create, {
      title: "Other Module",
      code: "O201",
    });

    const sourceId = await asA.mutation(api.sources.createPlaceholder, {
      moduleId: otherModuleId,
      title: "Source from other module",
    });

    const assignmentId = await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay",
    });

    await expect(
      asA.mutation(api.assignments.addSource, { assignmentId, sourceId }),
    ).rejects.toThrow("Source and assignment must be in the same module");
  });

  test("add source to assignment succeeds for same module", async () => {
    const asA = asUser(t);

    const sourceId = await asA.mutation(api.sources.createPlaceholder, {
      moduleId,
      title: "A source",
    });

    const assignmentId = await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay",
    });

    const linkId = await asA.mutation(api.assignments.addSource, {
      assignmentId,
      sourceId,
    });
    expect(typeof linkId).toBe("string");

    const links = await asA.query(api.assignments.listSources, { assignmentId });
    expect(links).toHaveLength(1);
  });
});

describe("sources", () => {
  let t: ReturnType<typeof convexTest>;
  let moduleId: Id<"modules">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    moduleId = await asA.mutation(api.modules.create, {
      title: "Test Module",
      code: "T101",
    });
  });

  test("create placeholder source", async () => {
    const asA = asUser(t);
    const sourceId = await asA.mutation(api.sources.createPlaceholder, {
      moduleId,
      title: "A Paper",
      authors: "Smith et al.",
      year: 2024,
    });

    const source = await asA.query(api.sources.get, { sourceId });
    expect(source!.title).toBe("A Paper");
    expect(source!.status).toBe("placeholder");
    expect(source!.type).toBe("journal_article");
  });

  test("sources are scoped to user", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    const sourceId = await asA.mutation(api.sources.createPlaceholder, {
      moduleId,
      title: "Source",
    });

    const result = await asB.query(api.sources.get, { sourceId });
    expect(result).toBeNull();
  });

  test("list sources by module", async () => {
    const asA = asUser(t);

    await asA.mutation(api.sources.createPlaceholder, {
      moduleId,
      title: "S1",
    });
    await asA.mutation(api.sources.createPlaceholder, {
      moduleId,
      title: "S2",
    });

    const sources = await asA.query(api.sources.list, { moduleId });
    expect(sources).toHaveLength(2);
  });

  test("update source fields", async () => {
    const asA = asUser(t);
    const sourceId = await asA.mutation(api.sources.createPlaceholder, {
      moduleId,
      title: "Old Title",
    });

    await asA.mutation(api.sources.update, {
      sourceId,
      title: "New Title",
      citation: "Smith (2024)",
    });

    const source = await asA.query(api.sources.get, { sourceId });
    expect(source!.title).toBe("New Title");
    expect(source!.citation).toBe("Smith (2024)");
  });
});

describe("evidence", () => {
  let t: ReturnType<typeof convexTest>;
  let moduleId: Id<"modules">;
  let assignmentId: Id<"assignments">;
  let sourceId: Id<"sources">;
  let argumentId: Id<"arguments">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    moduleId = await asA.mutation(api.modules.create, {
      title: "Test Module",
      code: "T101",
    });
    assignmentId = await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay",
    });
    sourceId = await asA.mutation(api.sources.createPlaceholder, {
      moduleId,
      title: "Source",
    });
    argumentId = await asA.mutation(api.arguments.create, {
      assignmentId,
      claim: "Main argument",
    });
  });

  test("create evidence link between argument and source", async () => {
    const asA = asUser(t);
    const linkId = await asA.mutation(api.evidence.create, {
      argumentId,
      sourceId,
      strength: "strong",
      quote: "The evidence shows...",
      pageRange: "12-14",
    });

    expect(typeof linkId).toBe("string");

    const links = await asA.query(api.evidence.listForArgument, { argumentId });
    expect(links).toHaveLength(1);
    expect(links[0].strength).toBe("strong");
  });

  test("evidence is scoped to user", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    await asA.mutation(api.evidence.create, {
      argumentId,
      sourceId,
      strength: "weak",
    });

    const links = await asB.query(api.evidence.listForArgument, { argumentId });
    expect(links).toHaveLength(0);
  });

  test("cannot create evidence linking other user entities", async () => {
    const asB = asUser(t, OTHER_USER);

    await expect(
      asB.mutation(api.evidence.create, {
        argumentId,
        sourceId,
        strength: "strong",
      }),
    ).rejects.toThrow("Not found");
  });
});

describe("drafts", () => {
  let t: ReturnType<typeof convexTest>;
  let moduleId: Id<"modules">;
  let assignmentId: Id<"assignments">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    moduleId = await asA.mutation(api.modules.create, {
      title: "Test Module",
      code: "T101",
    });
    assignmentId = await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay",
    });
  });

  test("create draft with auto-incrementing version", async () => {
    const asA = asUser(t);

    const d1 = await asA.mutation(api.drafts.create, {
      assignmentId,
      content: "First draft",
      wordCount: 100,
    });

    const d2 = await asA.mutation(api.drafts.create, {
      assignmentId,
      content: "Second draft",
      wordCount: 200,
    });

    const draft1 = await asA.query(api.drafts.get, { draftId: d1 });
    const draft2 = await asA.query(api.drafts.get, { draftId: d2 });

    expect(draft1!.version).toBe(1);
    expect(draft2!.version).toBe(2);
  });

  test("getLatest returns the most recent draft", async () => {
    const asA = asUser(t);

    await asA.mutation(api.drafts.create, {
      assignmentId,
      content: "First",
      wordCount: 50,
    });
    await asA.mutation(api.drafts.create, {
      assignmentId,
      content: "Second",
      wordCount: 100,
    });

    const latest = await asA.query(api.drafts.getLatest, { assignmentId });
    expect(latest!.content).toBe("Second");
    expect(latest!.version).toBe(2);
  });

  test("drafts are scoped to user", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    const draftId = await asA.mutation(api.drafts.create, {
      assignmentId,
      content: "Secret draft",
    });

    const result = await asB.query(api.drafts.get, { draftId });
    expect(result).toBeNull();
  });

  test("list blocks for draft", async () => {
    const asA = asUser(t);

    const draftId = await asA.mutation(api.drafts.create, {
      assignmentId,
      content: "Draft",
    });

    await asA.mutation(api.drafts.createBlock, {
      draftId,
      blockType: "body",
      content: "Block 1",
      sortOrder: 0,
    });
    await asA.mutation(api.drafts.createBlock, {
      draftId,
      blockType: "body",
      content: "Block 2",
      sortOrder: 1,
    });

    const blocks = await asA.query(api.drafts.listBlocks, { draftId });
    expect(blocks).toHaveLength(2);
    expect(blocks[0].content).toBe("Block 1");
  });
});

describe("reviews", () => {
  let t: ReturnType<typeof convexTest>;
  let draftId: Id<"drafts">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    const moduleId = await asA.mutation(api.modules.create, {
      title: "Module",
      code: "T101",
    });
    const assignmentId = await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay",
    });
    draftId = await asA.mutation(api.drafts.create, {
      assignmentId,
      content: "Draft content",
    });
  });

  test("create review run and add findings", async () => {
    const asA = asUser(t);

    const runId = await asA.mutation(api.reviews.createRun, { draftId });
    expect(typeof runId).toBe("string");

    await asA.mutation(api.reviews.createFinding, {
      reviewRunId: runId,
      category: "strength",
      content: "Good argument",
      severity: "info",
    });
    await asA.mutation(api.reviews.createFinding, {
      reviewRunId: runId,
      category: "weakness",
      content: "Needs evidence",
      severity: "warning",
    });

    const runWithFindings = await asA.query(api.reviews.getWithFindings, {
      reviewRunId: runId,
    });
    expect(runWithFindings!.findings).toHaveLength(2);
  });

  test("reviews are scoped to user", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    const runId = await asA.mutation(api.reviews.createRun, { draftId });

    const result = await asB.query(api.reviews.get, { reviewRunId: runId });
    expect(result).toBeNull();
  });
});

describe("notes", () => {
  let t: ReturnType<typeof convexTest>;
  let sourceId: Id<"sources">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    const moduleId = await asA.mutation(api.modules.create, {
      title: "Module",
      code: "T101",
    });
    sourceId = await asA.mutation(api.sources.createPlaceholder, {
      moduleId,
      title: "Source",
    });
  });

  test("create and list notes for source", async () => {
    const asA = asUser(t);

    await asA.mutation(api.notes.create, {
      sourceId,
      content: "Key insight from reading",
      tags: ["important", "theory"],
    });

    const notes = await asA.query(api.notes.listForSource, { sourceId });
    expect(notes).toHaveLength(1);
    expect(notes[0].content).toBe("Key insight from reading");
    expect(notes[0].tags).toEqual(["important", "theory"]);
  });

  test("notes are scoped to user", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    await asA.mutation(api.notes.create, {
      sourceId,
      content: "Private note",
    });

    const notes = await asB.query(api.notes.listForSource, { sourceId });
    expect(notes).toHaveLength(0);
  });
});

describe("users", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  test("unauthenticated getCurrentUserProfile returns null", async () => {
    const profile = await t.query(api.users.getCurrentUserProfile, {});
    expect(profile).toBeNull();
  });

  test("upsertCurrentUserProfile creates profile for new user", async () => {
    const asA = asUser(t);
    await asA.mutation(api.users.upsertCurrentUserProfile, {});

    const profile = await asA.query(api.users.getCurrentUserProfile, {});
    expect(profile).not.toBeNull();
    expect(profile!.tokenIdentifier).toBe(TEST_USER.tokenIdentifier);
  });

  test("ensureUserProfile is idempotent", async () => {
    const asA = asUser(t);
    const id1 = await asA.mutation(api.users.ensureUserProfile, {});
    const id2 = await asA.mutation(api.users.ensureUserProfile, {});
    expect(id1).toBe(id2);
  });
});

describe("arguments", () => {
  let t: ReturnType<typeof convexTest>;
  let assignmentId: Id<"assignments">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    const moduleId = await asA.mutation(api.modules.create, {
      title: "Module",
      code: "T101",
    });
    assignmentId = await asA.mutation(api.assignments.create, {
      moduleId,
      title: "Essay",
    });
  });

  test("create and list arguments for assignment", async () => {
    const asA = asUser(t);

    await asA.mutation(api.arguments.create, {
      assignmentId,
      claim: "First argument",
      sortOrder: 0,
    });
    await asA.mutation(api.arguments.create, {
      assignmentId,
      claim: "Second argument",
      sortOrder: 1,
    });

    const args = await asA.query(api.arguments.list, { assignmentId });
    expect(args).toHaveLength(2);
    expect(args[0].claim).toBe("First argument");
  });

  test("arguments are scoped to user", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    const argId = await asA.mutation(api.arguments.create, {
      assignmentId,
      claim: "My argument",
    });

    const result = await asB.query(api.arguments.get, { argumentId: argId });
    expect(result).toBeNull();
  });

  test("create argument nodes", async () => {
    const asA = asUser(t);

    const argId = await asA.mutation(api.arguments.create, {
      assignmentId,
      claim: "Main claim",
    });

    await asA.mutation(api.arguments.createNode, {
      argumentId: argId,
      type: "premise",
      content: "Supporting evidence",
    });

    const nodes = await asA.query(api.arguments.listNodes, { argumentId: argId });
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("premise");
  });
});

describe("cothinker", () => {
  let t: ReturnType<typeof convexTest>;
  let moduleId: Id<"modules">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    moduleId = await asA.mutation(api.modules.create, {
      title: "Module",
      code: "T101",
    });
  });

  test("create session and add messages", async () => {
    const asA = asUser(t);

    const sessionId = await asA.mutation(api.cothinker.createSession, {
      title: "Brainstorm",
      scope: "whole_module",
      moduleId,
    });

    await asA.mutation(api.cothinker.addMessage, {
      sessionId,
      role: "user",
      content: "What are the key themes?",
    });

    await asA.mutation(api.cothinker.addMessage, {
      sessionId,
      role: "assistant",
      content: "The main themes are...",
      labels: ["interpretation"],
    });

    const messages = await asA.query(api.cothinker.listMessages, { sessionId });
    expect(messages).toHaveLength(2);
  });

  test("sessions are scoped to user", async () => {
    const asA = asUser(t);
    const asB = asUser(t, OTHER_USER);

    const sessionId = await asA.mutation(api.cothinker.createSession, {
      title: "Private",
      scope: "whole_module",
      moduleId,
    });

    const result = await asB.query(api.cothinker.getSession, { sessionId });
    expect(result).toBeNull();
  });
});

describe("folders", () => {
  let t: ReturnType<typeof convexTest>;
  let moduleId: Id<"modules">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    moduleId = await asA.mutation(api.modules.create, {
      title: "Module",
      code: "T101",
    });
  });

  test("create custom folder within module", async () => {
    const asA = asUser(t);

    await asA.mutation(api.folders.create, {
      moduleId,
      name: "My Custom Folder",
      type: "custom",
    });

    const folders = await asA.query(api.folders.list, { moduleId });
    expect(folders.length).toBe(8); // 7 default + 1 custom
    const custom = folders.find((f) => f.name === "My Custom Folder");
    expect(custom).toBeDefined();
    expect(custom!.type).toBe("custom");
  });

  test("cannot create folder in other user module", async () => {
    const asB = asUser(t, OTHER_USER);

    await expect(
      asB.mutation(api.folders.create, {
        moduleId,
        name: "Hack",
        type: "custom",
      }),
    ).rejects.toThrow("Not found");
  });
});
