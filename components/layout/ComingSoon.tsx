import { Logo } from "@/components/layout/Logo";
import { Panel } from "@/components/ui/panel";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-24 text-center">
      <Panel className="w-full p-8">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-xl font-medium text-gf-text">{title}</h1>
        <p className="mt-2 text-sm text-gf-secondary">{description}</p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-gf-muted">
          Module coming next
        </p>
      </Panel>
    </div>
  );
}
