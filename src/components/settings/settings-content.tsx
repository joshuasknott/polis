"use client";

import {
  User,
  Key,
  Shield,
  FolderOpen,
  Brain,
  Lock,
  Database,
  CheckCircle,
} from "lucide-react";

interface SettingsContentProps {
  user: {
    name: string;
    email: string;
  };
}

export function SettingsContent({ user }: SettingsContentProps) {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, AI provider connections, and preferences.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <User className="h-4 w-4 text-accent" />
          Profile
        </h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input
              type="text"
              defaultValue={user.name}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              readOnly
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              defaultValue={user.email}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              readOnly
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Profile editing will be available in a future update.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Key className="h-4 w-4 text-accent" />
          AI Provider Connections
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Connect your own API key to enable AI-powered features. All API calls are made server-side.
        </p>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-medium">Security Notice</p>
            <p className="mt-0.5">
              API keys are encrypted at rest and stored server-side only.
              They are never included in client-side JavaScript bundles.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {[
            { provider: "OpenAI", model: "gpt-4o" },
            { provider: "Anthropic", model: "claude-sonnet-4-20250514" },
            { provider: "Google Gemini", model: "gemini-2.5-pro" },
          ].map((p) => (
            <div key={p.provider} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{p.provider}</p>
                  <p className="text-xs text-muted-foreground">Model: {p.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  Not Connected
                </span>
                <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          AI provider connections will be available when real AI integration is enabled.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-accent" />
          Phase 1 Status
        </h2>
        <div className="mt-4 space-y-2">
          {[
            { label: "Database (PostgreSQL + Prisma)", enabled: true },
            { label: "Authentication (Auth.js)", enabled: true },
            { label: "File Upload (PDF, DOCX, TXT, MD)", enabled: true },
            { label: "Text Extraction", enabled: true },
            { label: "Source Chunking", enabled: true },
            { label: "Keyword Retrieval", enabled: true },
            { label: "Source-Grounded Assistant (retrieval-aware)", enabled: true },
            { label: "Essay/Evidence Persistence", enabled: true },
            { label: "Real AI Provider (OpenAI/Anthropic/Gemini)", enabled: false },
            { label: "Vector Embeddings / Semantic Search", enabled: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <CheckCircle className={`h-4 w-4 ${item.enabled ? "text-green-600" : "text-muted-foreground"}`} />
              <span className={item.enabled ? "" : "text-muted-foreground"}>{item.label}</span>
              <span className={`text-xs ${item.enabled ? "text-green-700" : "text-muted-foreground"}`}>
                {item.enabled ? "Active" : "Coming Soon"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FolderOpen className="h-4 w-4 text-accent" />
          Default Module Folders
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          These folders are created automatically when you create a new module.
        </p>
        <div className="mt-4 space-y-1.5">
          {[
            "Module Info",
            "Readings",
            "Lecture and Seminar Material",
            "Source Notes",
            "Essay Plans",
            "Drafts and Feedback",
            "Final Submission",
          ].map((folder, i) => (
            <div key={folder} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
              {folder}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-4 w-4 text-accent" />
          Academic Integrity Settings
        </h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="rounded border-border" />
            <span>Always show source-supported labels on AI responses</span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="rounded border-border" />
            <span>Warn when evidence is insufficient</span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="rounded border-border" />
            <span>Flag unsupported claims in draft reviews</span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="rounded border-border" />
            <span>Show academic integrity reminder when using AI tools</span>
          </label>
        </div>
      </section>
    </div>
  );
}
