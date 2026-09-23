"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { teamMemberRoles } from "@/src/lib/validations/team-member";
import type { TeamMemberRole } from "@/src/models/TeamMember";

type TeamMember = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: TeamMemberRole;
  channelFocus: string;
  notes: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  role: TeamMemberRole;
  channelFocus: string;
  notes: string;
  active: boolean;
};

type DialogMode = "add" | "edit";
type StatusFilter = "all" | "active" | "inactive";

const emptyForm: FormState = {
  name: "",
  phone: "",
  email: "",
  role: "sales",
  channelFocus: "",
  notes: "",
  active: true,
};

const roleLabels: Record<TeamMemberRole, string> = {
  admin: "Admin",
  marketing: "Marketing",
  sales: "Sales",
  operations: "Operations",
};

function roleLabel(role: TeamMemberRole) {
  return roleLabels[role];
}

function getErrorMessage(payload: { error?: string }) {
  return payload.error ?? "Something went wrong. Please try again.";
}

export function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | TeamMemberRole>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialog, setDialog] = useState<DialogMode | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const selectedMember = members.find((member) => member.id === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (roleFilter !== "all") params.set("role", roleFilter);
        if (statusFilter !== "all") params.set("active", String(statusFilter === "active"));

        const response = await fetch(`/api/team?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(getErrorMessage(payload));
        }

        if (!cancelled) {
          setMembers(payload.members as TeamMember[]);
          setSelectedId((current) =>
            payload.members.some((member: TeamMember) => member.id === current)
              ? current
              : payload.members[0]?.id ?? null,
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load team members.");
          setMembers([]);
          setSelectedId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, roleFilter, search, statusFilter]);

  function openAddDialog() {
    setForm(emptyForm);
    setFormError(null);
    setDialog("add");
  }

  function openEditDialog(member: TeamMember) {
    setForm({
      name: member.name,
      phone: member.phone,
      email: member.email,
      role: member.role,
      channelFocus: member.channelFocus,
      notes: member.notes,
      active: member.active,
    });
    setFormError(null);
    setDialog("edit");
  }

  function closeDialog() {
    if (!saving) setDialog(null);
  }

  function updateForm(field: keyof FormState, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setFormError(null);

    try {
      const endpoint = dialog === "edit" && selectedMember
        ? `/api/team/${selectedMember.id}`
        : "/api/team";
      const response = await fetch(endpoint, {
        method: dialog === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      setDialog(null);
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save team member.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateMember() {
    if (!selectedMember || deactivating) return;

    setDeactivating(true);
    setError(null);

    try {
      const response = await fetch(`/api/team/${selectedMember.id}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      setSelectedId(null);
      setRefreshKey((current) => current + 1);
    } catch (deactivateError) {
      setError(
        deactivateError instanceof Error
          ? deactivateError.message
          : "Unable to deactivate team member.",
      );
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gf-muted">People & access</p>
          <h1 className="mt-1 text-xl font-medium text-gf-text">Team</h1>
          <p className="mt-1 text-sm text-gf-secondary">
            Internal GenForge marketing and sales employees.
          </p>
        </div>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="size-3.5" />
          Add Team Member
        </Button>
      </div>

      <Panel padded={false}>
        <div className="flex flex-col gap-3 border-b border-gf-border p-3 md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gf-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search team members..."
              className="h-9 w-full rounded-md border border-gf-border bg-gf-surface pl-9 pr-3 text-[13px] text-gf-text outline-none placeholder:text-gf-muted focus:border-gf-orange/50"
            />
          </label>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}
            className="h-9 rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-secondary outline-none focus:border-gf-orange/50"
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            {teamMemberRoles.map((role) => (
              <option key={role} value={role}>{roleLabel(role)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-9 rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-secondary outline-none focus:border-gf-orange/50"
            aria-label="Filter by status"
          >
            <option value="active">Active members</option>
            <option value="inactive">Inactive members</option>
            <option value="all">All statuses</option>
          </select>
        </div>

        {error ? (
          <div className="flex items-center justify-between gap-3 p-6">
            <div className="flex items-center gap-2 text-sm text-[#ff8b8b]">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
            <Button variant="outline" size="sm" onClick={() => setRefreshKey((current) => current + 1)}>
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </div>
        ) : loading ? (
          <LoadingRows />
        ) : members.length === 0 ? (
          <EmptyState hasFilters={Boolean(search || roleFilter !== "all" || statusFilter !== "all")} onAdd={openAddDialog} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[12px]">
              <thead className="border-b border-gf-border text-[10px] uppercase tracking-[0.14em] text-gf-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Channel focus</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gf-border/70">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className={cn(
                      "cursor-pointer text-gf-secondary transition-colors hover:bg-white/[0.025]",
                      selectedId === member.id && "bg-gf-orange/[0.06]",
                    )}
                    onClick={() => setSelectedId(member.id)}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="flex items-center gap-2.5 text-left"
                        onClick={() => setSelectedId(member.id)}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-gf-orange/30 bg-[#2a1408] text-[10px] font-semibold text-gf-orange">
                          {member.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <span className="block font-medium text-gf-text">{member.name}</span>
                          <span className="block text-[11px] text-gf-muted">{member.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">{roleLabel(member.role)}</td>
                    <td className="px-4 py-3 text-gf-text">{member.channelFocus}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">{member.phone || "No phone"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={member.active ? "success" : "neutral"}>
                        {member.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        aria-label={`Edit ${member.name}`}
                        className="rounded-md p-1.5 text-gf-muted hover:bg-white/5 hover:text-gf-text"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(member.id);
                          openEditDialog(member);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Team member details"
          subtitle={selectedMember ? "Current profile" : "Select a team member to inspect their profile"}
          action={selectedMember ? (
            <Button variant="ghost" size="icon" onClick={() => openEditDialog(selectedMember)} aria-label="Edit team member">
              <Pencil className="size-3.5" />
            </Button>
          ) : null}
        />
        {selectedMember ? (
          <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-start">
            <div className="flex size-12 items-center justify-center rounded-full border border-gf-orange/35 bg-[#2a1408] text-lg font-semibold text-gf-orange">
              {selectedMember.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-medium text-gf-text">{selectedMember.name}</h2>
                <Badge tone={selectedMember.active ? "success" : "neutral"}>
                  {selectedMember.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-1 text-[12px] text-gf-secondary">{roleLabel(selectedMember.role)} · {selectedMember.channelFocus}</p>
              <div className="mt-3 grid gap-2 text-[12px] text-gf-secondary sm:grid-cols-2">
                <p><span className="text-gf-muted">Email</span><br />{selectedMember.email}</p>
                <p><span className="text-gf-muted">Phone</span><br />{selectedMember.phone || "Not provided"}</p>
              </div>
              {selectedMember.notes ? (
                <p className="mt-3 border-l-2 border-gf-orange/40 pl-3 text-[12px] leading-relaxed text-gf-secondary">
                  {selectedMember.notes}
                </p>
              ) : null}
            </div>
            {selectedMember.active ? (
              <Button
                variant="outline"
                size="sm"
                onClick={deactivateMember}
                disabled={deactivating}
                className="text-[#ff9a7a] hover:border-[#ff9a7a]/50 hover:text-[#ffb09a]"
              >
                {deactivating ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                Deactivate
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-28 flex-col items-center justify-center text-center text-gf-muted">
            <UserRound className="mb-2 size-5" />
            <p className="text-xs">No team member selected</p>
          </div>
        )}
      </Panel>

      {dialog ? (
        <TeamMemberDialog
          mode={dialog}
          form={form}
          error={formError}
          saving={saving}
          onChange={updateForm}
          onClose={closeDialog}
          onSubmit={submitForm}
        />
      ) : null}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="flex animate-pulse items-center gap-3">
          <div className="size-7 rounded-full bg-gf-card-raised" />
          <div className="h-8 flex-1 rounded bg-gf-card-raised" />
          <div className="h-8 w-24 rounded bg-gf-card-raised" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onAdd }: { hasFilters: boolean; onAdd: () => void }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
      <UserRound className="mb-2 size-6 text-gf-muted" />
      <p className="text-sm text-gf-secondary">
        {hasFilters ? "No team members match these filters." : "No team members yet."}
      </p>
      {!hasFilters ? (
        <Button size="sm" className="mt-4" onClick={onAdd}>
          <Plus className="size-3.5" />
          Add first member
        </Button>
      ) : null}
    </div>
  );
}

function TeamMemberDialog({
  mode,
  form,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: DialogMode;
  form: FormState;
  error: string | null;
  saving: boolean;
  onChange: (field: keyof FormState, value: string | boolean) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="team-member-dialog-title" className="w-full max-w-lg rounded-[10px] border border-gf-border bg-gf-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-gf-border px-4 py-3">
          <div>
            <h2 id="team-member-dialog-title" className="text-sm font-medium text-gf-text">
              {mode === "add" ? "Add team member" : "Edit team member"}
            </h2>
            <p className="mt-0.5 text-[11px] text-gf-muted">Internal employee profile</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-gf-muted hover:bg-white/5 hover:text-gf-text" aria-label="Close dialog">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" required>
              <input required value={form.name} onChange={(event) => onChange("name", event.target.value)} className={inputClass} autoFocus />
            </Field>
            <Field label="Role" required>
              <select required value={form.role} onChange={(event) => onChange("role", event.target.value)} className={inputClass}>
                {teamMemberRoles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email" required>
              <input required type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={(event) => onChange("phone", event.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Channel focus" required>
            <input required placeholder="e.g. Instagram, direct sales" value={form.channelFocus} onChange={(event) => onChange("channelFocus", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Notes">
            <textarea rows={3} value={form.notes} onChange={(event) => onChange("notes", event.target.value)} className={cn(inputClass, "h-auto py-2")} />
          </Field>
          {mode === "edit" ? (
            <label className="flex items-center gap-2 text-xs text-gf-secondary">
              <input type="checkbox" checked={form.active} onChange={(event) => onChange("active", event.target.checked)} className="accent-gf-orange" />
              Active team member
            </label>
          ) : null}
          {error ? (
            <p className="flex items-center gap-2 text-xs text-[#ff8b8b]"><AlertCircle className="size-3.5" />{error}</p>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-gf-border pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              {mode === "add" ? "Add member" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium text-gf-secondary">{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}

const inputClass = "h-9 w-full rounded-md border border-gf-border bg-gf-surface px-3 text-[12px] text-gf-text outline-none placeholder:text-gf-muted focus:border-gf-orange/50";
