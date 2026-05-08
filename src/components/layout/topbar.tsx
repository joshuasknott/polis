"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sidebar } from "./sidebar";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";

export function TopBar() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
          Polis Workspace
        </h2>
      </div>
      <div className="flex items-center gap-3">
        {isLoaded && isSignedIn ? (
          <UserButton />
        ) : isLoaded ? (
          <SignInButton mode="modal">
            <button className="inline-flex items-center rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity">
              Sign in
            </button>
          </SignInButton>
        ) : null}
      </div>
    </header>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image 
            src="/brand/polis-wordmark.png" 
            alt="Polis" 
            width={90} 
            height={24} 
            className="h-6 w-auto object-contain" 
            priority
          />
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
            <Sidebar onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
