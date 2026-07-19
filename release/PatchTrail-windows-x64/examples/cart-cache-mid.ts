export interface Cart {
  region: "us" | "eu";
  itemIds: string[];
}

const cartCache = new Map<string, Cart>();

export async function getCart(
  userId: string,
  region: Cart["region"],
  load: (userId: string, region: Cart["region"]) => Promise<Cart>,
): Promise<Cart> {
  // BUG: the cache key ignores region and can return another storefront's cart.
  const cached = cartCache.get(userId);
  if (cached) return cached;

  const cart = await load(userId, region);
  cartCache.set(userId, cart);
  return cart;
}

export function clearCartCache(): void {
  cartCache.clear();
}

