import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, UserCog, X } from "lucide-react";

import {
  useAdminTeam,
  useAssignStaffRole,
  useRevokeStaffRole,
  useStaff,
} from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ADMIN_ROLES, ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export function AdminStaff() {
  const { user } = useAuth();
  const { data: staff, isLoading } = useStaff();
  const { data: team } = useAdminTeam();
  const assign = useAssignStaffRole();
  const revoke = useRevokeStaffRole();

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<AdminRole>("support_agent");
  const [reason, setReason] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<{ user_id: string; label: string } | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const staffIds = new Set((staff ?? []).map((s) => s.user_id));
  const assignable = (team ?? []).filter((m) => !staffIds.has(m.id));

  const handleAssign = async () => {
    if (!userId) {
      toast.error("Select a user to assign.");
      return;
    }
    try {
      await assign.mutateAsync({ userId, role, ...(reason.trim() ? { reason: reason.trim() } : {}) });
      toast.success(`${ADMIN_ROLE_LABELS[role]} assigned`);
      setUserId("");
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign role");
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revoke.mutateAsync({
        userId: revokeTarget.user_id,
        ...(revokeReason.trim() ? { reason: revokeReason.trim() } : {}),
      });
      toast.success("Staff access revoked");
      setRevokeTarget(null);
      setRevokeReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke access");
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Staff access</h1>
        <SkeletonTable rows={6} className="mt-6" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Staff access</h1>
        <p className="text-sm text-neutral-500">
          Grant granular administrative roles. Every change is recorded in the audit log. Permissions are enforced
          server-side.
        </p>
      </div>

      {/* Assign */}
      <section className="border border-neutral-200 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
          <UserCog className="h-5 w-5" /> Assign a staff role
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <label className="text-xs font-medium text-neutral-500">User</label>
            <div className="mt-1">
              <Select value={userId} onChange={(e) => setUserId(e.target.value)} className="h-9 text-sm">
                <option value="">Select a user…</option>
                {assignable.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email} ({m.role})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs font-medium text-neutral-500">Role</label>
            <div className="mt-1">
              <Select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="h-9 text-sm">
                {ADMIN_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ADMIN_ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs font-medium text-neutral-500">Reason (optional)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this access needed?"
              className="mt-1 h-9 w-full border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => void handleAssign()} loading={assign.isPending}>
              Assign role
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          You cannot change your own staff role. At least one Super Admin must always remain.
        </p>
      </section>

      {/* Current staff */}
      <section>
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
          <ShieldCheck className="h-5 w-5" /> Current staff
        </h2>
        {(staff ?? []).length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-8 w-8" />}
            title="No staff accounts"
            description="Legacy administrators keep full access via their profile role until assigned a staff role here."
            className="mt-6"
          />
        ) : (
          <div className="mt-4 overflow-x-auto border border-neutral-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Since</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(staff ?? []).map((member) => (
                  <tr key={member.user_id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-800">
                      {member.full_name || "—"}
                      {member.user_id === user?.id && <span className="ml-2 text-xs text-neutral-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{member.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone="brand">
                        {ADMIN_ROLE_LABELS[member.admin_role as AdminRole] ?? member.admin_role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(member.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="danger-outline"
                        disabled={member.user_id === user?.id}
                        onClick={() =>
                          setRevokeTarget({ user_id: member.user_id, label: member.full_name || member.email })
                        }
                      >
                        <X className="h-4 w-4" /> Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {revokeTarget && (
        <Dialog
          open
          onClose={() => {
            setRevokeTarget(null);
            setRevokeReason("");
          }}
          title={`Revoke staff access for ${revokeTarget.label}?`}
        >
          <p className="text-sm text-neutral-600">
            They will immediately lose all administrative workspaces. This does not change their customer/seller
            profile role.
          </p>
          <label className="mt-4 block text-sm font-medium text-neutral-900">Reason (optional)</label>
          <textarea
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            rows={3}
            className="mt-2 w-full border border-neutral-300 p-3 text-sm outline-none focus:border-neutral-900"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRevokeTarget(null);
                setRevokeReason("");
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={revoke.isPending} onClick={() => void handleRevoke()}>
              Revoke access
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
