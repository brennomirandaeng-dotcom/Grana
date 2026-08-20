"use client";
import * as React from "react";
import { TransactionModal } from "@/components/lancamentos/transaction-modal";
import type { TransactionWithRelations } from "@/lib/queries/transactions";

type TxType = "INCOME" | "EXPENSE" | "TRANSFER";

interface QuickAddContextValue {
  open: (type?: TxType) => void;
  openEdit: (transaction: TransactionWithRelations) => void;
}

const QuickAddContext = React.createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [defaultType, setDefaultType] = React.useState<TxType>("EXPENSE");
  const [editing, setEditing] = React.useState<TransactionWithRelations | null>(null);

  const open = React.useCallback((type: TxType = "EXPENSE") => {
    setEditing(null);
    setDefaultType(type);
    setModalOpen(true);
  }, []);

  const openEdit = React.useCallback((transaction: TransactionWithRelations) => {
    setEditing(transaction);
    setDefaultType(transaction.type as TxType);
    setModalOpen(true);
  }, []);

  return (
    <QuickAddContext.Provider value={{ open, openEdit }}>
      {children}
      <TransactionModal open={modalOpen} onOpenChange={setModalOpen} defaultType={defaultType} editing={editing} />
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const ctx = React.useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd deve ser usado dentro de QuickAddProvider");
  return ctx;
}
