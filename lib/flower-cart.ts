export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  category: string;
  images: string[];
};

export type Cart = Record<string, number>;

export function setQuantity(cart: Cart, id: number, quantity: number): Cart {
  const next = { ...cart };
  if (!Number.isSafeInteger(id) || id < 0) return next;
  const value = Number.isFinite(quantity) ? Math.max(0, Math.min(99, Math.trunc(quantity))) : 0;
  if (value) next[String(id)] = value;
  else delete next[String(id)];
  return next;
}

export function sanitizeCart(input: unknown, products: Product[]): Cart {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const ids = new Set(products.map((product) => String(product.id)));
  let cart: Cart = {};
  for (const [id, quantity] of Object.entries(input)) {
    if (ids.has(id) && typeof quantity === "number") {
      cart = setQuantity(cart, Number(id), quantity);
    }
  }
  return cart;
}

export function cartTotal(cart: Cart, products: Product[]): number {
  const clean = sanitizeCart(cart, products);
  const prices = new Map(products.map((product) => [String(product.id), product.price]));
  return Object.entries(clean).reduce((total, [id, quantity]) => total + prices.get(id)! * quantity, 0);
}
