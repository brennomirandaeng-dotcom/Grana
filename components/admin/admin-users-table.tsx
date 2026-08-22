"use client";
import * as React from "react";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { formatDate } from "@/lib/format";
import { USER_ROLES } from "@/lib/constants";
import { setUserActive } from "@/lib/actions/admin";
import { toast } from "@/hooks/use-toast";
import { UserX, UserCheck } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

export function AdminUsersTable({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const { refresh } = useActionRefresh();
  const [deactivatingId, setDeactivatingId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function applyActive(userId: string, active: boolean) {
    setBusyId(userId);
    try {
      await setUserActive(userId, active);
      toast({ title: active ? "Acesso reativado" : "Acesso cortado", variant: "success" });
      refresh("Atualizando usuários...");
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Não foi possível atualizar", variant: "destructive" });
    } finally {
      setBusyId(null);
      setDeactivatingId(null);
    }
  }

  const deactivatingUser = users.find((u) => u.id === deactivatingId);

  return (
    <>
      <div className="rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">
                    {u.name} {isSelf && <span className="text-xs text-muted-foreground">(você)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "brand" : "default"}>
                      {USER_ROLES[u.role as keyof typeof USER_ROLES] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.active ? "positive" : "negative"}>{u.active ? "Ativo" : "Desativado"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.active ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSelf || busyId === u.id}
                        onClick={() => setDeactivatingId(u.id)}
                      >
                        <UserX className="h-4 w-4" /> Cortar acesso
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" size="sm" disabled={busyId === u.id} onClick={() => applyActive(u.id, true)}>
                        <UserCheck className="h-4 w-4" /> Reativar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmationModal
        open={!!deactivatingId}
        onOpenChange={(o) => !o && setDeactivatingId(null)}
        title="Cortar o acesso deste usuário?"
        description={
          deactivatingUser
            ? `${deactivatingUser.name} (${deactivatingUser.email}) não vai mais conseguir entrar na aplicação até que o acesso seja reativado.`
            : undefined
        }
        onConfirm={() => deactivatingId && applyActive(deactivatingId, false)}
        confirmLabel="Cortar acesso"
        loadingLabel="Cortando acesso..."
        loading={busyId === deactivatingId}
      />
    </>
  );
}
