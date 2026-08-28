import { useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { TEAM_ROLES, useAdminTeam, useSetUserRole } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { formatDate } from "@/lib/utils";

export function AdminTeam() {
  const { user } = useAuth();
  const { data: members, isLoading } = useAdminTeam();
  const { mutate, isPending } = useSetUserRole();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Team</h1>
        <SkeletonTable rows={6} className="mt-6" />
      </div>
    );
  }

  const handleRoleChange = (memberId: string, role: string) => {
    if (!TEAM_ROLES.includes(role as (typeof TEAM_ROLES)[number])) return;
    setPendingId(memberId);
    mutate(
      { userId: memberId, role: role as (typeof TEAM_ROLES)[number] },
      {
        onSuccess: () => toast.success("Role updated"),
        onError: (err) => toast.error(err.message),
        onSettled: () => setPendingId(null),
      }
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Team</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Manage who has access to the admin dashboard. You can't demote the only remaining admin.
      </p>

      {(members ?? []).length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No users found" className="mt-8" />
      ) : (
        <div className="mt-6 overflow-x-auto border border-neutral-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(members ?? []).map((member) => {
                const isYou = member.id === user?.id;
                const isRowPending = isPending && pendingId === member.id;
                return (
                  <tr key={member.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900">{member.full_name || "—"}</span>
                        {isYou && <Badge tone="brand">You</Badge>}
                      </div>
                      <p className="text-xs text-neutral-500">{member.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={member.role}
                        disabled={isRowPending}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="h-9 w-36 text-xs"
                        aria-label={`Role for ${member.email}`}
                      >
                        {TEAM_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(member.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}