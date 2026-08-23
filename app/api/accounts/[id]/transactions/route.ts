import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getAccountTransactions } from "@/lib/queries/accounts";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const transactions = await getAccountTransactions(user.id, id);
  return NextResponse.json(transactions);
}
