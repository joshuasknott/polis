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
  XCircle,
  Zap,
} from "lucide-react";

interface SettingsContentProps {
  user: {
    name: string;
    email: string;
  };
  aiConfigured: boolean;
  providerName: string;
  modelName: string;
  hasEmbeddings: boolean;
}

export function SettingsContent({
  user,
  aiConfigured,
  providerName,
  modelName,
  hasEmbeddings,
}: SettingsContentProps) {
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
          <Zap className="h-4 w-4 text-accent" />
          AI Intelligence Layer
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Phase 2 intelligence features powered by LLM providers.
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <Brain className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">AI Provider</p>
                <p className="text-xs text-muted-foreground">
                  {aiConfigured
                    ? `${providerName} — ${modelName}`
                    : "Not configured"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {aiConfigured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  <XCircle className="h-3 w-3" />
                  Not Connected
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <Database className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Vector Embeddings</p>
                <p className="text-xs text-muted-foreground">
                  {hasEmbeddings ? "text-embedding-3-small (1536d)" : "Requires OpenAI API key"}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                hasEmbeddings
                  ? "bg-green-100 text-green-700"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {hasEmbeddings ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-medium">Configuration</p>
            <p className="mt-0.5">
              Set OPENAI_API_KEY in your .env file to enable AI features. All API calls are server-side only.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Key className="h-4 w-4 text-accent" />
          AI Provider Connections
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Connect your own API key to enable AI-powered features. All API calls are made server-side.
        </p>

        <div className="mt-4 space-y-3">
          {[
            { provider: "OpenAI", model: "gpt-4o-mini", key: "OPENAI_API_KEY", connected: providerName === "openai" && aiConfigured },
            { provider: "Anthropic", model: "claude-sonnet-4-20250514", key: "ANTHROPIC_API_KEY", connected: providerName === "anthropic" && aiConfigured },
            { provider: "Google Gemini", model: "gemini-2.5-pro", key: "GOOGLE_AI_API_KEY", connected: false },
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
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.connected
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.connected ? "Connected" : "Not Connected"}
                </span>
                <span className="text-xs text-muted-foreground">Set {p.key}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-accent" />
          Feature Status
        </h2>
        <div className="mt-4 space-y-2">
          {[
            { label: "Database (PostgreSQL + Prisma)", enabled: true },
            { label: "Authentication (Auth.js)", enabled: true },
            { label: "File Upload (PDF, DOCX, TXT, MD)", enabled: true },
            { label: "Text Extraction", enabled: true },
            { label: "Source Chunking", enabled: true },
            { label: "Keyword Retrieval", enabled: true },
            { label: "Real AI Provider (OpenAI/Anthropic)", enabled: aiConfigured },
            { label: "Vector Embeddings / Semantic Search", enabled: hasEmbeddings },
            { label: "Hybrid Retrieval (semantic + keyword)", enabled: hasEmbeddings },
            { label: "LLM-Powered Source-Grounded Assistant", enabled: aiConfigured },
            { label: "Auto-Generated Source Summaries", enabled: aiConfigured },
            { label: "Citation Safety Check", enabled: aiConfigured },
            { label: "Draft Review with Rubric Analysis", enabled: aiConfigured },
            { label: "Conversation Memory (multi-turn)", enabled: true },
            { label: "Template Fallback (no API key needed)", enabled: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <CheckCircle className={`h-4 w-4 ${item.enabled ? "text-green-600" : "text-muted-foreground"}`} />
              <span className={item.enabled ? "" : "text-muted-foreground"}>{item.label}</span>
              <span className={`text-xs ${item.enabled ? "text-green-700" : "text-muted-foreground"}`}>
                {item.enabled ? "Active" : "Needs API Key"}
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
