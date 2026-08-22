import { requireAdmin } from "@/lib/session";
import { getAllUsers } from "@/lib/queries/admin";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ShieldAlert } from "lucide-react";

export default async function AdminUsersPage() {
  let currentUserId: string;
  try {
    const admin = await requireAdmin();
    currentUserId = admin.id;
  } catch {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={ShieldAlert}
          title="Acesso restrito"
          description="Esta área é exclusiva para administradores da aplicação."
        />
      </div>
    );
  }

  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Usuários</h1>
        <p className="text-muted-foreground mt-1">Veja quem se cadastrou na aplicação e controle o acesso de cada um.</p>
      </div>

      <AdminUsersTable users={users} currentUserId={currentUserId} />
    </div>
  );
}
