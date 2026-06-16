import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  description,
  eyebrow,
  className,
  align = "left",
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        align === "center" && "text-center mx-auto",
        "max-w-2xl",
        className,
      )}
    >
      {eyebrow && (
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gold-foreground">
          {eyebrow}
        </div>
      )}
      <h2 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
