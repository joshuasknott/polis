"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Invalid email or password");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <GraduationCap className="h-8 w-8 text-accent" />
          <span className="text-2xl font-bold tracking-tight">SocialSciencr</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold text-center mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="alex.chen@university.ac.uk"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="password123"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground text-center">
              Demo credentials: <strong>alex.chen@university.ac.uk</strong> / <strong>password123</strong>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Phase 1 - Credentials auth for development
        </p>
      </div>
    </div>
  );
}
