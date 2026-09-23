import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/genforge_logo.svg"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0"
      />
      {compact ? null : (
        <span className={cn("font-mono text-[12px] font-semibold tracking-[-0.04em] text-gf-text")}>
          genforge
        </span>
      )}
    </div>
  );
}
