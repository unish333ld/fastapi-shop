import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AuthPanel } from '../features/auth/AuthPanel'
import { useAuth } from '../features/auth/useAuth'
import { API_URL } from '../shared/config/api'
import { SEOHead } from '../shared/seo/SEOHead'
import { ScrollReveal } from '../shared/ui/scroll-motion'
import { useTheme } from './use-theme'

type Category = { id: number; name: string; slug: string }
type Product = { id: number; name: string; description: string | null; price: number; category_id: number; image_url: string | null; category: Category }
type ProductListResponse = { products: Product[]; total: number }
type CartLine = { product_id: number; quantity: number }

const CATEGORY_NAMES: Record<string, string> = { Electronics: 'Электроника', Clothing: 'Одежда', Books: 'Книги', 'Home & Garden': 'Дом и сад' }
const PRODUCT_COPY: Record<string, { name: string; description: string }> = {
  'Wireless Headphones': { name: 'Беспроводные наушники', description: 'Чистый звук, активное шумоподавление и до 30 часов автономной работы.' },
  'Smart Watch Pro': { name: 'Умные часы Pro', description: 'Трекер активности, пульсометр и GPS в сдержанном корпусе.' },
  'Laptop Stand': { name: 'Подставка для ноутбука', description: 'Алюминиевая подставка с регулировкой высоты и угла.' },
  'USB-C Hub': { name: 'USB-C концентратор', description: 'HDMI, USB 3.0 и SD-кардридер в компактном корпусе.' },
  'Wireless Keyboard': { name: 'Беспроводная клавиатура', description: 'Механические переключатели, чистая форма и долгий заряд.' },
  'Running Shoes': { name: 'Кроссовки для бега', description: 'Лёгкая посадка, амортизация и дышащая сетка.' },
  'Python Programming Guide': { name: 'Руководство по Python', description: 'Практический путь от первых строк кода до продвинутых тем.' },
  'The Art of Design': { name: 'Искусство дизайна', description: 'Принципы формы, композиции и творческого мышления.' },
  'Cooking Masterclass': { name: 'Мастер-класс по кулинарии', description: 'Техники и рецепты с пошаговыми инструкциями.' },
  'Plant Pot Set': { name: 'Набор цветочных горшков', description: 'Три керамических горшка с дренажем и поддонами.' },
  'LED Desk Lamp': { name: 'Настольная LED-лампа', description: 'Сенсорное управление, мягкий свет и несколько режимов.' },
  'Throw Pillow Set': { name: 'Набор декоративных подушек', description: 'Две мягкие подушки со съёмными чехлами.' },
  'Garden Tool Kit': { name: 'Набор садовых инструментов', description: 'Десять инструментов из нержавеющей стали в одной сумке.' },
}

