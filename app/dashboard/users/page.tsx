import { redirect } from "next/navigation";
import RoleSelect from "@/components/RoleSelect";
import TableEmptyState from "@/components/dashboard/TableEmptyState";
import {
  pageHeaderActionWrapClassName,
  pageHeaderRowClassName,
  pageHeaderTitleClassName,
} from "@/components/dashboard/ui";
import { createAdminSupabaseClient, getUserProfile } from "@/utils/auth";
import {
  canAccessUsers,
  getRoleLabel,
  normalizeUserRole,
  type StoredUserRole,
  type UserRole,
} from "@/utils/rbac";

type EmployeeRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: StoredUserRole | null;
  department: string | null;
};

type EmployeeRow = Omit<EmployeeRecord, "role"> & {
  role: UserRole | null;
};

export default async function UsersPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!canAccessUsers(profile.role)) {
    redirect("/dashboard");
  }

  const supabase = createAdminSupabaseClient();
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, full_name, email, role, department")
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows: EmployeeRow[] = ((employees ?? []) as EmployeeRecord[]).map(
    (employeeRecord) => ({
      ...employeeRecord,
      role: normalizeUserRole(employeeRecord.role),
    }),
  );

  return (
    <>
      <section className="w-full rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(30,41,59,0.92)_55%,_rgba(15,118,110,0.88)_100%)] px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.42)] sm:px-8 lg:px-10">
        <div className="space-y-4">
          <div className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            User Management
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              使用者與權限管理
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              管理員可在此檢視全體員工資料，並依照職責分配系統角色，維持後台操作權限的一致性。
            </p>
          </div>
        </div>
      </section>

      <section className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 shadow-lg shadow-slate-950/20">
        <div className="border-b border-white/10 px-6 py-5 sm:px-8">
          <div className={pageHeaderRowClassName}>
            <div className="min-w-0">
              <h2 className={pageHeaderTitleClassName}>使用者清單</h2>
            </div>
            <div className={pageHeaderActionWrapClassName} />
          </div>
          <p className="text-sm text-slate-400">
            角色調整會立即套用至後台權限，請在變更前確認部門與職責分工。
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-[820px] w-full border-collapse text-left">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium sm:px-8">姓名</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">部門</th>
                <th className="px-6 py-4 font-medium">目前角色</th>
                <th className="px-6 py-4 font-medium">調整角色</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm text-slate-200">
              {rows.length === 0 ? (
                <TableEmptyState
                  colSpan={5}
                  hint="建立員工資料後會顯示於此"
                />
              ) : (
                rows.map((employeeRecord) => (
                  <tr key={employeeRecord.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 font-medium text-white sm:px-8">
                      {employeeRecord.full_name ?? "尚未設定姓名"}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {employeeRecord.email ?? "尚未設定 Email"}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {employeeRecord.department ?? "尚未設定部門"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                        {getRoleLabel(employeeRecord.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <RoleSelect
                        userId={employeeRecord.id}
                        currentRole={employeeRecord.role}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
