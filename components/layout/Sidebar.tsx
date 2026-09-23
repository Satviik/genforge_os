"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { currentOperator, isNavActive, navSections, settingsItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 lg:hidden",
          open ? "block" : "hidden",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col border-r border-gf-border bg-gf-surface/95 backdrop-blur-md transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Logo />
          <button
            type="button"
            className="rounded-md p-1 text-gf-secondary hover:bg-white/5 lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
          {navSections.map((section) => (
            <div key={section.id} className="mb-4">
              <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-gf-muted">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(pathname, item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                          active
                            ? "bg-gf-orange/12 text-gf-orange shadow-[inset_2px_0_0_#FF6A00]"
                            : "text-gf-secondary hover:bg-white/4 hover:text-gf-text",
                        )}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-gf-border p-3">
          <Link
            href={settingsItem.href}
            onClick={onClose}
            className={cn(
              "mb-3 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
              isNavActive(pathname, settingsItem.href)
                ? "bg-gf-orange/12 text-gf-orange"
                : "text-gf-secondary hover:bg-white/4 hover:text-gf-text",
            )}
          >
            <settingsItem.icon className="size-3.5" />
            Settings
          </Link>
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <div className="flex size-8 items-center justify-center rounded-full border border-gf-orange/40 bg-[#2a1408] text-[11px] font-semibold text-gf-orange">
              {currentOperator.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-gf-text">
                {currentOperator.name}
              </p>
              <p className="text-[10px] text-gf-muted">{currentOperator.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
