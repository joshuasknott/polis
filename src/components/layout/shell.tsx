"use client";

import { Sidebar } from "./sidebar";
import { TopBar, MobileNav } from "./topbar";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>
      <MobileNav />
      <div className="lg:pl-60">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
