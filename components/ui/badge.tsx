import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "success" | "warning" | "orange";
};

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-gf-card-raised text-gf-secondary border-gf-border",
  success: "bg-[#14301f] text-gf-success border-[#1f4a30]",
  warning: "bg-[#3a2410] text-[#f0b45a] border-[#5a3a16]",
  orange: "bg-[#2a1408] text-gf-orange border-[#5a2a10]",
};

export function Badge({ children, className, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
