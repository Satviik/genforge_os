import { cn } from "@/lib/utils";

type PanelProps = {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
};

export function Panel({ children, className, padded = true }: PanelProps) {
  return (
    <section
      className={cn(
        "gf-panel-glow overflow-hidden rounded-[10px] border border-gf-border bg-gf-card",
        padded && "p-4",
        className,
      )}
    >
      {children}
    </section>
  );
}

type PanelHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function PanelHeader({ title, subtitle, action }: PanelHeaderProps) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[13px] font-medium tracking-wide text-gf-text">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-[11px] text-gf-muted">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
