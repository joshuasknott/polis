import { cn } from "@/lib/utils";

type Variant = "default" | "accent" | "interactive";

const base = "rounded-xl border border-border bg-card";

const variants: Record<Variant, string> = {
  default: "",
  accent: "polis-focal-rule bg-card-elevated",
  interactive:
    "transition-all hover:border-border-strong hover:shadow-[0_16px_45px_rgba(7,17,31,0.06)]",
};

export function Card({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return (
    <div className={cn(base, variants[variant], className)} {...props} />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between border-b border-border px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-serif text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}
