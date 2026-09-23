"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, CircleDollarSign, Factory, Handshake, Package, Receipt, ShoppingCart, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Notification = { id: string; type: string; title: string; message: string; entityType: string; entityId: string; read: boolean; createdAt?: string; metadata?: Record<string, string | number> };
const icons: Record<string, typeof Bell> = { team_member_created: UserRound, team_member_deactivated: UserRound, product_created: Package, order_created: ShoppingCart, order_status_changed: ShoppingCart, payment_received: CircleDollarSign, expense_created: Receipt, inventory_adjusted: Package, inventory_low_stock: Package, production_job_created: Factory, production_job_completed: Factory, allocation_created: Handshake, allocation_sale: Handshake, allocation_return: Handshake, allocation_payment: CircleDollarSign, allocation_settlement: Handshake };

function relativeTime(value?: string) { if (!value) return "Just now"; const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "Just now"; const minutes = Math.floor(seconds / 60); if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; return `${Math.floor(hours / 24)}d ago`; }
function entityPath(notification: Notification) { const paths: Record<string, string> = { team: "team", product: "products", order: "orders", expense: "expenses", inventory: "inventory", production: "production", allocation: "allocations" }; const path = paths[notification.entityType]; return path ? `/dashboard/${path}${notification.entityType === "production" || notification.entityType === "allocation" ? "" : `/${notification.entityId}`}` : null; }

export function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Notification | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications", { cache: "no-store" }).then((response) => response.json()).then((payload) => { if (!cancelled) { setNotifications(payload.notifications ?? []); setUnreadCount(payload.unreadCount ?? 0); } }).catch(() => undefined);
    const source = new EventSource("/api/notifications/stream");
    source.addEventListener("notification", (event) => { const notification = JSON.parse((event as MessageEvent).data) as Notification; setNotifications((current) => [notification, ...current].slice(0, 50)); setUnreadCount((current) => current + 1); setToast(notification); window.setTimeout(() => setToast((current) => current?.id === notification.id ? null : current), 5000); });
    return () => { cancelled = true; source.close(); };
  }, []);

  async function markRead(notification: Notification) { if (!notification.read) { setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item)); setUnreadCount((current) => Math.max(0, current - 1)); void fetch(`/api/notifications/${notification.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) }); } const path = entityPath(notification); setOpen(false); if (path) router.push(path); }
  async function markAllRead() { setNotifications((current) => current.map((notification) => ({ ...notification, read: true }))); setUnreadCount(0); await fetch("/api/notifications/mark-all-read", { method: "POST" }); }

  return <>
    <div className="relative">
      <button type="button" className="relative rounded-md border border-gf-border bg-gf-surface p-2 text-gf-secondary hover:text-gf-text" aria-label="Notifications" aria-expanded={open} onClick={() => setOpen((current) => !current)}><Bell className="size-3.5" />{unreadCount > 0 ? <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-gf-orange px-1 text-center text-[9px] font-semibold leading-4 text-black">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}</button>
      {open ? <div className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-gf-border bg-gf-card shadow-2xl"><div className="flex items-center justify-between border-b border-gf-border px-3 py-2.5"><p className="text-xs font-medium text-gf-text">Notifications</p>{unreadCount > 0 ? <button type="button" onClick={() => void markAllRead()} className="flex items-center gap-1 text-[10px] text-gf-orange hover:text-[#ff8a33]"><CheckCheck className="size-3" />Mark all as read</button> : null}</div><div className="max-h-[24rem] overflow-y-auto">{notifications.length === 0 ? <div className="px-4 py-10 text-center"><Bell className="mx-auto mb-2 size-5 text-gf-muted" /><p className="text-xs text-gf-secondary">You&apos;re all caught up.</p></div> : notifications.map((notification) => { const Icon = icons[notification.type] ?? Bell; return <button key={notification.id} type="button" onClick={() => void markRead(notification)} className={`flex w-full gap-2.5 border-b border-gf-border/70 px-3 py-3 text-left hover:bg-white/[0.03] ${notification.read ? "opacity-65" : "bg-gf-orange/[0.04]"}`}><span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md ${notification.read ? "bg-gf-surface text-gf-muted" : "bg-gf-orange/15 text-gf-orange"}`}><Icon className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="text-[11px] font-medium text-gf-text">{notification.title}</span><span className="shrink-0 text-[10px] text-gf-muted">{relativeTime(notification.createdAt)}</span></span><span className="mt-0.5 block text-[11px] leading-relaxed text-gf-secondary">{notification.message}</span></span></button>; })}</div></div> : null}
    </div>
    {toast ? <div className="fixed bottom-4 right-4 z-50 flex w-80 gap-3 rounded-md border border-gf-orange/40 bg-gf-card p-3 shadow-2xl"><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gf-orange/15 text-gf-orange"><Bell className="size-3.5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-gf-text">{toast.title}</p><p className="mt-0.5 truncate text-[11px] text-gf-secondary">{toast.message}</p></div><Button type="button" variant="ghost" size="icon" aria-label="Dismiss notification" onClick={() => setToast(null)}><X className="size-3.5" /></Button></div> : null}
  </>;
}