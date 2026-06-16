import { cn } from "@/lib/utils";

type Tone = "stage" | "source" | "success" | "warning" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  stage: "bg-gold-soft/60 text-gold-foreground border-gold/40",
  source: "bg-source/8 text-source border-source/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/35",
  danger: "bg-danger/10 text-danger border-danger/35",
  neutral: "bg-muted text-muted-foreground border-border-strong",
};

export function Badge({
  className,
  tone = "neutral",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
