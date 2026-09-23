import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-gf-orange text-black shadow-[0_0_18px_rgba(255,106,0,0.28)] hover:bg-[#ff7a1a]",
        variant === "ghost" && "text-gf-secondary hover:bg-white/5 hover:text-gf-text",
        variant === "outline" &&
          "border border-gf-border bg-transparent text-gf-secondary hover:border-gf-orange/40 hover:text-gf-text",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-9 px-3.5 text-sm",
        size === "icon" && "size-8",
        className,
      )}
      {...props}
    />
  );
}
