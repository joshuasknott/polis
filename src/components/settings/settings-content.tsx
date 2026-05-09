"use client";

import { useState } from "react";
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
  Save,
  Loader2,
  Trash2,
  Link2,
  BarChart3,
} from "lucide-react";

interface SettingsContentProps {
  user: {
    name: string;
    email: string;
    university: string;
    course: string;
    yearOfStudy: number | null;
  };
  preferences: Record<string, string>;
  aiConfigured: boolean;
  providerName: string;
  modelName: string;
  hasEmbeddings: boolean;
  connections: Array<{
    provider: string;
    status: string;
    modelPreference: string | null;
    hasKey: boolean;
  }>;
  linkedProviders: string[];
  hasPassword: boolean;
}

type SettingsTab = "profile" | "ai" | "connections" | "academic" | "features";

export function SettingsContent({
  user,
  preferences,
  aiConfigured,
  providerName,
  modelName,
  hasEmbeddings,
  connections,
  linkedProviders,
  hasPassword,
}: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { id: "connections", label: "AI Keys", icon: <Key className="h-4 w-4" /> },
    { id: "ai", label: "AI Layer", icon: <Zap className="h-4 w-4" /> },
    { id: "academic", label: "Academic", icon: <Shield className="h-4 w-4" /> },
    { id: "features", label: "Features", icon: <Database className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, AI provider connections, and preferences.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <ProfileSection user={user} preferences={preferences} hasPassword={hasPassword} linkedProviders={linkedProviders} />
      )}
      {activeTab === "connections" && (
        <ConnectionsSection connections={connections} />
      )}
      {activeTab === "ai" && (
        <AILayerSection aiConfigured={aiConfigured} providerName={providerName} modelName={modelName} hasEmbeddings={hasEmbeddings} />
      )}
      {activeTab === "academic" && (
        <AcademicIntegritySection />
      )}
      {activeTab === "features" && (
        <FeatureStatusSection aiConfigured={aiConfigured} hasEmbeddings={hasEmbeddings} />
      )}
    </div>
  );
}

