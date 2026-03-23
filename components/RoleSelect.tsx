"use client";

import { type ChangeEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateUserRole } from "@/app/actions/user";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import { ROLE_OPTIONS, type UserRole } from "@/utils/rbac";

type RoleSelectProps = {
  userId: string;
  currentRole: UserRole | null;
};

export default function RoleSelect({
  userId,
  currentRole,
}: RoleSelectProps) {
  const router = useRouter();
  const [optimisticRole, setOptimisticRole] = useState<UserRole | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedRole = optimisticRole ?? currentRole ?? "";

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextRole = event.target.value as UserRole;
    const previousRole = selectedRole;

    if (!nextRole || nextRole === previousRole) {
      return;
    }

    setOptimisticRole(nextRole);
    setErrorMessage("");

    startTransition(async () => {
      const result = await updateUserRole(userId, nextRole);

      if (result?.error) {
        setOptimisticRole(previousRole === "" ? null : previousRole);
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("使用者角色已更新");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={selectedRole}
          onChange={handleChange}
          disabled={isPending}
          className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 pr-10 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {selectedRole === "" ? (
            <option value="" disabled>
              請選擇角色
            </option>
          ) : null}
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
          {isPending ? <LoadingSpinner className="size-4" /> : <span className="text-xs">v</span>}
        </span>
      </div>

      {isPending ? <p className="text-xs text-cyan-300">更新中...</p> : null}

      {errorMessage ? (
        <p className="text-xs text-red-300">{errorMessage}</p>
      ) : null}
    </div>
  );
}
