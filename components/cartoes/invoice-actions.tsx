"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { PayInvoiceModal } from "@/components/cartoes/pay-invoice-modal";
import { CheckCircle2 } from "lucide-react";

export function InvoiceActions({
  creditCardId,
  invoiceMonth,
  total,
  paid,
  accounts,
}: {
  creditCardId: string;
  invoiceMonth: string;
  total: number;
  paid: boolean;
  accounts: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);

  if (paid) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-positive font-medium">
        <CheckCircle2 className="h-4 w-4" /> Fatura paga
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={total <= 0}>
        Pagar fatura
      </Button>
      <PayInvoiceModal open={open} onOpenChange={setOpen} creditCardId={creditCardId} invoiceMonth={invoiceMonth} suggestedAmount={total} accounts={accounts} />
    </>
  );
}
