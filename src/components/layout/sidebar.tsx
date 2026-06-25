"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Cog,
  Info,
  LayoutDashboard,
  Settings,
  X,
  ArrowLeft,
} from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { PolisMark } from "@/components/brand/polis-mark";

const topLevelNavigation = [
  { name: "Workspaces", href: "/dashboard", icon: LayoutDashboard },
];

const moduleNavigation = [
  { name: "Module Info", id: "module-info", icon: Info, hrefSuffix: "" },
  { name: "Sources", id: "sources", icon: BookOpen, hrefSuffix: "?tab=sources" },
  { name: "Assignments", id: "assignments", icon: ClipboardList, hrefSuffix: "?tab=assignments" },
] as const;

const moduleSettings = {
  name: "Settings",
  id: "settings",
  icon: Cog,
  hrefSuffix: "?tab=settings",
} as const;

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
          <button onClick={onClose} className="rounded p-2 hover:bg-muted" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {moduleContext ? (
        <ModuleNav moduleContext={moduleContext} onClose={onClose} />
      ) : (
        <>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
            {topLevelNavigation.map((item) => {
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
            })}
          </nav>

          <div className="space-y-1 border-t border-border p-3">
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
            <AccountBlock isLoaded={isLoaded} isSignedIn={isSignedIn} />
          </div>
        </>
      )}
    </aside>
  );
}

function ModuleNav({
  moduleContext,
  onClose,
}: {
  moduleContext: ModuleNavContext;
  onClose?: () => void;
}) {
  const initials = moduleContext.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "W";

  return (
    <>
      <nav className="flex flex-1 flex-col overflow-y-auto p-3 scrollbar-thin">
        <div className="mb-4 px-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={onClose}
          >
            <ArrowLeft className="h-3 w-3" />
            Workspaces
          </Link>
        </div>
        <div className="mb-4 px-2">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
              style={{ backgroundColor: moduleContext.colour || "#162A4A" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                {moduleContext.title}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Workspace
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-0.5">
          {moduleNavigation.map((item) => (
            <ModuleNavLink
              key={item.id}
              item={item}
              moduleContext={moduleContext}
              onClose={onClose}
            />
          ))}
        </div>
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <ModuleNavLink
          item={moduleSettings}
          moduleContext={moduleContext}
          onClose={onClose}
        />
        <AccountBlock />
      </div>
    </>
  );
}

function ModuleNavLink({
  item,
  moduleContext,
  onClose,
}: {
  item: {
    name: string;
    id: string;
    icon: React.ElementType;
    hrefSuffix: string;
  };
  moduleContext: ModuleNavContext;
  onClose?: () => void;
}) {
  const isActive = moduleContext.activeTab === item.id;
  return (
    <Link
      href={`/modules/${moduleContext.id}${item.hrefSuffix}`}
      onClick={onClose}
      className={cn(
        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 pl-4 text-sm font-medium transition-colors",
        isActive
          ? "bg-gold-soft/40 text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isActive &&
          "before:absolute before:left-1.5 before:bottom-2.5 before:top-2.5 before:w-0.5 before:rounded before:bg-gold",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.name}
    </Link>
  );
}

function AccountBlock({
  isLoaded: providedLoaded,
  isSignedIn: providedSignedIn,
}: {
  isLoaded?: boolean;
  isSignedIn?: boolean;
}) {
  const userState = useUser();
  const isLoaded = providedLoaded ?? userState.isLoaded;
  const isSignedIn = providedSignedIn ?? userState.isSignedIn;

  if (isLoaded && isSignedIn) {
    return (
      <div className="mt-2 flex items-center gap-2.5 px-3 py-2">
        <UserButton />
        <span className="truncate text-sm text-muted-foreground">Signed in</span>
      </div>
    );
  }

  if (isLoaded && !isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
          <LayoutDashboard className="h-4 w-4" />
          <span>Sign in</span>
        </button>
      </SignInButton>
    );
  }

  return <div className="mt-2 px-3 py-2 text-xs text-muted-foreground">Loading...</div>;
}
