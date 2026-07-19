export type CheckoutResponse = {
  orderId: string;
  total: number;
  coupon?: string;
};

export async function submitCheckout(
  input: { cartId: string; coupon?: string },
  request: (input: unknown) => Promise<Response>,
): Promise<CheckoutResponse | null> {
  const response = await request(input);

  if (!response.ok) {
    throw new Error(`Checkout failed: ${response.status}`);
  }

  // BUG 1: a successful 204 response has no body, so response.json() throws.
  return response.json() as Promise<CheckoutResponse>;
}

export function applyCoupon(total: number, discount: number | undefined): number {
  // BUG 2: an absent discount creates NaN and poisons the order total.
  return total - (discount as number);
}

export function shouldShowRetryBanner(
  paymentStatus: "idle" | "processing" | "success" | "failed",
): boolean {
  // BUG 3: the banner remains visible after a successful payment.
  return paymentStatus !== "idle";
}

