"use client";
import { Plus, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from "lucide-react";
import { useQuickAdd } from "@/components/providers/quick-add-provider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function QuickAddFab() {
  const { open } = useQuickAdd();

  return (
    <div className="hidden lg:block fixed bottom-8 right-8 z-30">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Novo lançamento"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-6 w-6" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-2">
          <DropdownMenuItem onClick={() => open("INCOME")}>
            <ArrowUpCircle className="h-4 w-4 text-positive" /> Receita
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open("EXPENSE")}>
            <ArrowDownCircle className="h-4 w-4 text-negative" /> Despesa
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open("TRANSFER")}>
            <ArrowLeftRight className="h-4 w-4 text-info" /> Transferência
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
