"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateProfile, updatePreferences, changePassword, updateTheme } from "@/lib/actions/settings";
import { useTheme } from "@/components/providers/theme-provider";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sun, Moon, Laptop, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserData {
  name: string;
  email: string;
  image?: string | null;
  firstDayOfMonth: number;
  dateFormat: string;
  currency: string;
}

export function SettingsTabs({ user }: { user: UserData }) {
  return (
    <Tabs defaultValue="perfil">
      <TabsList>
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="preferencias">Preferências</TabsTrigger>
        <TabsTrigger value="aparencia">Aparência</TabsTrigger>
        <TabsTrigger value="seguranca">Segurança</TabsTrigger>
      </TabsList>

      <TabsContent value="perfil">
        <ProfileTab user={user} />
      </TabsContent>
      <TabsContent value="preferencias">
        <PreferencesTab user={user} />
      </TabsContent>
      <TabsContent value="aparencia">
        <AppearanceTab />
      </TabsContent>
      <TabsContent value="seguranca">
        <SecurityTab />
      </TabsContent>
    </Tabs>
  );
}

function ProfileTab({ user }: { user: UserData }) {
  const router = useRouter();
  const [name, setName] = React.useState(user.name);
  const [saving, setSaving] = React.useState(false);
  const initials = user.name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name });
      toast({ title: "Perfil atualizado", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Erro ao atualizar perfil", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="profile-name">Nome</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={user.email} disabled />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PreferencesTab({ user }: { user: UserData }) {
  const router = useRouter();
  const [firstDayOfMonth, setFirstDayOfMonth] = React.useState(String(user.firstDayOfMonth));
  const [dateFormat, setDateFormat] = React.useState(user.dateFormat);
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePreferences({ currency: "BRL", firstDayOfMonth: Number(firstDayOfMonth), dateFormat });
      toast({ title: "Preferências salvas", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Erro ao salvar preferências", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Moeda</Label>
            <Select value="BRL" disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real brasileiro (R$)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Outras moedas serão suportadas em versões futuras.</p>
          </div>
          <div>
            <Label>Primeiro dia do mês</Label>
            <Select value={firstDayOfMonth} onValueChange={setFirstDayOfMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 5, 10, 15, 20, 25].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    Dia {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Formato de data</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar preferências
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  async function handleSelect(next: "light" | "dark" | "auto") {
    setTheme(next);
    try {
      await updateTheme(next);
    } catch {
      // preferência de tema é best-effort; a UI já refletiu a mudança localmente
    }
  }

  const options: { value: "light" | "dark" | "auto"; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "auto", label: "Automático", icon: Laptop },
  ];

  return (
    <Card className="max-w-lg">
      <CardContent className="p-6">
        <Label className="mb-3 block">Tema</Label>
        <div className="grid grid-cols-3 gap-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
                theme === opt.value ? "border-brand bg-surface-muted" : "border-border hover:bg-surface-muted"
              )}
            >
              <opt.icon className="h-5 w-5" />
              {opt.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      toast({ title: "Senha alterada com sucesso", variant: "success" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <Card>
        <CardContent className="p-6">
          <p className="font-medium text-foreground mb-4">Alterar senha</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Senha atual</Label>
              <Input id="current-password" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-negative">{error}</p>}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Alterar senha
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Sair da conta</p>
            <p className="text-sm text-muted-foreground">Encerra sua sessão neste dispositivo.</p>
          </div>
          <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
