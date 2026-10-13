"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { cartTotal, sanitizeCart, setQuantity, type Cart, type Product } from "../../lib/flower-cart";
import "./cart.css";

export type CartDialogProps = {
  open: boolean;
  onClose: () => void;
  cart: Cart;
  onChange: (cart: Cart) => void;
  products: Product[];
};

const money = (value: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 }).format(value);

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function CartDialog({ open, onClose, cart, onChange, products }: CartDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const clean = sanitizeCart(cart, products);
  const items = products.filter((product) => clean[String(product.id)]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="cart-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget; }}
      onClick={(event) => {
        if (event.target === event.currentTarget && backdropPress.current) onClose();
        backdropPress.current = false;
      }}
    >
      <div className="cart-panel">
        <header className="cart-header">
          <h2 id={titleId}>Ваша корзина</h2>
          <button className="cart-icon" type="button" aria-label="Закрыть корзину" onClick={onClose} autoFocus><X aria-hidden="true" size={22} /></button>
        </header>
        <p id={descriptionId} className="cart-muted">Демо-корзина. Данные никуда не отправляются, оплата не производится.</p>
        {items.length === 0 ? (
          <div className="cart-empty"><p>В корзине пока нет цветов.</p><button type="button" className="cart-primary" onClick={onClose}>Вернуться к цветам</button></div>
        ) : (
          <>
            <ul className="cart-items">
              {items.map((product) => {
                const quantity = clean[String(product.id)];
                return (
                  <li key={product.id} className="cart-item">
                    <div className="cart-item-details"><h3>{product.name}</h3><p>{money(product.price)} / шт.</p></div>
                    <button type="button" className="cart-icon" aria-label={`Удалить ${product.name}`} onClick={() => onChange(setQuantity(clean, product.id, 0))}><Trash2 aria-hidden="true" size={18} /></button>
                    <div className="cart-quantity">
                      <button type="button" className="cart-icon" aria-label={`Уменьшить количество: ${product.name}`} onClick={() => onChange(setQuantity(clean, product.id, quantity - 1))}><Minus aria-hidden="true" size={16} /></button>
                      <input type="number" min={0} max={99} step={1} value={quantity} aria-label={`Количество: ${product.name}`} onChange={(event) => onChange(setQuantity(clean, product.id, event.currentTarget.valueAsNumber))} />
                      <button type="button" className="cart-icon" disabled={quantity >= 99} aria-label={`Увеличить количество: ${product.name}`} onClick={() => onChange(setQuantity(clean, product.id, quantity + 1))}><Plus aria-hidden="true" size={16} /></button>
                    </div>
                    <span className="cart-line-total">{money(product.price * quantity)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="cart-subtotal" aria-live="polite"><span>Сумма товаров</span><strong>{money(cartTotal(clean, products))}</strong></div>
            <p className="cart-muted">Стоимость доставки не рассчитана и не включена в сумму.</p>
            <button type="button" className="cart-text-button" onClick={() => onChange({})}>Очистить корзину</button>
            {open && <DemoCheckout cart={clean} products={products} />}
          </>
        )}
      </div>
    </dialog>
  );
}

function DemoCheckout({ cart, products }: { cart: Cart; products: Product[] }) {
  const [delivery, setDelivery] = useState("delivery");
  const [summary, setSummary] = useState<{
    name: string; phone: string; delivery: string; address: string; date: string; note: string;
    total: number; items: { name: string; quantity: number }[];
  } | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const id = useId();

  useEffect(() => {
    if (dateRef.current) dateRef.current.min = localToday();
    if (summary) summaryRef.current?.focus();
  }, [summary]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const digits = phone.replace(/\D/g, "");
    const address = String(data.get("address") ?? "").trim();
    const date = String(data.get("date") ?? "");
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const phoneInput = form.elements.namedItem("phone") as HTMLInputElement;
    const addressInput = form.elements.namedItem("address") as HTMLInputElement | null;
    nameInput.setCustomValidity(name ? "" : "Введите имя, не только пробелы.");
    phoneInput.setCustomValidity(/^[+\d\s()-]+$/.test(phone) && /^(?:[78]\d{10}|\d{10})$/.test(digits) ? "" : "Введите 10 цифр или 11 цифр, начиная с 7 или 8.");
    addressInput?.setCustomValidity(address ? "" : "Введите адрес доставки.");
    if (dateRef.current) {
      dateRef.current.min = localToday();
      dateRef.current.setCustomValidity(date && date >= localToday() ? "" : "Выберите сегодняшнюю или будущую дату.");
    }
    if (!form.reportValidity()) return;
    setSummary({
      name, phone, delivery, address, date, note: String(data.get("note") ?? "").trim(),
      total: cartTotal(cart, products),
      items: products.filter((product) => cart[String(product.id)]).map((product) => ({ name: product.name, quantity: cart[String(product.id)] })),
    });
    form.reset();
  }

  if (summary) return (
    <section className="cart-summary" ref={summaryRef} tabIndex={-1} aria-labelledby={`${id}-summary`}>
      <h3 id={`${id}-summary`}>Демонстрационный заказ</h3>
      <p><strong>Заказ не отправлен в магазин. Оплата не списана.</strong></p>
      <ul>{summary.items.map((item, index) => <li key={index}>{item.name} × {item.quantity}</li>)}</ul>
      <dl>
        <dt>Сумма товаров</dt><dd>{money(summary.total)}</dd>
        <dt>Имя</dt><dd>{summary.name}</dd>
        <dt>Телефон</dt><dd>{summary.phone}</dd>
        <dt>Получение</dt><dd>{summary.delivery === "delivery" ? "Доставка" : "Самовывоз"}</dd>
        {summary.delivery === "delivery" && <><dt>Адрес</dt><dd>{summary.address}</dd></>}
        <dt>Дата</dt><dd>{summary.date.split("-").reverse().join(".")}</dd>
        {summary.note && <><dt>Текст открытки</dt><dd>{summary.note}</dd></>}
      </dl>
      <p className="cart-muted">Это снимок демо-заказа. Корзина сохранена; её можно изменить или очистить вручную. Контактные данные исчезнут при закрытии окна.</p>
      <button type="button" className="cart-primary" onClick={() => setSummary(null)}>Вернуться к демо-форме</button>
    </section>
  );

  return (
    <form className="cart-form" onSubmit={submit} autoComplete="off">
      <h3>Попробовать оформление</h3>
      <p className="cart-muted">Используйте вымышленные контактные данные.</p>
      <label>Имя<input name="name" required maxLength={100} onInput={(event) => event.currentTarget.setCustomValidity("")} /></label>
      <label>Телефон<input name="phone" type="tel" inputMode="tel" required maxLength={30} aria-describedby={`${id}-phone`} onInput={(event) => event.currentTarget.setCustomValidity("")} /></label>
      <p id={`${id}-phone`} className="cart-muted">10 цифр или 11 цифр, начиная с 7 или 8.</p>
      <fieldset><legend>Как получить цветы</legend>
        <label><input type="radio" name="delivery" value="delivery" checked={delivery === "delivery"} onChange={() => setDelivery("delivery")} />Доставка</label>
        <label><input type="radio" name="delivery" value="pickup" checked={delivery === "pickup"} onChange={() => setDelivery("pickup")} />Самовывоз</label>
      </fieldset>
      {delivery === "delivery" && <label>Адрес доставки<input name="address" required maxLength={300} onInput={(event) => event.currentTarget.setCustomValidity("")} /></label>}
      <label>Дата {delivery === "delivery" ? "доставки" : "самовывоза"}<input ref={dateRef} name="date" type="date" required onFocus={(event) => { event.currentTarget.min = localToday(); }} onInput={(event) => event.currentTarget.setCustomValidity("")} /></label>
      <label>Текст открытки (необязательно)<textarea name="note" rows={3} maxLength={1000} /></label>
      <button className="cart-primary" type="submit">Показать демо-заказ</button>
      <p className="cart-muted">Никаких реальных заказов и платежей.</p>
    </form>
  );
}
