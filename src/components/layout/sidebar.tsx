"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  X,
  Home,
  Upload,
  ClipboardList,
  BookOpen,
  Cog,
  ArrowLeft,
} from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { PolisMark } from "@/components/brand/polis-mark";

const topLevelNavigation = [
  { name: "Workspaces", href: "/dashboard", icon: LayoutDashboard },
];

const moduleNavigation = [
  { name: "Home", id: "home", icon: Home },
  { name: "Imports", id: "imports", icon: Upload },
  { name: "Assessments", id: "assessments", icon: ClipboardList },
  { name: "Knowledge Base", id: "knowledge-base", icon: BookOpen },
  { name: "Workspace Settings", id: "settings", icon: Cog },
];

export interface ModuleNavContext {
  id: string;
  title: string;
  code: string;
  colour?: string;
  description?: string;
  activeTab?: string;
}

export function Sidebar({
  onClose,
  moduleContext,
}: {
  onClose?: () => void;
  moduleContext?: ModuleNavContext;
}) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-muted/30">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <Link href="/" className="-m-2 flex items-center p-2 text-foreground" aria-label="Polis home">
          <PolisMark iconClassName="h-5 w-5" textClassName="h-4" priority />
        </Link>
        {onClose && (
          <button onClick={onClose} className="rounded p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {moduleContext ? (
          <>
            <div className="mb-4 px-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Workspaces
              </Link>
            </div>
            <div className="px-2 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-7 w-7 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: moduleContext.colour || "#000" }}
                >
                  {moduleContext.code?.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold truncate block text-foreground">
                    {moduleContext.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {moduleContext.code}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-0.5">
              {moduleNavigation.map((item) => {
                const isActive = moduleContext.activeTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={`/modules/${moduleContext.id}?tab=${item.id}`}
                    onClick={onClose}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-lg px-3 py-2 pl-4 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gold-soft/40 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isActive &&
                        "before:absolute before:left-1.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:rounded before:bg-gold",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          topLevelNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-lg px-3 py-2 pl-4 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gold-soft/40 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isActive &&
                    "before:absolute before:left-1.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:rounded before:bg-gold",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })
        )}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/settings"
          onClick={onClose}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
        {isLoaded && isSignedIn ? (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-2">
            <UserButton />
            <span className="text-sm text-muted-foreground truncate">Signed in</span>
          </div>
        ) : isLoaded && !isSignedIn ? (
          <SignInButton mode="modal">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 mt-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <LayoutDashboard className="h-4 w-4" />
              <span>Sign in</span>
            </button>
          </SignInButton>
        ) : (
          <div className="px-3 py-2 mt-2 text-xs text-muted-foreground">Loading...</div>
        )}
      </div>
    </aside>
  );
}
