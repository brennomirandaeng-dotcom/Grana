"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { LinkBusyBridge } from "@/components/shared/link-busy-bridge";
import { Logo } from "@/components/shared/logo";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-border bg-surface">
      <div className="flex items-center px-6 h-16 border-b border-border shrink-0 text-foreground">
        <Logo className="h-11 w-36" />
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
              <LinkBusyBridge message="Carregando..." />
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-[11px] leading-snug text-muted-foreground">
          Dados de demonstração incluídos. Edite ou apague livremente para começar do seu jeito.
        </p>
      </div>
    </aside>
  );
}