function copyOf(product: Product) { return PRODUCT_COPY[product.name] ?? { name: product.name, description: product.description ?? '' } }
function categoryName(category: Category) { return CATEGORY_NAMES[category.name] ?? category.name }
function formatPrice(value: number) { return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(value) }

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
  return response.json() as Promise<T>
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (id: number) => void }) {
  const copy = copyOf(product)
  return <ScrollReveal className="h-full"><article className="group h-full rounded-3xl border border-border bg-card p-2 shadow-sm transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none"><div className="relative aspect-[.88] overflow-hidden rounded-[1.35rem] bg-muted"><>{product.image_url ? <img src={product.image_url} alt={copy.name} width="640" height="700" loading="lazy" className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" /> : <div className="grid h-full place-items-center font-mono text-sm uppercase tracking-[.25em] text-muted-foreground">northstar</div>}</><div className="absolute inset-x-4 top-4 flex items-center justify-between"><span className="rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">{categoryName(product.category)}</span><button type="button" className="grid size-9 place-items-center rounded-full bg-background/85 text-lg text-foreground backdrop-blur transition hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Сохранить ${copy.name}`}>♡</button></div><button type="button" onClick={() => onAdd(product.id)} className="absolute bottom-4 left-4 right-4 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-2 focus-visible:ring-ring">В корзину <span className="float-right">+</span></button></div><div className="flex items-start justify-between gap-3 px-3 pb-3 pt-4"><div className="min-w-0"><h3 className="truncate font-semibold text-card-foreground">{copy.name}</h3><p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{copy.description}</p></div><strong className="shrink-0 pt-0.5 text-sm tabular-nums text-card-foreground">{formatPrice(product.price)}</strong></div></article></ScrollReveal>
}

function CartDrawer({ cart, products, cartTotal, onClose, onChangeQuantity }: { cart: CartLine[]; products: Product[]; cartTotal: number; onClose: () => void; onChangeQuantity: (productId: number, amount: number) => void }) {
  const reduceMotion = useReducedMotion()
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const }

  return <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition} className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <motion.aside data-cart-drawer="true" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={transition} className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-background p-6 shadow-2xl sm:p-8" aria-label="Корзина">
      <div className="flex items-center justify-between border-b border-border pb-5"><div><p className="font-mono text-xs uppercase tracking-[.18em] text-muted-foreground">Корзина</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Ваш выбор.</h2></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full border border-border text-xl transition hover:bg-secondary" aria-label="Закрыть корзину">×</button></div>
      <div className="flex-1 py-7">{cart.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Корзина пока пуста.</p> : <div className="space-y-5">{cart.map((line) => { const product = products.find((item) => item.id === line.product_id); if (!product) return null; const copy = copyOf(product); return <div key={line.product_id} className="flex gap-4 border-b border-border pb-5"><img src={product.image_url ?? ''} alt="" width="72" height="72" loading="lazy" className="size-[72px] rounded-2xl object-cover" /><div className="min-w-0 flex-1"><p className="font-semibold">{copy.name}</p><p className="mt-1 text-sm text-muted-foreground">{formatPrice(product.price)}</p><div className="mt-3 flex items-center gap-3"><button type="button" onClick={() => onChangeQuantity(product.id, -1)} className="grid size-7 place-items-center rounded-full border border-border hover:bg-secondary" aria-label={`Уменьшить количество: ${copy.name}`}>−</button><span className="text-sm">{line.quantity}</span><button type="button" onClick={() => onChangeQuantity(product.id, 1)} className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-secondary hover:text-secondary-foreground" aria-label={`Увеличить количество: ${copy.name}`}>+</button></div></div></div> })}</div>}</div>
      <div className="border-t border-border pt-5"><div className="flex justify-between text-sm text-muted-foreground"><span>Итого</span><strong className="text-foreground">{formatPrice(cartTotal)}</strong></div><button type="button" className="mt-5 w-full rounded-full bg-primary px-5 py-4 text-sm font-bold text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground">Перейти к оформлению</button></div>
    </motion.aside>
  </>
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
    <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-background p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-5"><div><p className="font-mono text-xs uppercase tracking-[.18em] text-muted-foreground">Документы</p><h2 id="privacy-title" className="mt-2 text-3xl font-semibold tracking-[-.05em]">Политика конфиденциальности</h2></div><button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-xl transition hover:bg-secondary" aria-label="Закрыть политику конфиденциальности">×</button></div>
      <div className="mt-7 space-y-5 text-sm leading-6 text-muted-foreground"><p>Мы бережно относимся к вашим данным. Northstar использует только информацию, необходимую для работы сайта, авторизации и оформления заказов.</p><p>Для сохранения выбранной темы и решения о cookie сайт может использовать локальное хранилище браузера. Мы не продаём персональные данные и не передаём их рекламным сетям.</p><p>По вопросам обработки данных напишите нам: <a className="text-foreground underline underline-offset-4" href="mailto:hello@northstar.store">hello@northstar.store</a>.</p></div>
    </div>
  </div>
}

function CookieConsent({ onAccept, onRequiredOnly, onPrivacy }: { onAccept: () => void; onRequiredOnly: () => void; onPrivacy: () => void }) {
  return <div className="fixed inset-x-4 bottom-4 z-50 rounded-3xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-xl sm:p-6" role="dialog" aria-live="polite" aria-label="Настройки cookie"><div className="flex gap-4"><div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-lg text-primary-foreground" aria-hidden="true">◌</div><div><p className="font-semibold text-foreground">Файлы cookie</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Мы используем только необходимые технологии, чтобы сайт работал корректно и запоминал ваши настройки.</p><button type="button" onClick={onPrivacy} className="mt-2 text-sm font-semibold text-foreground underline underline-offset-4">Политика конфиденциальности</button></div></div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onRequiredOnly} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary">Только необходимые</button><button type="button" onClick={onAccept} className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground">Принять</button></div></div>
}

function App() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(() => typeof window === 'undefined' ? null : localStorage.getItem('northstar-cookie-consent') === null ? false : true)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  function saveCookieConsent() {
    localStorage.setItem('northstar-cookie-consent', 'accepted')
    setCookieConsent(true)
  }

  useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      const target = event.target as HTMLElement | null
      if (cartOpen) {
        if (!target?.closest('[data-cart-drawer]')) touchStart.current = null
        else {
          const touch = event.touches[0]
          touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
        }
        return
      }

      if (target?.closest('button, a, input, textarea, select, [data-horizontal-scroll]')) {
        touchStart.current = null
        return
      }

      const touch = event.touches[0]
      touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
    }

    function handleTouchEnd(event: TouchEvent) {
      if (!touchStart.current) return

      const touch = event.changedTouches[0]
      if (!touch) return

      const deltaX = touch.clientX - touchStart.current.x
      const deltaY = touch.clientY - touchStart.current.y
      touchStart.current = null

      const horizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.35
      if (horizontalSwipe && !cartOpen && deltaX < -72) setCartOpen(true)
      if (horizontalSwipe && cartOpen && deltaX > 72) setCartOpen(false)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [cartOpen])

  useEffect(() => {
    async function loadStore() {
      try { const [productResponse, categoryResponse] = await Promise.all([fetchJson<ProductListResponse>('/api/products'), fetchJson<Category[]>('/api/categories')]); setProducts(productResponse.products); setCategories(categoryResponse) } catch { setError('Не удалось загрузить каталог. Проверьте, запущен ли backend.') } finally { setLoading(false) }
    }
    void loadStore()
  }, [])

  const filteredProducts = useMemo(() => { const query = search.trim().toLowerCase(); return products.filter((product) => { const copy = copyOf(product); return (activeCategory === null || product.category_id === activeCategory) && (!query || `${copy.name} ${copy.description}`.toLowerCase().includes(query)) }) }, [activeCategory, products, search])
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const cartTotal = cart.reduce((sum, line) => sum + (products.find((product) => product.id === line.product_id)?.price ?? 0) * line.quantity, 0)
  const featuredProduct = products[0]

  async function addToCart(productId: number) {
    const nextCart = [...cart]; const line = nextCart.find((item) => item.product_id === productId); if (line) line.quantity += 1; else nextCart.push({ product_id: productId, quantity: 1 })
    try { await fetchJson('/api/cart/add', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity: 1, cart: Object.fromEntries(cart.map((item) => [item.product_id, item.quantity])) }) }); setCart(nextCart); setCartOpen(true); setError('') } catch { setError('Не удалось добавить товар в корзину.') }
  }

  function changeQuantity(productId: number, amount: number) { setCart((current) => current.map((line) => line.product_id === productId ? { ...line, quantity: line.quantity + amount } : line).filter((line) => line.quantity > 0)) }

  return <div className="min-h-screen overflow-x-hidden bg-background text-foreground"><SEOHead products={products} /><header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl"><div className="mx-auto max-w-7xl px-5 py-4 sm:px-8"><div className="flex items-center justify-between gap-4"><a href="#top" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">N</span><span className="font-mono text-sm font-bold uppercase tracking-[.18em]">northstar</span></a><nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex"><a href="#shop" className="transition hover:text-foreground">Каталог</a><a href="#story" className="transition hover:text-foreground">О нас</a><a href="#journal" className="transition hover:text-foreground">Журнал</a></nav><div className="flex items-center gap-2"><button type="button" onClick={toggleTheme} className="grid size-9 place-items-center rounded-full border border-border text-sm transition hover:bg-secondary" aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}>{theme === 'dark' ? '☼' : '☾'}</button>{user ? <button type="button" onClick={() => void logout()} className="rounded-full border border-border px-3.5 py-2 text-sm font-semibold transition hover:bg-secondary">Выйти</button> : <button type="button" onClick={() => setAuthOpen(true)} className="rounded-full border border-border px-3.5 py-2 text-sm font-semibold transition hover:bg-secondary">Войти</button>}<button type="button" onClick={() => setCartOpen(true)} className="inline-flex items-center rounded-full bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground">Корзина {cartCount > 0 && <span aria-hidden="true" className="ml-2 inline-block size-2 rounded-full bg-red-500" />}</button></div></div></div></header>

  <main id="top"><section className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:items-center lg:gap-20 lg:pb-28 lg:pt-24"><div><p className="font-mono text-xs uppercase tracking-[.2em] text-muted-foreground">Коллекция 2026 / 01</p><h1 className="mt-6 max-w-3xl text-balance text-6xl font-semibold leading-[.9] tracking-[-.07em] sm:text-8xl">Меньше вещей.<br /><span className="text-muted-foreground">Больше смысла.</span></h1><p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground">Техника, книги и вещи для дома, которые вписываются в ритм современной жизни.</p><a href="#shop" className="mt-9 inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground focus-visible:ring-2 focus-visible:ring-ring">Смотреть каталог <span>↘</span></a></div><div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-border bg-muted lg:min-h-[600px]">{featuredProduct?.image_url ? <img src={featuredProduct.image_url} alt="Рекомендуемый товар" width="900" height="1100" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover opacity-80" /> : <div className="absolute inset-0 bg-secondary" />}<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" /><div className="absolute bottom-7 left-7 right-7 flex items-end justify-between text-white"><div><p className="font-mono text-xs uppercase tracking-[.18em] text-white/70">Выбор команды</p><p className="mt-2 text-3xl font-semibold tracking-[-.04em]">Вещи, которые остаются.</p></div><span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-white text-xl text-black">↗</span></div></div></section>

    <section className="border-y border-border bg-card"><div className="mx-auto grid max-w-7xl gap-0 px-5 sm:grid-cols-3 sm:px-8"><div className="border-b border-border py-6 sm:border-b-0 sm:border-r sm:pr-8"><p className="font-mono text-xs text-muted-foreground">01</p><p className="mt-3 font-semibold">Только нужное</p><p className="mt-1 text-sm text-muted-foreground">Без лишнего шума</p></div><div className="border-b border-border py-6 sm:border-b-0 sm:border-r sm:px-8"><p className="font-mono text-xs text-muted-foreground">02</p><p className="mt-3 font-semibold">Честный выбор</p><p className="mt-1 text-sm text-muted-foreground">Качество важнее количества</p></div><div className="py-6 sm:pl-8"><p className="font-mono text-xs text-muted-foreground">03</p><p className="mt-3 font-semibold">Быстрая доставка</p><p className="mt-1 text-sm text-muted-foreground">Просто и без ожидания</p></div></div></section>

    <section id="shop" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-[.2em] text-muted-foreground">Магазин</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Выберите своё.</h2></div><label className="flex w-full items-center gap-3 border-b border-border pb-3 text-muted-foreground transition focus-within:border-foreground sm:max-w-xs"><span aria-hidden="true">⌕</span><input name="product-search" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Поиск по каталогу…" type="search" autoComplete="off" aria-label="Поиск по каталогу" /></label></div><div data-horizontal-scroll="true" className="mt-10 flex gap-2 overflow-x-auto pb-3">{[null, ...categories.map((category) => category.id)].map((categoryId) => { const category = categories.find((item) => item.id === categoryId); return <button key={categoryId ?? 'all'} type="button" onClick={() => setActiveCategory(categoryId)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${activeCategory === categoryId ? 'bg-primary font-bold text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'}`}>{category ? categoryName(category) : 'Все товары'}</button> })}</div>{error && <div role="alert" className="mb-8 rounded-2xl border border-border bg-secondary px-5 py-4 text-sm text-secondary-foreground">{error}</div>}{loading ? <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><div className="aspect-[.88] animate-pulse rounded-3xl bg-muted" /><div className="aspect-[.88] animate-pulse rounded-3xl bg-muted" /><div className="aspect-[.88] animate-pulse rounded-3xl bg-muted" /></div> : filteredProducts.length === 0 ? <div className="mt-10 rounded-3xl border border-border px-6 py-20 text-center text-muted-foreground">Ничего не найдено. Попробуйте изменить запрос.</div> : <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={(id) => void addToCart(id)} />)}</div>}</section>

    <section id="story" className="border-y border-border bg-primary px-5 py-20 text-primary-foreground sm:px-8 lg:py-28"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><p className="font-mono text-xs uppercase tracking-[.2em] opacity-60">Наш подход</p><div><h2 className="max-w-3xl text-5xl font-semibold leading-[.9] tracking-[-.07em] sm:text-7xl">Покупайте реже.<br />Выбирайте лучше.</h2><p className="mt-7 max-w-xl text-lg leading-8 opacity-65">Мы собираем коллекцию полезных вещей с характером — для тех, кто ценит форму, функцию и немного смелости.</p></div></div></section><section id="journal" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28"><div className="flex items-end justify-between"><div><p className="font-mono text-xs uppercase tracking-[.2em] text-muted-foreground">Журнал</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Идеи без лишнего.</h2></div><span className="hidden font-mono text-xs text-muted-foreground sm:block">03 заметки</span></div><div className="mt-10 grid gap-5 md:grid-cols-3">{['Как замедлить утро', 'Форма следует функции', 'Меньше, но лучше'].map((title, index) => <article key={title} className="rounded-3xl border border-border bg-card p-6"><p className="font-mono text-xs text-muted-foreground">0{index + 1} / ЗАМЕТКА</p><h3 className="mt-16 text-2xl font-semibold leading-tight">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Идеи и наблюдения о вещах, которые меняют повседневность.</p></article>)}</div></section></main>

  <footer id="support" className="border-t border-border px-5 py-12 sm:px-8 lg:py-16"><div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_.8fr_.8fr] md:gap-16"><div><p className="font-mono text-sm font-bold uppercase tracking-[.18em]">northstar</p><p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Продуманные вещи для современной жизни.</p></div><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Контакты</p><div className="mt-4 space-y-2 text-sm"><a className="block transition hover:text-muted-foreground" href="mailto:hello@northstar.store">hello@northstar.store</a><p className="text-muted-foreground">Пн–Пт, 10:00–19:00</p></div></div><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Информация</p><button type="button" onClick={() => setPrivacyOpen(true)} className="mt-4 text-left text-sm transition hover:text-muted-foreground">Политика конфиденциальности</button></div></div><p className="mx-auto mt-10 max-w-7xl border-t border-border pt-5 text-xs text-muted-foreground">© 2026 Northstar. Все права защищены.</p></footer>

  <AnimatePresence>{cartOpen && <CartDrawer cart={cart} products={products} cartTotal={cartTotal} onClose={() => setCartOpen(false)} onChangeQuantity={changeQuantity} />}</AnimatePresence>
  {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
  {cookieConsent === false && <CookieConsent onAccept={saveCookieConsent} onRequiredOnly={saveCookieConsent} onPrivacy={() => setPrivacyOpen(true)} />}
  <AuthPanel open={authOpen} onClose={() => setAuthOpen(false)} />
 </div>
}

export default App
