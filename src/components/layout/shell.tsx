"use client";

import { Sidebar } from "./sidebar";
import { TopBar, MobileNav } from "./topbar";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <div className="fixed left-0 top-0 z-40 h-screen w-60">
          <Sidebar />
        </div>
      </div>
      <MobileNav />
      <div className="lg:pl-60">
        <TopBar />
        <main className="p-4 sm:p-6 pt-20 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
