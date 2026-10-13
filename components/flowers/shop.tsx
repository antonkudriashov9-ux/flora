"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, ArrowRight, Heart, ShoppingBag, Search, X, Plus, MapPin, Menu, Phone, Flower2, Check, SlidersHorizontal } from "lucide-react";
import { CartDialog } from "./cart";
import { sanitizeCart, setQuantity, type Cart, type Product } from "@/lib/flower-cart";
import "./shop.css";
const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
const categories = ["Все цветы", "Букеты", "Розы", "Корзины и коробки", "Свадебные"];
export function FlowerShop({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Cart>({});
  const [favorites, setFavorites] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [category, setCategory] = useState("Все цветы");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("default");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [limit, setLimit] = useState(8);
  const [selected, setSelected] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const restore = window.setTimeout(() => {
    try {
      setCart(sanitizeCart(JSON.parse(localStorage.getItem("flowers-cart") || "{}"), products));
      const stored: unknown = JSON.parse(localStorage.getItem("flowers-favorites") || "[]");
      if (Array.isArray(stored)) setFavorites(stored.filter((id): id is number => typeof id === "number" && products.some(p => p.id === id)));
    } catch { /* Unavailable storage starts a fresh session. */ }
    setReady(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [products]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem("flowers-cart", JSON.stringify(cart)); localStorage.setItem("flowers-favorites", JSON.stringify(favorites)); } catch { /* Shopping works without persistence. */ }
  }, [cart, favorites, ready]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 2600); return () => clearTimeout(timer); }, [notice]);
  function add(product: Product) { setCart(current => setQuantity(current, product.id, (current[product.id] || 0) + 1)); setNotice(`«${product.name}» в корзине`); }
  function favorite(id: number) { setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }
  function choose(value: string) { setCategory(value); setOnlyFavorites(false); setLimit(8); }
  const filtered = products.filter(p => (category === "Все цветы" || p.category === category) && (!onlyFavorites || favorites.includes(p.id)) && `${p.name} ${p.description}`.toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru"))).sort((a, b) => sort === "ascending" ? a.price - b.price : sort === "descending" ? b.price - a.price : 0);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const hero = products.find(p => p.id === 14614548) || products[0];
  return <div className="flower-shop">
    <a href="#catalog" className="flower-skip">Перейти к каталогу</a>
    <div className="flower-top"><span><MapPin size={13} /> Грязи, Липецкая область</span><span>Цветы и забота. Круглосуточно.</span><a href="tel:+79508087233">+7 (950) 808-72-33</a></div>
    <header className="flower-header"><a href="#" className="flower-logo" aria-label="Цветочный мир — главная"><Flower2 strokeWidth={1} /><span>цветочный мир<small>ЦВЕТЫ. ЛЮДИ. ЧУВСТВА.</small></span></a>
      <nav aria-label="Главное меню" className={menuOpen ? "flower-nav open" : "flower-nav"}>{[["catalog","Каталог"],["about","Наша история"],["delivery","Доставка"],["contacts","Контакты"]].map(([id,name]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{name}</a>)}</nav>
      <div className="flower-actions"><button aria-label="Показать избранное" onClick={() => { setOnlyFavorites(v => !v); setCategory("Все цветы"); setLimit(40); document.getElementById("catalog")?.scrollIntoView(); }}><Heart size={21} fill={onlyFavorites ? "currentColor" : "none"} />{favorites.length > 0 && <sup>{favorites.length}</sup>}</button><button className="flower-bag" aria-label={`Открыть корзину, товаров: ${count}`} onClick={() => setCartOpen(true)}><ShoppingBag size={21}/><span>Корзина</span><b>{count}</b></button><button className="flower-menu" aria-label="Открыть меню" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X/> : <Menu/>}</button></div>
    </header>
    <main><section className="flower-hero"><div className="flower-hero-copy"><span className="flower-eyebrow">ВАШ ЦВЕТОЧНЫЙ В ГРЯЗЯХ · 24/7</span><h1>Когда чувства<br/>становятся<br/><em>цветами.</em></h1><p>Собираем букеты, в которых есть вы.<br/>Для больших событий и маленьких «люблю».</p><a className="flower-primary" href="#catalog">Выбрать букет <ArrowUpRight size={19}/></a><div className="flower-hero-bottom"><span>Живые цветы.<br/>Настоящие эмоции.</span><a href="#catalog" aria-label="Прокрутить к букетам"><ArrowDown size={20}/></a></div></div><div className="flower-hero-image"><Image src={hero.images[0]} alt="Авторский букет Цветочного мира" fill sizes="(max-width: 767px) 100vw, 60vw" preload/><div className="flower-hero-stamp">с любовью<br/><strong>к каждому</strong><br/>лепестку</div><button className="flower-hero-product" onClick={() => setSelected(hero)}><span><small>ЗНАКОМСТВО С КОЛЛЕКЦИЕЙ</small>{hero.name}</span><ArrowUpRight size={25}/></button></div></section>
    <div className="flower-service-strip"><span><Flower2 size={19}/> Авторская флористика</span><span>Доставка по Грязям</span><span>Два цветочных салона</span><span>Рядом с вами 24/7 <ArrowUpRight size={17}/></span></div>
    <section className="flower-catalog flower-section" id="catalog"><div className="flower-section-heading"><h2>{onlyFavorites ? "Ваше избранное" : "Найдите свой букет"}<span> / {filtered.length}</span></h2><span className="flower-small">Каждый букет — немного про любовь</span></div>
      <div className="flower-catalog-tools"><div className="flower-tabs" aria-label="Категории цветов">{categories.map(c => <button key={c} aria-pressed={category === c && !onlyFavorites} className={category === c && !onlyFavorites ? "active" : ""} onClick={() => choose(c)}>{c}</button>)}</div><label className="flower-sort"><SlidersHorizontal size={16}/><select aria-label="Сортировка" value={sort} onChange={e => setSort(e.target.value)}><option value="default">По умолчанию</option><option value="ascending">Сначала дешевле</option><option value="descending">Сначала дороже</option></select></label></div>
      <div className="flower-search"><Search size={17}/><input aria-label="Поиск букетов" placeholder="Название букета или любимые цветы" value={query} onChange={e => { setQuery(e.target.value); setLimit(40); }}/>{query && <button aria-label="Очистить поиск" onClick={() => setQuery("")}><X size={17}/></button>}</div>
      <div className="flower-grid">{filtered.slice(0, limit).map(product => <article key={product.id} className="flower-card"><div className="flower-card-image"><button className="flower-image-button" onClick={() => setSelected(product)} aria-label={`Подробнее: ${product.name}`}><Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 600px) 48vw, (max-width: 1024px) 33vw, 25vw"/></button>{product.oldPrice && <span className="flower-tag">Особая цена</span>}<button className={`flower-heart ${favorites.includes(product.id) ? "chosen" : ""}`} aria-label={`${favorites.includes(product.id) ? "Убрать из" : "Добавить в"} избранное: ${product.name}`} aria-pressed={favorites.includes(product.id)} onClick={() => favorite(product.id)}><Heart size={19} fill={favorites.includes(product.id) ? "currentColor" : "none"}/></button><button className="flower-quick-add" onClick={() => add(product)}>В корзину <Plus size={17}/></button></div><div className="flower-card-info"><button onClick={() => setSelected(product)}><h3>{product.name}</h3></button><p>{money(product.price)} {product.oldPrice && <del>{money(product.oldPrice)}</del>}</p></div></article>)}</div>
      {filtered.length === 0 && <div className="flower-empty"><Flower2 size={38}/><h3>{onlyFavorites ? "Сохраните то, что понравилось" : "Такой букет пока не нашёлся"}</h3><p>{onlyFavorites ? "Нажмите на сердечко рядом с букетом." : "Попробуйте другое название или выберите все цветы."}</p><button className="flower-outline" onClick={() => { choose("Все цветы"); setQuery(""); }}>Все цветы <ArrowRight size={18}/></button></div>}
      {filtered.length > limit && <button className="flower-more flower-outline" onClick={() => setLimit(v => v + 12)}>Больше прекрасного <Plus size={18}/><span>{filtered.length - limit}</span></button>}
    </section>
    <section className="flower-custom"><div><span className="flower-eyebrow">ТОЛЬКО ВАША ИСТОРИЯ</span><h2>А если хочется<br/>чего-то особенного?</h2><p>Расскажите Наталье о человеке, поводе и любимых цветах.<br/>Вместе придумаем тот самый букет.</p><a className="flower-primary" href="tel:+79508087233">Обсудить с флористом <ArrowUpRight size={18}/></a></div><div className="flower-custom-image"><Image src="/flowers/story-1.webp" alt="Цветочная композиция мастерской" fill sizes="(max-width: 767px) 100vw, 45vw"/></div></section>
    <section id="about" className="flower-about flower-section"><div className="flower-about-photo"><Image src="/flowers/story-2.webp" alt="Работа флориста Цветочного мира" fill sizes="(max-width: 767px) 100vw, 45vw"/><span>Собрано руками. Подарено от сердца.</span></div><div className="flower-about-text"><span className="flower-eyebrow">ДАВАЙТЕ ЗНАКОМИТЬСЯ</span><h2>Маленький мир.<br/>Большая любовь<br/>к цветам.</h2><p>За каждым букетом стоит человек. В нашем случае — флорист Наталья Кашина и «Цветочный мир» в Грязях.</p><p>Мы собираем цветы для свиданий, свадеб, семейных праздников и обычных дней, которые хочется сделать чуть теплее.</p><div className="flower-founder"><Image src="/flowers/florist.webp" alt="Наталья Кашина" width={54} height={54}/><span>Наталья Кашина<small>Ваш флорист</small></span></div></div></section>
    <section id="delivery" className="flower-delivery flower-section"><h2>От наших рук — к вашим.</h2><div className="flower-delivery-grid"><div><span>01 / ВЫБИРАЙТЕ</span><h3>Букет по душе</h3><p>Нежные монобукеты, яркие композиции и цветочные корзины. Или ваша собственная идея.</p></div><div><span>02 / ДОГОВОРИМСЯ</span><h3>Важна каждая деталь</h3><p>Состав, наличие цветов, время и стоимость доставки уточняются у флориста.</p></div><div><span>03 / ДАРИТЕ</span><h3>Доставка или встреча</h3><p>Доставляем по Грязям. Можно забрать букет самостоятельно в одном из двух салонов.</p></div></div><details><summary>Можно ли заказать букет ночью?<Plus size={18}/></summary><p>Магазин работает круглосуточно. Позвоните по номеру +7 (950) 808-72-33, чтобы уточнить наличие и время получения.</p></details><details><summary>Букет будет точно как на фотографии?<Plus size={18}/></summary><p>Цветы могут отличаться оттенком и степенью раскрытия. Доступный состав и возможные замены согласовываются с флористом.</p></details><details><summary>Как сейчас работает заказ на сайте?<Plus size={18}/></summary><p>Сайт работает в демонстрационном режиме. Можно выбрать цветы, наполнить корзину и проверить оформление. Заказ не отправляется, оплата не списывается.</p></details></section></main>
    <footer id="contacts" className="flower-footer"><div className="flower-footer-heading"><h2>Для цветов<br/>всегда есть повод.</h2><a href="tel:+79508087233">+7 (950) 808-72-33 <ArrowUpRight/></a></div><div className="flower-footer-grid"><a className="flower-logo" href="#"><Flower2 strokeWidth={1}/><span>цветочный мир<small>РЯДОМ С ВАМИ 24/7</small></span></a><div><h3>Приходите в гости</h3><p>Грязи, ул. Правда, 66<br/>Рынок, павильон 10–11</p><p>Грязи, ул. Воровского, 32</p></div><div><h3>Остаёмся на связи</h3><a href="tel:+79042198731">+7 (904) 219-87-31</a><p>Наталья Кашина, флорист</p><span>Работаем круглосуточно</span></div><div><h3>Всё о цветах</h3><a href="#catalog">Каталог</a><a href="#about">Наша история</a><a href="#delivery">Доставка и самовывоз</a></div></div><div className="flower-footer-bottom"><span>© {new Date().getFullYear()} Цветочный мир</span><span>Демонстрационная версия · Заказы не отправляются</span><a href="#">Наверх ↑</a></div></footer>
    <CartDialog open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onChange={setCart} products={products}/>
    {selected && <ProductDialog product={selected} onClose={() => setSelected(null)} onAdd={() => add(selected)}/>}
    <div className={`flower-notice ${notice ? "visible" : ""}`} role="status"><Check size={18}/>{notice}<button onClick={() => { setSelected(null); setCartOpen(true); setNotice(""); }}>Посмотреть</button></div><a className="flower-call" href="tel:+79508087233" aria-label="Позвонить флористу"><Phone size={21}/></a>
  </div>;
}
function ProductDialog({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [image, setImage] = useState(0);
  useEffect(() => { const el = dialog.current; el?.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { el?.close(); document.body.style.overflow = previous; }; }, []);
  return <dialog ref={dialog} className="flower-product-dialog" aria-labelledby="flower-product-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="flower-product-inner"><button className="flower-close" onClick={onClose} aria-label="Закрыть карточку"><X/></button><div><div className="flower-product-main"><Image src={product.images[image]} alt={product.name} fill sizes="(max-width: 767px) 90vw, 450px"/></div><div className="flower-thumbs">{product.images.map((src, i) => <button key={src} aria-label={`Фото ${i + 1}`} aria-pressed={i === image} onClick={() => setImage(i)}><Image src={src} alt="" width={64} height={70}/></button>)}</div></div><div className="flower-product-copy"><span className="flower-eyebrow">{product.category}</span><h2 id="flower-product-title">{product.name}</h2><p className="flower-product-price">{money(product.price)} {product.oldPrice && <del>{money(product.oldPrice)}</del>}</p><p>{product.description}</p><button className="flower-primary" onClick={onAdd}>Добавить в корзину <Plus size={18}/></button><p className="flower-small">Состав и наличие уточняются у флориста. Стоимость доставки согласовывается отдельно.</p></div></div></dialog>;
}
