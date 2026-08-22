"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@/components/shared/visually-hidden";
import { LinkBusyBridge } from "@/components/shared/link-busy-bridge";

export function MobileNavDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="left-0 top-0 h-full max-h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-r border-l-0 border-t-0 border-b-0 p-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left">
        <VisuallyHidden>
          <DialogTitle>Menu de navegação</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="font-semibold text-foreground">Finanças</span>
        </div>
        <nav className="p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
}
