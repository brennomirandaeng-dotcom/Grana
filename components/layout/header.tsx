"use client";
import * as React from "react";
import { useNavigateWithBusy } from "@/hooks/use-navigate-with-busy";
import { useActionRefresh } from "@/hooks/use-action-refresh";
import { Search, Menu, Sun, Moon, LogOut, Settings, Shield, User as UserIcon, Building2, Check } from "lucide-react";
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/providers/theme-provider";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { LinkBusyBridge } from "@/components/shared/link-busy-bridge";
import { setActiveWorkspace } from "@/lib/actions/workspace";
import { WORKSPACES, type Workspace } from "@/lib/constants";
import Link from "next/link";

interface HeaderProps {
  user: { name: string; email: string; image?: string | null };
  isAdmin?: boolean;
  workspace: Workspace;
}

export function Header({ user, isAdmin, workspace }: HeaderProps) {
  const { navigate } = useNavigateWithBusy("Buscando...");
  const { refresh } = useActionRefresh();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [switching, setSwitching] = React.useState(false);

  async function handleSwitchWorkspace(next: Workspace) {
    if (next === workspace || switching) return;
    setSwitching(true);
    try {
      await setActiveWorkspace(next);
      refresh(next === "EMPRESARIAL" ? "Mudando para Empresarial..." : "Mudando para Pessoal...");
    } finally {
      setSwitching(false);
    }
  }

  const WorkspaceIcon = workspace === "EMPRESARIAL" ? Building2 : UserIcon;

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/lancamentos?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/80 backdrop-blur px-4 lg:px-8">
      <button className="lg:hidden text-foreground" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu">
        <Menu className="h-5 w-5" />
      </button>
      <MobileNavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar lançamentos, categorias, contas..."
          className="pl-9 bg-surface-muted border-transparent"
        />
      </form>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={switching}>
            <WorkspaceIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{WORKSPACES[workspace]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Contexto financeiro</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleSwitchWorkspace("PESSOAL")}>
            <UserIcon className="h-4 w-4" /> Pessoal
            {workspace === "PESSOAL" && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSwitchWorkspace("EMPRESARIAL")}>
            <Building2 className="h-4 w-4" /> Empresarial
            {workspace === "EMPRESARIAL" && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground"
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback>{initials || <UserIcon className="h-4 w-4" />}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/configuracoes">
              <Settings className="h-4 w-4" /> Configurações
              <LinkBusyBridge message="Carregando..." />
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin/usuarios">
                <Shield className="h-4 w-4" /> Administração
                <LinkBusyBridge message="Carregando..." />
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
