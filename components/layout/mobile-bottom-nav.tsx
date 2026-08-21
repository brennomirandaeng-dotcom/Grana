"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useQuickAdd } from "@/components/providers/quick-add-provider";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { open } = useQuickAdd();
  const left = MOBILE_NAV_ITEMS.slice(0, 2);
  const right = MOBILE_NAV_ITEMS.slice(2);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-center h-16">
        {left.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(item.href + "/")} />
        ))}

        <div className="flex items-center justify-center">
          <button
            aria-label="Nova despesa"
            onClick={() => open("EXPENSE")}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg -translate-y-4"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>

        {right.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(item.href + "/")} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({ item, active }: { item: (typeof MOBILE_NAV_ITEMS)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={cn("flex flex-col items-center justify-center gap-0.5 text-[10px]", active ? "text-brand" : "text-muted-foreground")}>
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}
