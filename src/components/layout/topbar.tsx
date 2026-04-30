"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Phase 1 Workspace
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          Database Connected
        </span>
      </div>
    </header>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 top-4 z-50 rounded-lg bg-card p-2 shadow-md border border-border"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
          <div className="fixed right-0 top-0 h-full w-64 bg-card border-l border-border p-6 pt-16">
            <Link href="/" className="flex items-center gap-2 mb-6" onClick={() => setOpen(false)}>
              <GraduationCap className="h-5 w-5 text-accent" />
              <span className="font-semibold">SocialSciencr</span>
            </Link>
            <nav className="space-y-2">
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Sources", href: "/sources" },
                { name: "Tools", href: "/tools" },
                { name: "Assistant", href: "/assistant" },
                { name: "Settings", href: "/settings" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
