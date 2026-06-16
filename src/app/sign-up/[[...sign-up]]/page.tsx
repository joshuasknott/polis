import { SignUp } from "@clerk/nextjs";
import { PolisMark } from "@/components/brand/polis-mark";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="polis-grid absolute inset-0" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[radial-gradient(100%_70%_at_50%_0%,var(--gold-soft)_0%,transparent_60%)] opacity-40"
        aria-hidden="true"
      />
      <div className="relative flex w-full max-w-sm flex-col items-center">
        <PolisMark className="mb-8" iconClassName="h-8 w-8" textClassName="h-7" priority />
        <div className="polis-gold-rule w-full rounded-2xl border border-border bg-card-elevated p-8 shadow-[0_30px_90px_rgba(7,17,31,0.10)]">
          <SignUp />
        </div>
      </div>
    </div>
  );
}