function ProfileSection({ user, preferences, hasPassword, linkedProviders }: {
  user: SettingsContentProps["user"];
  preferences: Record<string, string>;
  hasPassword: boolean;
  linkedProviders: string[];
}) {
  const [name, setName] = useState(user.name);
  const [university, setUniversity] = useState(user.university);
  const [course, setCourse] = useState(user.course);
  const [yearOfStudy, setYearOfStudy] = useState(user.yearOfStudy?.toString() || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [defaultAiMode, setDefaultAiMode] = useState(preferences.defaultAiMode || "understand");
  const [citationStyle, setCitationStyle] = useState(preferences.citationStyle || "harvard");
  const [prefSaving, setPrefSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    setMessage({ type: "success", text: "Profile changes are local until Convex auth is wired" });
    setSaving(false);
  }

  async function changePassword() {
    setPasswordSaving(true);
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      setPasswordSaving(false);
      return;
    }
    void currentPassword;
    setPasswordMessage({ type: "error", text: "Password auth is paused during the Convex migration" });
    setPasswordSaving(false);
  }

  async function savePreferences() {
    setPrefSaving(true);
    void defaultAiMode;
    void citationStyle;
    setPrefSaving(false);
  }

  return (
    <div className="space-y-6">
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={user.email}
              className="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
              readOnly
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">University</label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. University of Manchester"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Course</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Politics and International Relations"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Year of Study</label>
            <select
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Not set</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
              <option value="5">Postgraduate</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Profile
          </button>
          {message && (
            <span className={`text-xs ${message.type === "success" ? "text-success" : "text-danger"}`}>
              {message.text}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Link2 className="h-4 w-4 text-accent" />
          Connected Accounts
        </h2>
        <div className="mt-4 space-y-2">
          {[
            { name: "Email & Password", id: "credentials", linked: hasPassword },
            { name: "GitHub", id: "github", linked: linkedProviders.includes("github") },
            { name: "Google", id: "google", linked: linkedProviders.includes("google") },
          ].map((account) => (
            <div key={account.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <span className="text-sm">{account.name}</span>
              <span className={`text-xs ${account.linked ? "text-success" : "text-muted-foreground"}`}>
                {account.linked ? "Connected" : "Not linked"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {hasPassword && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-accent" />
            Change Password
          </h2>
          <div className="mt-4 space-y-3 max-w-sm">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={changePassword}
              disabled={passwordSaving}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {passwordSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              Change Password
            </button>
            {passwordMessage && (
              <p className={`text-xs ${passwordMessage.type === "success" ? "text-success" : "text-danger"}`}>
                {passwordMessage.text}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Brain className="h-4 w-4 text-accent" />
          Preferences
        </h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Default CoThinker Stage</label>
            <select
              value={defaultAiMode}
              onChange={(e) => { setDefaultAiMode(e.target.value); }}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ingest">Ingest</option>
              <option value="understand">Understand</option>
              <option value="map">Map</option>
              <option value="judge">Judge</option>
              <option value="build">Build</option>
              <option value="draft">Draft</option>
              <option value="refine">Refine</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Citation Style</label>
            <select
              value={citationStyle}
              onChange={(e) => { setCitationStyle(e.target.value); }}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="harvard">Harvard</option>
              <option value="apa">APA</option>
              <option value="chicago">Chicago</option>
              <option value="mla">MLA</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={savePreferences}
            disabled={prefSaving}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {prefSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Preferences
          </button>
        </div>
      </section>
    </div>
  );
}

function ConnectionsSection({ connections }: { connections: SettingsContentProps["connections"] }) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [modelPref, setModelPref] = useState("");
  const [message, setMessage] = useState<{ provider: string; type: "success" | "error"; text: string } | null>(null);

  const providerConfig = [
    { id: "zai", name: "z.ai", models: ["glm-4.5", "glm-4.5-air"], defaultModel: "glm-4.5-air" },
  ];

  async function saveKey(providerId: string) {
    setConnecting(providerId);
    setMessage(null);
    void apiKey;
    void modelPref;
    setMessage({ provider: providerId, type: "error", text: "Runtime AI provider connections will be rebuilt after Convex auth" });
    setConnecting(null);
  }

  async function removeKey(providerId: string) {
    setMessage({ provider: providerId, type: "error", text: "Runtime AI provider connections are paused during migration" });
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Key className="h-4 w-4 text-accent" />
          AI Provider Connections (BYO API Key)
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Bring your own API key to enable AI features. Keys are encrypted at rest and never sent to the client.
        </p>

        <div className="mt-4 space-y-4">
          {providerConfig.map((pc) => {
            const conn = connections.find((c) => c.provider === pc.id);
            const isConnected = conn?.status === "connected";
            const isEditing = connecting === pc.id;

            return (
              <div key={pc.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isConnected
                          ? `Connected${conn?.modelPreference ? ` — ${conn.modelPreference}` : ` — ${pc.defaultModel}`}`
                          : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          <CheckCircle className="h-3 w-3" />
                          Connected
                        </span>
                        <button
                          onClick={() => removeKey(pc.id)}
                          className="rounded p-1 text-muted-foreground hover:text-danger transition-colors"
                          title="Remove key"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                        <XCircle className="h-3 w-3" />
                        Disconnected
                      </span>
                    )}
                  </div>
                </div>

                {!isConnected && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="password"
                      placeholder="Enter your API key"
                      value={connecting === pc.id ? apiKey : ""}
                      onChange={(e) => setApiKey(e.target.value)}
                      onFocus={() => setConnecting(pc.id)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <select
                      value={connecting === pc.id ? modelPref : ""}
                      onChange={(e) => setModelPref(e.target.value)}
                      onFocus={() => setConnecting(pc.id)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Default model ({pc.defaultModel})</option>
                      {pc.models.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {isEditing && apiKey && (
                      <button
                        onClick={() => saveKey(pc.id)}
                        disabled={connecting === pc.id && !apiKey}
                        className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        Save & Validate
                      </button>
                    )}
                  </div>
                )}

                {message?.provider === pc.id && (
                  <p className={`mt-2 text-xs ${message.type === "success" ? "text-success" : "text-danger"}`}>
                    {message.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AILayerSection({ aiConfigured: _aiConfigured, providerName: _providerName, modelName: _modelName, hasEmbeddings: _hasEmbeddings }: {
  aiConfigured: boolean;
  providerName: string;
  modelName: string;
  hasEmbeddings: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Zap className="h-4 w-4 text-accent" />
        AI Intelligence Layer
      </h2>
      <p className="mt-2 text-xs text-muted-foreground">
        Intelligence features powered by LLM providers. Connect your own API key above.
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
                Not configured (paused)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
              <XCircle className="h-3 w-3" />
              Not Connected
            </span>
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
                Requires AI connection (paused)
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
          >
            Inactive
          </span>
        </div>

        <Link href="/settings/usage">
          <div className="flex items-center justify-between rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Usage Analytics</p>
                <p className="text-xs text-muted-foreground">View token usage and cost estimates</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
        <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <p className="font-medium">Configuration</p>
          <p className="mt-0.5">
            Runtime AI keys are paused during the Convex migration. z.ai/Zhipu provider support will be added later.
          </p>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

function AcademicIntegritySection() {
  return (
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
  );
}

function FeatureStatusSection({ aiConfigured: _aiConfigured, hasEmbeddings: _hasEmbeddings }: { aiConfigured: boolean; hasEmbeddings: boolean }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-accent" />
          Feature Status
        </h2>
        <div className="mt-4 space-y-2">
          {[
            { label: "Convex backend foundation", enabled: true },
            { label: "Authentication", enabled: false },
            { label: "File Upload (PDF, DOCX, TXT, MD)", enabled: false },
            { label: "Text Extraction", enabled: false },
            { label: "Source Chunking", enabled: false },
            { label: "Keyword Retrieval", enabled: false },
            { label: "Runtime AI Provider", enabled: false },
            { label: "BYO API Key storage", enabled: false },
            { label: "Vector Embeddings / Semantic Search", enabled: false },
            { label: "Hybrid Retrieval (semantic + keyword)", enabled: false },
            { label: "LLM-Powered Source-Grounded CoThinker", enabled: false },
            { label: "Auto-Generated Source Summaries", enabled: false },
            { label: "Citation Safety Check", enabled: false },
            { label: "Draft Review with Rubric Analysis", enabled: false },
            { label: "Conversation Memory (multi-turn)", enabled: false },
            { label: "Template Fallback (no API key needed)", enabled: false },
            { label: "Background File Processing", enabled: false },
            { label: "Source Notes", enabled: true },
            { label: "Usage Analytics", enabled: false },
            { label: "Rate Limiting", enabled: false },
            { label: "Draft Editor", enabled: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <CheckCircle className={`h-4 w-4 ${item.enabled ? "text-success" : "text-muted-foreground"}`} />
              <span className={item.enabled ? "" : "text-muted-foreground"}>{item.label}</span>
              <span className={`text-xs ${item.enabled ? "text-success" : "text-muted-foreground"}`}>
                {item.enabled ? "Active" : "Paused"}
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
            "Assignments",
            "Argument Maps",
            "Drafts and Reviews",
            "Submissions",
          ].map((folder, i) => (
            <div key={folder} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
              {folder}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
