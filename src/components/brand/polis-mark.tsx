import Image from "next/image";
import { cn } from "@/lib/utils";

export function PolisMark({
  className,
  iconClassName,
  textClassName,
  showText = true,
  priority = false,
}: {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  priority?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/polis-icon.svg"
        alt=""
        width={28}
        height={28}
        className={cn("h-7 w-7 shrink-0", iconClassName)}
        priority={priority}
        aria-hidden="true"
      />
      {showText && (
        <Image
          src="/brand/polis-wordmark-transparent.svg"
          alt="Polis"
          width={103}
          height={45}
          className={cn("h-5 w-auto shrink-0", textClassName)}
          priority={priority}
        />
      )}
    </span>
  );
}
