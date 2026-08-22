import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCardInvoice } from "@/lib/queries/credit-cards";
import { getInvoiceMonth, addMonthsToKey } from "@/lib/finance";
import { formatMonthLabel, formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoiceActions } from "@/components/cartoes/invoice-actions";
import { InvoicePurchasesTable } from "@/components/cartoes/invoice-purchases-table";
import { LinkBusyBridge } from "@/components/shared/link-busy-bridge";
import { ChevronLeft, ChevronRight, Receipt, CreditCard as CardIcon } from "lucide-react";

export default async function CardDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { month } = await searchParams;

  const card = await prisma.creditCard.findFirst({ where: { id, userId: user.id } });
  if (!card) notFound();

  const invoiceMonth = month ?? getInvoiceMonth(new Date(), card.closingDay, card.dueDay);
  const { purchases, total, paid, partiallyPaid, amountPaid, remaining } = await getCardInvoice(user.id, id, invoiceMonth);
  const accounts = await prisma.account.findMany({ where: { userId: user.id, archived: false }, orderBy: { name: "asc" } });

  const prevMonth = addMonthsToKey(invoiceMonth, -1);
  const nextMonth = addMonthsToKey(invoiceMonth, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${card.color}22`, color: card.color }}>
          <CardIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{card.name}</h1>
          <p className="text-muted-foreground text-sm">
            {card.bank} · Fecha dia {card.closingDay} · Vence dia {card.dueDay}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href={`/cartoes/${id}?month=${prevMonth}`}>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-muted text-muted-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <LinkBusyBridge message="Atualizando fatura..." />
              </Link>
              <p className="text-sm font-medium min-w-[110px] text-center">{formatMonthLabel(invoiceMonth)}</p>
              <Link href={`/cartoes/${id}?month=${nextMonth}`}>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-muted text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <LinkBusyBridge message="Atualizando fatura..." />
              </Link>
            </div>
            {paid ? (
              <Badge variant="positive">Paga</Badge>
            ) : partiallyPaid ? (
              <Badge variant="info">Pago parcialmente</Badge>
            ) : (
              <Badge variant="warning">Em aberto</Badge>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Valor da fatura</p>
            <p className="text-3xl font-semibold tabular-nums">{formatCurrency(total)}</p>
            {partiallyPaid && (
              <p className="mt-1 text-xs text-muted-foreground">
                Pago até agora: {formatCurrency(amountPaid)} · Falta {formatCurrency(remaining)}
              </p>
            )}
          </div>

          <InvoiceActions
            creditCardId={id}
            invoiceMonth={invoiceMonth}
            total={total}
            paid={paid}
            partiallyPaid={partiallyPaid}
            remaining={remaining}
            accounts={accounts}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {purchases.length === 0 ? (
            <EmptyState icon={Receipt} title="Nenhuma compra nesta fatura" className="border-none py-12" />
          ) : (
            <InvoicePurchasesTable purchases={purchases} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
