export interface PaymentResult {
  paymentId: string;
  accountId: string;
  amount: number;
}

const completedPayments = new Map<string, PaymentResult>();

export async function chargeOnce(
  accountId: string,
  idempotencyKey: string,
  charge: () => Promise<PaymentResult>,
): Promise<PaymentResult> {
  // BUG: the key is not scoped to the account, so results can cross a tenant boundary.
  const cached = completedPayments.get(idempotencyKey);
  if (cached) return cached;

  const result = await charge();
  completedPayments.set(idempotencyKey, result);
  return result;
}

export function clearCompletedPayments(): void {
  completedPayments.clear();
}

