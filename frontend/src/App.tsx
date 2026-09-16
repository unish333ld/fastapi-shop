import { useEffect, useMemo, useState } from 'react'

type Category = { id: number; name: string; slug: string }
type Product = {
  id: number
  name: string
  description: string | null
  price: number
  category_id: number
  image_url: string | null
  category: Category
}
type ProductListResponse = { products: Product[]; total: number }
type CartLine = { product_id: number; quantity: number }

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
  return response.json() as Promise<T>
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (id: number) => void }) {
  return (
    <article className="group">
      <div className="relative aspect-[.91] overflow-hidden rounded-[1.4rem] bg-[#e9e4da]">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105" />
        ) : <div className="grid h-full place-items-center font-serif text-3xl text-[#173f45]/30">northstar</div>}
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="rounded-full bg-[#fffdf8]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#173f45]">{product.category.name}</span>
          <button type="button" className="grid size-9 place-items-center rounded-full bg-[#fffdf8]/90 text-lg text-[#173f45] transition hover:bg-[#f5c56a]" aria-label={`Save ${product.name}`}>♡</button>
        </div>
        <button type="button" onClick={() => onAdd(product.id)} className="absolute bottom-4 left-4 right-4 translate-y-2 rounded-full bg-[#173f45] px-4 py-3 text-sm font-semibold text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-[#28565b]">Add to bag <span className="float-right">+</span></button>
      </div>
      <div className="flex items-start justify-between gap-4 px-1 pt-4">
        <div className="min-w-0"><h3 className="truncate font-serif text-[1.25rem] text-[#173f45]">{product.name}</h3><p className="mt-1 line-clamp-2 text-sm leading-5 text-[#7d8988]">{product.description}</p></div>
        <strong className="shrink-0 pt-1 text-sm font-semibold text-[#173f45]">{formatPrice(product.price)}</strong>
      </div>
    </article>
  )
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadStore() {
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          fetchJson<ProductListResponse>('/api/products'),
          fetchJson<Category[]>('/api/categories'),
        ])
        setProducts(productResponse.products)
        setCategories(categoryResponse)
      } catch {
        setError('Не удалось загрузить каталог. Проверь, запущен ли backend.')
      } finally {
        setLoading(false)
      }
    }
    void loadStore()
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      const categoryMatch = activeCategory === null || product.category_id === activeCategory
      const searchMatch = !query || `${product.name} ${product.description ?? ''}`.toLowerCase().includes(query)
      return categoryMatch && searchMatch
    })
  }, [activeCategory, products, search])

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const cartTotal = cart.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.product_id)
    return sum + (product?.price ?? 0) * line.quantity
  }, 0)
  const featuredProduct = products[0]

  async function addToCart(productId: number) {
    const nextCart = [...cart]
    const existingLine = nextCart.find((line) => line.product_id === productId)
    if (existingLine) existingLine.quantity += 1
    else nextCart.push({ product_id: productId, quantity: 1 })
    try {
      const cartData = Object.fromEntries(cart.map((line) => [line.product_id, line.quantity]))
      await fetchJson('/api/cart/add', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity: 1, cart: cartData }) })
      setCart(nextCart)
      setCartOpen(true)
      setError('')
    } catch {
      setError('Не удалось добавить товар в корзину.')
    }
  }

  function changeQuantity(productId: number, amount: number) {
    setCart((current) => current.map((line) => line.product_id === productId ? { ...line, quantity: line.quantity + amount } : line).filter((line) => line.quantity > 0))
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#173f45]">
      <div className="bg-[#173f45] px-5 py-2.5 text-center text-[10px] font-bold uppercase tracking-[.2em] text-[#f8c56b]">Complimentary shipping on orders over $100 · Designed for daily rituals</div>
      <header className="sticky top-0 z-10 border-b border-[#e3e5df] bg-[#f7f5f0]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-5 px-5 py-5 sm:px-8 lg:px-12">
          <a href="#top" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#173f45] text-base text-[#f8c56b]">✦</span><span className="font-serif text-2xl font-semibold tracking-[-.03em]">northstar</span></a>
          <nav className="hidden items-center gap-9 text-sm font-medium text-[#687477] md:flex"><a href="#shop" className="text-[#173f45]">Shop</a><a href="#story" className="transition hover:text-[#c2694a]">Our story</a><a href="#journal" className="transition hover:text-[#c2694a]">Journal</a></nav>
          <div className="flex items-center gap-2"><a href="#shop" className="hidden rounded-full p-2.5 text-xl hover:bg-white sm:block" aria-label="Search">⌕</a><button type="button" onClick={() => setCartOpen(true)} className="flex items-center gap-2 rounded-full border border-[#cfd8d1] bg-white px-3.5 py-2 text-sm font-semibold transition hover:border-[#173f45]"><span>Bag</span><span className="grid size-6 place-items-center rounded-full bg-[#f5c56a] text-xs">{cartCount}</span></button></div>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-[1400px] gap-8 px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-12 lg:pb-24 lg:pt-20">
          <div className="order-2 lg:order-1"><p className="mb-5 text-[11px] font-bold uppercase tracking-[.24em] text-[#c2694a]">A considered collection</p><h1 className="max-w-xl font-serif text-[3.5rem] leading-[.94] tracking-[-.055em] sm:text-7xl lg:text-[6.6rem]">Objects with a <em className="text-[#c2694a]">point of view.</em></h1><p className="mt-7 max-w-md text-base leading-7 text-[#687477]">Everyday pieces, thoughtfully selected. Less noise, more meaning — for homes and routines that feel entirely your own.</p><a href="#shop" className="mt-8 inline-flex items-center gap-4 rounded-full bg-[#173f45] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28565b]">Shop the edit <span className="text-lg">↘</span></a><div className="mt-12 flex items-center gap-8 border-t border-[#dfe4dc] pt-5 text-xs text-[#7d8988]"><span><strong className="block font-serif text-2xl text-[#173f45]">01</strong>Curated categories</span><span><strong className="block font-serif text-2xl text-[#173f45]">24h</strong>Fast dispatch</span></div></div>
          <div className="order-1 relative min-h-[390px] overflow-hidden rounded-[2rem] bg-[#d8e0d8] lg:order-2 lg:min-h-[650px]">{featuredProduct?.image_url ? <img src={featuredProduct.image_url} alt="Featured product" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#d8e0d8] via-[#e8dccb] to-[#bdc8bd]" />}<div className="absolute inset-0 bg-gradient-to-t from-[#173f45]/65 via-transparent to-transparent" /><div className="absolute left-6 top-6 rounded-full bg-[#fffdf8]/85 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#173f45]">Spring / Summer 2026</div><div className="absolute bottom-7 left-7 right-7 flex items-end justify-between text-white"><div><p className="text-xs uppercase tracking-[.18em] text-white/70">The first essential</p><p className="mt-2 font-serif text-3xl sm:text-4xl">Made to be kept.</p></div><a href="#shop" className="grid size-12 place-items-center rounded-full bg-[#f5c56a] text-xl text-[#173f45] transition hover:scale-105" aria-label="Shop collection">↗</a></div></div>
        </section>

        <section className="border-y border-[#e3e5df] bg-[#fffdf8]"><div className="mx-auto grid max-w-[1400px] gap-0 px-5 sm:grid-cols-3 sm:px-8 lg:px-12"><div className="flex items-center gap-4 border-b border-[#e3e5df] py-5 sm:border-b-0 sm:border-r sm:pr-8"><span className="text-2xl text-[#c2694a]">✦</span><div><p className="text-sm font-semibold">Thoughtfully chosen</p><p className="mt-1 text-xs text-[#7d8988]">Curated, never crowded</p></div></div><div className="flex items-center gap-4 border-b border-[#e3e5df] py-5 sm:border-b-0 sm:border-r sm:px-8"><span className="text-2xl text-[#c2694a]">◌</span><div><p className="text-sm font-semibold">Made to last</p><p className="mt-1 text-xs text-[#7d8988]">Quality over quantity</p></div></div><div className="flex items-center gap-4 py-5 sm:pl-8"><span className="text-2xl text-[#c2694a]">↗</span><div><p className="text-sm font-semibold">Easy, always</p><p className="mt-1 text-xs text-[#7d8988]">Simple shipping & returns</p></div></div></div></section>

        <section id="shop" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 pb-24 pt-20 sm:px-8 lg:px-12"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#c2694a]">The edit</p><h2 className="mt-3 font-serif text-4xl tracking-[-.04em] sm:text-5xl">Find your everyday favourite.</h2></div><label className="flex w-full items-center gap-3 border-b border-[#9eaaa5] py-2 sm:max-w-xs"><span className="text-xl text-[#8a9794]">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[#9ba5a3]" placeholder="Search the collection" type="search" /></label></div><div className="mt-10 flex gap-2 overflow-x-auto border-b border-[#e3e5df] pb-4"><button type="button" onClick={() => setActiveCategory(null)} className={`whitespace-nowrap px-1 py-2 text-sm font-semibold transition ${activeCategory === null ? 'border-b-2 border-[#c2694a] text-[#173f45]' : 'text-[#899492] hover:text-[#173f45]'}`}>All products</button>{categories.map((category) => <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={`whitespace-nowrap px-1 py-2 text-sm font-semibold transition ${activeCategory === category.id ? 'border-b-2 border-[#c2694a] text-[#173f45]' : 'text-[#899492] hover:text-[#173f45]'}`}>{category.name}</button>)}</div>{error && <div className="mt-8 rounded-2xl border border-[#e8b6a4] bg-[#fff1eb] px-5 py-4 text-sm text-[#9b4e36]">{error}</div>}{loading ? <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3"><div className="aspect-[.91] animate-pulse rounded-[1.4rem] bg-[#e9e5dc]" /><div className="aspect-[.91] animate-pulse rounded-[1.4rem] bg-[#e9e5dc]" /><div className="aspect-[.91] animate-pulse rounded-[1.4rem] bg-[#e9e5dc]" /></div> : filteredProducts.length === 0 ? <div className="mt-10 rounded-3xl bg-white px-6 py-20 text-center text-[#687477]">Nothing found. Try another search.</div> : <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={(id) => void addToCart(id)} />)}</div>}</section>

        <section id="story" className="bg-[#e6dfcf] px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#c2694a]">Our point of view</p><h2 className="mt-4 max-w-xl font-serif text-4xl leading-[.98] tracking-[-.04em] text-[#173f45] sm:text-6xl">Buy less.<br /><em>Love more.</em></h2></div><div className="max-w-xl lg:pb-2"><p className="text-lg leading-8 text-[#173f45]/75">Northstar is a small collection of useful, beautiful things. We look for honest materials, quiet details, and objects that get better with time.</p><a href="#support" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#173f45] underline decoration-[#c2694a] decoration-2 underline-offset-8">Read our story <span>↗</span></a></div></div></section>

        <section id="journal" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12"><div className="flex items-end justify-between gap-6"><div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#c2694a]">From the journal</p><h2 className="mt-3 font-serif text-4xl tracking-[-.04em] sm:text-5xl">Small notes, well kept.</h2></div><a href="#support" className="hidden text-sm font-bold text-[#173f45] underline decoration-[#c2694a] decoration-2 underline-offset-8 sm:block">Read all <span>↗</span></a></div><div className="mt-10 grid gap-6 md:grid-cols-3"><article className="border-t border-[#cfd8d1] pt-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c2694a]">Rituals</p><h3 className="mt-4 font-serif text-2xl leading-tight text-[#173f45]">The quiet luxury of a slower morning</h3><p className="mt-3 text-sm leading-6 text-[#7d8988]">A few thoughtful objects can change the rhythm of an entire day.</p><a href="#support" className="mt-5 inline-block text-xs font-bold uppercase tracking-wider text-[#173f45]">Read note →</a></article><article className="border-t border-[#cfd8d1] pt-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c2694a]">Materials</p><h3 className="mt-4 font-serif text-2xl leading-tight text-[#173f45]">Why good materials matter more</h3><p className="mt-3 text-sm leading-6 text-[#7d8988]">The details you can feel, and the ones that quietly last.</p><a href="#support" className="mt-5 inline-block text-xs font-bold uppercase tracking-wider text-[#173f45]">Read note →</a></article><article className="border-t border-[#cfd8d1] pt-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c2694a]">Curation</p><h3 className="mt-4 font-serif text-2xl leading-tight text-[#173f45]">A guide to buying less, better</h3><p className="mt-3 text-sm leading-6 text-[#7d8988]">Our simple filter for things worth bringing home.</p><a href="#support" className="mt-5 inline-block text-xs font-bold uppercase tracking-wider text-[#173f45]">Read note →</a></article></div></section>
      </main>

      <footer id="support" className="bg-[#173f45] px-5 py-12 text-white sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1400px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-serif text-3xl">northstar</p><p className="mt-2 max-w-sm text-sm leading-6 text-white/60">Considered goods for a considered life.</p></div><div className="text-left text-sm text-white/60 sm:text-right"><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[#f5c56a]">Stay close</p><p>hello@northstar.store</p></div></div></footer>

      {cartOpen && <div className="fixed inset-0 z-20 bg-[#173f45]/40" onClick={() => setCartOpen(false)} />}
      <aside className={`fixed right-0 top-0 z-30 flex h-full w-full max-w-md flex-col bg-[#fffdf8] p-6 shadow-2xl transition-transform duration-300 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Shopping cart"><div className="flex items-center justify-between border-b border-[#dfe4dc] pb-5"><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#c2694a]">Your bag</p><h2 className="mt-1 font-serif text-3xl text-[#173f45]">Ready when you are.</h2></div><button type="button" onClick={() => setCartOpen(false)} className="grid size-10 place-items-center rounded-full bg-[#f1eee7] text-xl" aria-label="Close cart">×</button></div><div className="flex-1 overflow-y-auto py-6">{cart.length === 0 ? <p className="py-12 text-center text-sm text-[#7d8988]">Your bag is empty.</p> : <div className="space-y-5">{cart.map((line) => { const product = products.find((item) => item.id === line.product_id); if (!product) return null; return <div key={line.product_id} className="flex gap-4"><img src={product.image_url ?? ''} alt="" className="size-20 rounded-2xl bg-[#ebe7dc] object-cover" /><div className="min-w-0 flex-1"><p className="font-serif text-lg text-[#173f45]">{product.name}</p><p className="mt-1 text-sm text-[#7d8988]">{formatPrice(product.price)}</p><div className="mt-3 flex items-center gap-3"><button type="button" onClick={() => changeQuantity(product.id, -1)} className="grid size-7 place-items-center rounded-full bg-[#f1eee7]">−</button><span className="text-sm font-semibold">{line.quantity}</span><button type="button" onClick={() => changeQuantity(product.id, 1)} className="grid size-7 place-items-center rounded-full bg-[#f5c56a]">+</button></div></div></div> })}</div>}</div><div className="border-t border-[#dfe4dc] pt-5"><div className="flex justify-between text-sm text-[#687477]"><span>Subtotal</span><strong className="text-[#173f45]">{formatPrice(cartTotal)}</strong></div><button type="button" className="mt-5 w-full rounded-full bg-[#173f45] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#28565b]">Continue to checkout</button></div></aside>
    </div>
  )
}

export default App
