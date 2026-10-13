import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner requires the explicit .ts extension.
import { cartTotal, sanitizeCart, setQuantity, type Cart, type Product } from "../lib/flower-cart.ts";

const products: Product[] = [
  { id: 1, name: "Rose", description: "", price: 1200, oldPrice: 1500, category: "Bouquets", images: [] },
  { id: 2, name: "Tulip", description: "", price: 350, oldPrice: null, category: "Bouquets", images: [] },
];

test("sanitizeCart rejects non-record input", () => {
  for (const input of [null, undefined, [], [1, 2], "cart", 12, true]) {
    assert.deepEqual(sanitizeCart(input, products), {});
  }
});

test("sanitizeCart keeps only known, canonical product IDs", () => {
  assert.deepEqual(sanitizeCart({ 1: 2, 2: 3, 999: 1, "01": 4, "1e0": 5, nope: 1 }, products), { 1: 2, 2: 3 });
});

test("sanitizeCart clamps and truncates finite numeric quantities", () => {
  assert.deepEqual(sanitizeCart({ 1: 2.9, 2: 1000 }, products), { 1: 2, 2: 99 });
});

test("sanitizeCart removes zero, negative and invalid quantities without coercion", () => {
  for (const quantity of [0, -1, 0.9, NaN, Infinity, -Infinity, "2", null, true, {}]) {
    assert.deepEqual(sanitizeCart({ 1: quantity }, products), {});
  }
});

test("sanitizeCart ignores inherited entries and does not mutate input", () => {
  const input = Object.freeze(Object.assign(Object.create({ 2: 4 }), { 1: 3 }));
  assert.deepEqual(sanitizeCart(input, products), { 1: 3 });
  assert.equal(input[1], 3);
});

test("setQuantity returns a new cart and preserves other items", () => {
  const cart: Cart = Object.freeze({ 1: 2, 2: 3 });
  assert.deepEqual(setQuantity(cart, 1, 4), { 1: 4, 2: 3 });
  assert.deepEqual(cart, { 1: 2, 2: 3 });
  assert.notEqual(setQuantity(cart, 1, 2), cart);
});

test("setQuantity clamps to 99 and truncates fractional quantities", () => {
  assert.deepEqual(setQuantity({}, 1, 100), { 1: 99 });
  assert.deepEqual(setQuantity({}, 1, 3.9), { 1: 3 });
});

test("setQuantity removes zero, negative and non-finite quantities", () => {
  for (const quantity of [0, -4, 0.4, NaN, Infinity, -Infinity]) {
    assert.deepEqual(setQuantity({ 1: 2, 2: 1 }, 1, quantity), { 2: 1 });
  }
});

test("setQuantity ignores invalid product IDs", () => {
  for (const id of [NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.deepEqual(setQuantity({ 1: 2 }, id, 4), { 1: 2 });
  }
});

test("cartTotal uses current prices, not old prices, and adds no shipping", () => {
  assert.equal(cartTotal({ 1: 2, 2: 3 }, products), 3450);
  assert.equal(cartTotal({}, products), 0);
});

test("cartTotal ignores unknown IDs and normalizes quantities", () => {
  assert.equal(cartTotal({ 1: 2.9, 2: -1, 999: 10 }, products), 2400);
  assert.equal(cartTotal({ 1: NaN, 2: Infinity }, products), 0);
  assert.equal(cartTotal({ 1: 1000 }, products), 118800);
});
