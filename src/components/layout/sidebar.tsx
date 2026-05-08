"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  MessageSquare,
  Settings,
  Wrench,
  X,
  Info,
  StickyNote,
  PenTool,
  ArrowLeft,
} from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Workspaces", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sources", href: "/sources", icon: Library },
  { name: "Workbench", href: "/tools", icon: Wrench },
  { name: "CoThinker", href: "/assistant", icon: MessageSquare },
];

export function Sidebar({
  onClose,
  moduleContext,
}: {
  onClose?: () => void;
  moduleContext?: {
    id: string;
    title: string;
    code: string;
    colour?: string;
    activeTab?: string;
  };
}) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-muted/30">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <Link href="/" className="flex items-center">
          <Image 
            src="/brand/polis-wordmark.svg" 
            alt="Polis" 
            width={96} 
            height={24} 
            className="h-5 w-auto" 
            priority
          />
        </Link>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
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
                  <span className="text-sm font-semibold truncate block text-foreground">{moduleContext.title}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{moduleContext.code}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-0.5">
              {[
                { name: "Overview", id: "overview", icon: Info, href: `/modules/${moduleContext.id}?tab=overview` },
                { name: "Sources", id: "sources", icon: BookOpen, href: `/modules/${moduleContext.id}?tab=sources` },
                { name: "Notes", id: "notes", icon: StickyNote, href: `/modules/${moduleContext.id}?tab=notes` },
                { name: "Assignments", id: "assignments", icon: PenTool, href: `/modules/${moduleContext.id}?tab=assignments` },
              ].map((item) => {
                const isActive = moduleContext.activeTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
          navigation.filter(item => {
            if (pathname === "/dashboard") {
              return !["Sources", "Workbench", "CoThinker"].includes(item.name);
            }
            return true;
          }).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href.split("?")[0]));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              <BookOpen className="h-4 w-4" />
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
