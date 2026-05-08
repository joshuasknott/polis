"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Shield } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function LandingFooter() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <motion.section
        variants={prefersReducedMotion ? undefined : fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto max-w-4xl px-6 py-28 lg:py-36 text-center bg-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/polis-icon.svg"
          alt="Polis"
          width={48}
          height={48}
          className="mx-auto h-12 w-12 mb-8 opacity-80"
        />
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-[#0f284d]">
          Ready to write with your sources?
        </h2>
        <p className="mt-6 text-lg text-[#445f7c] leading-relaxed max-w-xl mx-auto mb-10">
          Join social science students building stronger arguments inside a workspace that keeps
          every claim grounded.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0f284d] px-10 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#162f58] hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f284d] focus-visible:ring-offset-2"
        >
          Open Workspace
        </Link>
      </motion.section>

      <footer className="border-t border-[#e2e8f0] bg-[#f8f9fc] pt-16 pb-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/polis-icon.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/polis-wordmark.svg"
                  alt="Polis"
                  width={64}
                  height={20}
                  className="h-4 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
              </Link>
              <p className="text-sm text-[#445f7c] max-w-xs leading-relaxed">
                A sandboxed workspace for social science coursework. Upload sources, generate
                grounded writing, and keep every claim evidence-locked.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-5 text-[#0f284d]">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#how-it-works" className="text-sm text-[#445f7c] hover:text-[#0f284d] transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#use-cases" className="text-sm text-[#445f7c] hover:text-[#0f284d] transition-colors">
                    Use Cases
                  </a>
                </li>
                <li>
                  <a href="#compare" className="text-sm text-[#445f7c] hover:text-[#0f284d] transition-colors">
                    Compare
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-5 text-[#0f284d]">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-[#445f7c] hover:text-[#0f284d] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-[#445f7c] hover:text-[#0f284d] transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-[#445f7c] hover:text-[#0f284d] transition-colors">
                    Academic Honesty
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-[#e2e8f0] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#94a3b8]">
              &copy; {new Date().getFullYear()} Polis Workspace. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#ba9858] font-medium border border-[#ba9858]/20 px-3 py-1.5 rounded-full">
              <Shield className="h-3 w-3" strokeWidth={2} />
              Source-Grounded by Design
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
