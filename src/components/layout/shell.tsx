"use client";

import { Sidebar, type ModuleNavContext } from "./sidebar";
import { TopBar, MobileNav } from "./topbar";

export type ModuleContext = ModuleNavContext;

export function AppShell({
  children,
  moduleContext,
}: {
  children: React.ReactNode;
  moduleContext?: ModuleContext;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <div className="fixed left-0 top-0 z-40 h-screen w-60">
          <Sidebar moduleContext={moduleContext} />
        </div>
      </div>
      <MobileNav moduleContext={moduleContext} />
      <div className="lg:pl-60">
        <TopBar moduleContext={moduleContext} />
        <main className="p-4 sm:p-6 pt-20 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
