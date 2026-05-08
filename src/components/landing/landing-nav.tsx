"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

const NAV_LINKS = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Compare", href: "#compare" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: prefersReducedMotion ? 0 : -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 inset-x-0 z-50 backdrop-blur-2xl border-b transition-shadow duration-300 ${
        scrolled
          ? "bg-white/85 border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,40,77,0.06)]"
          : "bg-white/70 border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Polis home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/polis-icon.svg"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0"
            aria-hidden="true"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/polis-wordmark.svg"
            alt="Polis"
            width={64}
            height={20}
            className="h-5 w-auto shrink-0"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#445f7c] hover:text-[#0f284d] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f284d] focus-visible:ring-offset-2 rounded-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center">
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-[#445f7c] hover:text-[#0f284d] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f284d] focus-visible:ring-offset-2 rounded-sm"
          >
            Sign in
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
