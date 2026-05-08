"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Library,

  MessageSquare,
  Settings,
  Wrench,
  X,
} from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sources", href: "/sources", icon: Library },
  { name: "Tools", href: "/tools", icon: Wrench },
  { name: "Assistant", href: "/assistant", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  onClose,
}: {
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <GraduationCap className="h-6 w-6 text-accent" />
        <span className="text-base font-semibold tracking-tight">Polis</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto lg:hidden rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {navigation.map((item) => {
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
        })}
      </nav>

      <div className="border-t border-border p-3">
        {isLoaded && isSignedIn ? (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <UserButton />
            <span className="text-sm text-muted-foreground truncate">Signed in</span>
          </div>
        ) : isLoaded && !isSignedIn ? (
          <SignInButton mode="modal">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <BookOpen className="h-4 w-4" />
              <span>Sign in</span>
            </button>
          </SignInButton>
        ) : (
          <div className="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
        )}
      </div>
    </aside>
  );
}
