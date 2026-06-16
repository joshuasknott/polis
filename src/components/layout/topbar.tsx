"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "./sidebar";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import type { ModuleContext } from "./shell";
import { PolisMark } from "@/components/brand/polis-mark";

export function TopBar({ moduleContext }: { moduleContext?: ModuleContext }) {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header className="polis-gold-rule sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-4">
        {moduleContext ? (
          <h2 className="text-sm font-medium text-foreground hidden sm:block">
            {moduleContext.code} &middot; {moduleContext.title}
          </h2>
        ) : (
          <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
            Polis Workspace
          </h2>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isLoaded && isSignedIn ? (
          <UserButton />
        ) : isLoaded ? (
          <SignInButton mode="modal">
            <button className="inline-flex min-h-8 items-center rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity">
              Sign in
            </button>
          </SignInButton>
        ) : null}
      </div>
    </header>
  );
}

export function MobileNav({ moduleContext }: { moduleContext?: ModuleContext }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <Link href="/dashboard" className="-m-2 flex items-center gap-2 p-2 text-foreground" aria-label="Polis dashboard">
          <PolisMark iconClassName="h-5 w-5" textClassName="h-4" priority />
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-full w-60">
            <Sidebar onClose={() => setOpen(false)} moduleContext={moduleContext} />
          </div>
        </>
      )}
    </div>
  );
}
