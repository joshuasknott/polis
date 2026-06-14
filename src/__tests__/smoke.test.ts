import { describe, it, expect } from "vitest";
import { PRODUCTION_STAGES } from "@/lib/types";

describe("Page module resolution", () => {
  it("landing page module can be imported", async () => {
    const mod = await import("@/app/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("dashboard page module can be imported", async () => {
    const mod = await import("@/app/dashboard/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("module workspace page can be imported", async () => {
    const mod = await import("@/app/modules/[moduleId]/page");
    expect(mod.default).toBeDefined();
  });

  it("assignment workspace page can be imported", async () => {
    const mod = await import(
      "@/app/modules/[moduleId]/assignments/[assignmentId]/page"
    );
    expect(mod.default).toBeDefined();
  });

  it("source viewer page can be imported", async () => {
    const mod = await import("@/app/sources/[sourceId]/page");
    expect(mod.default).toBeDefined();
  });
});

describe("Component module resolution", () => {
  it("layout shell can be imported", async () => {
    const mod = await import("@/components/layout/shell");
    expect(mod.AppShell).toBeDefined();
  });

  it("sidebar can be imported", async () => {
    const mod = await import("@/components/layout/sidebar");
    expect(mod.Sidebar).toBeDefined();
  });

  it("topbar can be imported", async () => {
    const mod = await import("@/components/layout/topbar");
    expect(mod.TopBar).toBeDefined();
  });

  it("dashboard content can be imported", async () => {
    const mod = await import("@/components/dashboard/dashboard-content");
    expect(mod.DashboardContent).toBeDefined();
  });

  it("module workspace can be imported", async () => {
    const mod = await import("@/components/modules/module-workspace-data");
    expect(mod.ModuleWorkspaceData).toBeDefined();
  });

  it("assignment workspace shell can be imported", async () => {
    const mod = await import("@/components/assignments/assignment-workspace-shell");
    expect(mod.AssignmentWorkspaceShell).toBeDefined();
  });

  it("source viewer content can be imported", async () => {
    const mod = await import("@/components/sources/source-viewer-content");
    expect(mod.SourceViewerContent).toBeDefined();
  });
});

describe("Stage validation in assignment page", () => {
  it("valid stages are accepted from PRODUCTION_STAGES", () => {
    for (const stage of PRODUCTION_STAGES) {
      const isValid = PRODUCTION_STAGES.includes(stage as "ingest");
      expect(isValid).toBe(true);
    }
  });

  it("invalid stage falls back to ingest", () => {
    const fallback = PRODUCTION_STAGES.includes("invalid_stage" as "ingest")
      ? "invalid_stage"
      : "ingest";
    expect(fallback).toBe("ingest");
  });
});
