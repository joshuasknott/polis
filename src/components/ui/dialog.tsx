"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  children,
  className,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-accent/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-lg rounded-2xl border border-border bg-card-elevated p-6 shadow-[0_30px_90px_rgba(7,17,31,0.18)]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({
  title,
  onClose,
  id,
}: {
  title: string;
  onClose: () => void;
  id?: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 id={id} className="font-serif text-lg font-semibold text-foreground">
        {title}
      </h2>
      <button
        onClick={onClose}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Close dialog"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
      {children}
    </div>
  );
}
