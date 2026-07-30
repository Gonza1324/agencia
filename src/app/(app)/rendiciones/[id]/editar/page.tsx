import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getActiveSubagentsForSettlement,
  getSettlementById,
} from "@/features/settlements/queries";
import { SettlementForm } from "@/features/settlements/settlement-form";
import { getArgentinaDateKey } from "@/lib/operational-days";

type EditSettlementPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSettlementPage({
  params,
}: EditSettlementPageProps) {
  const { id } = await params;
  const [settlement, subagents] = await Promise.all([
    getSettlementById(id),
    getActiveSubagentsForSettlement(),
  ]);

  if (!settlement || settlement.status === "voided") {
    notFound();
  }

  const activePayments = settlement.payments.filter(
    (payment) => payment.voided_at === null,
  );
  const cashAmount = Number(
    activePayments.find((payment) => payment.method === "cash")?.amount ?? 0,
  );
  const bankAmount = Number(
    activePayments.find((payment) => payment.method === "bank_transfer")
      ?.amount ?? 0,
  );
  const paymentMethod =
    cashAmount > 0 && bankAmount > 0
      ? "mixed"
      : bankAmount > 0
        ? "bank_transfer"
        : "cash";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/rendiciones/${settlement.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver al detalle
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Corregir rendición</h1>
      </div>
      <SettlementForm
        mode="edit"
        subagents={subagents}
        today={getArgentinaDateKey()}
        settlement={{
          id: settlement.id,
          settlementDate: settlement.settlement_date,
          subagentId: settlement.subagent_id,
          paymentMethod,
          cashAmount,
          bankAmount,
          salesAmount: settlement.sales_amount,
          commissionAmount: settlement.commission_amount,
          prizesPaidAmount: settlement.prizes_paid_amount,
          expectedAmount: settlement.expected_amount,
          notes: settlement.notes ?? "",
        }}
      />
    </div>
  );
}
