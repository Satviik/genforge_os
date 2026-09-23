"use client";

import { Bell, CalendarRange, Menu, Search } from "lucide-react";
import { getPageTitle } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type TopBarProps = {
  pathname: string;
  dateRangeLabel: string;
  onMenuClick: () => void;
};

export function TopBar({ pathname, dateRangeLabel, onMenuClick }: TopBarProps) {
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gf-border bg-gf-bg/80 px-4 backdrop-blur-md">
      <button
        type="button"
        className="rounded-md p-1.5 text-gf-secondary hover:bg-white/5 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </button>

      <div className="min-w-0">
        <p className="truncate text-[11px] text-gf-muted">
          Dashboard <span className="text-gf-secondary">/</span> {pageTitle}
        </p>
      </div>

      <label className="relative mx-auto hidden min-w-0 max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gf-muted" />
        <input
          type="search"
          placeholder="Search anything..."
          className={cn(
            "h-9 w-full rounded-md border border-gf-border bg-gf-surface/80 pl-9 pr-3 text-[13px] text-gf-text outline-none",
            "placeholder:text-gf-muted focus:border-gf-orange/50 focus:shadow-[0_0_0_3px_rgba(255,106,0,0.12)]",
          )}
        />
      </label>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-md border border-gf-border bg-gf-surface px-2.5 py-1.5 text-[11px] text-gf-secondary lg:flex">
          <CalendarRange className="size-3.5 text-gf-muted" />
          {dateRangeLabel}
        </div>
        <button
          type="button"
          className="relative rounded-md border border-gf-border bg-gf-surface p-2 text-gf-secondary hover:text-gf-text"
          aria-label="Notifications"
        >
          <Bell className="size-3.5" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-gf-orange" />
        </button>
      </div>
    </header>
  );
}
