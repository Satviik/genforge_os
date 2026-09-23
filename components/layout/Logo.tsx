import { cn } from "@/lib/utils";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 32 32"
        className="size-7 shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gf-mark" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF8A33" />
            <stop offset="1" stopColor="#FF6A00" />
          </linearGradient>
        </defs>
        <path
          d="M16 3.2 27.4 9.6v12.8L16 28.8 4.6 22.4V9.6L16 3.2Z"
          fill="none"
          stroke="url(#gf-mark)"
          strokeWidth="1.6"
        />
        <path
          d="M11.2 20.4V11.6h7.4c2.2 0 3.6 1.3 3.6 3.3 0 1.5-.8 2.6-2.1 3.1l2.6 4.4h-2.6l-2.3-4h-4.1v4h-2.5Zm2.5-6.2h4.6c.9 0 1.4-.5 1.4-1.2s-.5-1.2-1.4-1.2h-4.6v2.4Z"
          fill="url(#gf-mark)"
        />
      </svg>
      {compact ? null : (
        <span className={cn("text-[15px] font-semibold tracking-[0.18em] text-gf-text uppercase")}>
          genforge
        </span>
      )}
    </div>
  );
}
