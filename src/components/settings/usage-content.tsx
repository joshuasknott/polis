"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, BarChart3, DollarSign, Zap, Activity, Loader2 } from "lucide-react";

export function UsageContent() {
  const dashboard = useQuery(api.usage.getDashboardStats);
  const rateLimitStatus = useQuery(api.rateLimits.getRateLimitStatus, {});

  if (dashboard === undefined) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-2">Usage Analytics</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const stats = dashboard;
  const isEmpty = stats.allTime.count === 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Settings
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Usage Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your AI API usage, token consumption, and estimated costs.
        </p>
      </div>

      {isEmpty && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Activity className="h-8 w-8 mx-auto text-muted-foreground" />
          <h2 className="mt-3 text-sm font-semibold">No usage data yet</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Usage events will appear here once you start using AI features like CoThinker, source analysis, or draft review.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Zap className="h-4 w-4" />
            This Month
          </div>
          <p className="mt-2 text-2xl font-bold">
            {((stats.thisMonth.tokensIn + stats.thisMonth.tokensOut) / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-muted-foreground">tokens</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Est. Cost
          </div>
          <p className="mt-2 text-2xl font-bold">
            ${stats.thisMonth.costEstimate.toFixed(4)}
          </p>
          <p className="text-xs text-muted-foreground">this month</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Activity className="h-4 w-4" />
            API Calls
          </div>
          <p className="mt-2 text-2xl font-bold">{stats.thisMonth.count}</p>
          <p className="text-xs text-muted-foreground">this month</p>
        </div>
      </div>

      {rateLimitStatus && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Zap className="h-4 w-4" />
            Rate Limit
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{rateLimitStatus.requestsRemaining} requests remaining</span>
                <span>{rateLimitStatus.limit} per minute</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{
                    width: `${Math.min(100, (rateLimitStatus.requestsRemaining / rateLimitStatus.limit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-accent" />
          All-Time Summary
        </h2>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total API calls</span>
            <span className="font-medium">{stats.allTime.count}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total tokens</span>
            <span className="font-medium">{(stats.allTime.tokensIn + stats.allTime.tokensOut).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total estimated cost</span>
            <span className="font-medium">${stats.allTime.costEstimate.toFixed(4)}</span>
          </div>
        </div>
      </section>

      {stats.byType.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Usage by Type</h2>
          <div className="mt-4 space-y-2">
            {stats.byType.map((item) => (
              <div key={item.type} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium capitalize">{item.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{item.count} calls</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{((item.tokensIn + item.tokensOut) / 1000).toFixed(1)}k tokens</p>
                  <p className="text-xs text-muted-foreground">${item.costEstimate.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.byModel.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Usage by Model</h2>
          <div className="mt-4 space-y-2">
            {stats.byModel.map((m) => (
              <div key={m.model} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{m.model}</p>
                  <p className="text-xs text-muted-foreground">{m.count} calls</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{((m.tokensIn + m.tokensOut) / 1000).toFixed(1)}k tokens</p>
                  <p className="text-xs text-muted-foreground">${m.costEstimate.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.retrievalBreakdown.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Retrieval Mode Breakdown (30 days)</h2>
          <div className="mt-4 flex gap-3">
            {stats.retrievalBreakdown.map((r) => (
              <div key={r.mode} className="rounded-lg border border-border px-4 py-2">
                <p className="text-xs text-muted-foreground capitalize">{r.mode}</p>
                <p className="text-sm font-medium">{r.count} queries</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.recentLogs.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
          <div className="mt-4 space-y-2">
            {stats.recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted capitalize">{log.type.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">{log.model || "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{log.tokensIn + log.tokensOut} tokens</span>
                  <span>${log.costEstimate.toFixed(4)}</span>
                  <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
