import { useEffect, useRef, useState, type FormEvent, type TouchEvent } from 'react'
import './App.css'

type Product = {
  id: string
  name: string
  description: string
  price: number
  old_price: number | null
  is_promo: boolean
  images: string[]
  published: boolean
  category_id: string | null
  created_at?: string
}
type Category = { id: string; name: string; created_at?: string }

type Session = { access_token: string; refresh_token: string; user: { email: string } }
// VITE_SUPABASE_URL should be the project base URL. Strip service suffixes
// if one was pasted accidentally so auth, REST and Storage all use the same base.
const apiUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
  .replace(/\/+$/, '')
  .replace(/\/(?:rest|auth|storage)\/v1$/i, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const configured = Boolean(apiUrl && anonKey)
const phone = '+380991036666'
const phoneLabel = '+38 (099) 103-66-66'

const features = ['Меблі від виробника', 'Виготовлення за індивідуальними розмірами', 'Будь-який колір металу та тканини на вибір', 'Надійне порошкове фарбування металу', 'Знімні подушки для зручного догляду', 'Доставка по всій Україні']

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  if (!apiUrl || !anonKey) throw new Error('Додайте адресу Supabase та публічний ключ у .env.local')
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = payload?.message || payload?.msg || response.statusText || 'невідома помилка'
    const details = [payload?.code && `код ${payload.code}`, payload?.details, payload?.hint && `підказка: ${payload.hint}`].filter(Boolean).join(' · ')
    throw new Error(`Supabase ${response.status} для ${apiUrl}${path}: ${message}${details ? ` (${details})` : ''}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

async function getProducts(): Promise<Product[]> {
  return request<Product[]>('/rest/v1/products?select=*&published=eq.true&order=created_at.desc')
}
async function getCategories(): Promise<Category[]> {
  return request<Category[]>('/rest/v1/categories?select=*&order=name.asc')
}

function money(value: number) { return `${new Intl.NumberFormat('uk-UA').format(value)} ₴` }
function discountPercent(product: Product) {
  if (!product.old_price || product.old_price <= product.price) return 0
  return Math.round((1 - product.price / product.old_price) * 100)
}

function getStorageObjectPath(publicUrl: string) {
  const marker = '/storage/v1/object/public/sofas/'
  const index = publicUrl.indexOf(marker)
  return index < 0 ? null : decodeURIComponent(publicUrl.slice(index + marker.length))
}

function ProductCard({ product, categoryName }: { product: Product; categoryName?: string }) {
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const images = product.images.length ? product.images : ['/images/placeholder.svg']
  const close = () => setGalleryOpen(false)
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null }
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 45 || images.length < 2) return
    setGalleryIndex(index => (index + (delta < 0 ? 1 : -1) + images.length) % images.length)
  }
  useEffect(() => {
    if (!galleryOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') setGalleryIndex(i => (i - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setGalleryIndex(i => (i + 1) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [galleryOpen, images.length])
  return <article className="product-card">
    <button type="button" className="product-photo" onClick={() => { setGalleryIndex(0); setGalleryOpen(true) }} aria-label={`Відкрити галерею: ${product.name}`}>
      <img src={images[0]} alt={product.name} />
      {product.is_promo && <span className="sale-tag">{discountPercent(product) ? `Акція −${discountPercent(product)}%` : 'Акція'}</span>}
      {images.length > 1 && <span className="photo-count">{images.length} фото</span>}
    </button>
    <div className="product-info">
      {categoryName && <span className="product-category-tag">{categoryName}</span>}
      <h3>{product.is_promo && <span className="promo-fire" aria-label="Акція">🔥 </span>}{product.name}</h3>
      <p>{product.description}</p>
      <div className="product-price"><strong>{money(product.price)}</strong>{product.is_promo && product.old_price && <del>{money(product.old_price)}</del>}</div>
      
    </div>
    {galleryOpen && <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Фотографії: ${product.name}`} onClick={close}>
      <button type="button" className="lightbox-close" onClick={close} aria-label="Закрити">×</button>
      <p className="lightbox-counter">{product.name} · {galleryIndex + 1} / {images.length}</p>
      {images.length > 1 && <button type="button" className="lightbox-nav lightbox-prev" onClick={e => { e.stopPropagation(); setGalleryIndex(i => (i - 1 + images.length) % images.length) }} aria-label="Попереднє фото">‹</button>}
      <div className="lightbox-stage" onClick={e => e.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}><img className="lightbox-img" src={images[galleryIndex]} alt={`${product.name} — фото ${galleryIndex + 1}`}/></div>
      {images.length > 1 && <button type="button" className="lightbox-nav lightbox-next" onClick={e => { e.stopPropagation(); setGalleryIndex(i => (i + 1) % images.length) }} aria-label="Наступне фото">›</button>}
      {images.length > 1 && <div className="product-gallery-thumbs" onClick={e => e.stopPropagation()}>{images.map((src, i) => <button type="button" key={`${src}-${i}`} className={i === galleryIndex ? 'active' : ''} onClick={() => setGalleryIndex(i)} aria-label={`Фото ${i + 1}`}><img src={src} alt=""/></button>)}</div>}
    </div>}
  </article>
}

function Admin() {
  const [session, setSession] = useState<Session | null>(() => {
    try { return JSON.parse(localStorage.getItem('sofa-session') || 'null') as Session | null } catch { return null }
  })
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [editorImages, setEditorImages] = useState<string[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [diagnostic, setDiagnostic] = useState('')

  const load = async (token: string) => {
    const [rows, categoryRows] = await Promise.all([
      request<Product[]>('/rest/v1/products?select=*&order=created_at.desc', {}, token),
      request<Category[]>('/rest/v1/categories?select=*&order=name.asc', {}, token),
    ])
    setProducts(rows)
    setCategories(categoryRows)
  }
  useEffect(() => { if (session) load(session.access_token).catch((e: Error) => setError(e.message)) }, [session])
  useEffect(() => { setEditorImages(editing?.images.slice() || []) }, [editing])

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setBusy(true)
    const data = new FormData(e.currentTarget)
    try {
      const next = await request<Session>('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) })
      localStorage.setItem('sofa-session', JSON.stringify(next)); setSession(next)
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  async function saveProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!session) return
    setError(''); setNotice(''); setBusy(true)
    const form = new FormData(e.currentTarget)
    try {
      const id = editing?.id || crypto.randomUUID()
      const images = editorImages.slice()
      const removedImages = editing?.images.filter(url => !editorImages.includes(url)) || []
      const files = form.getAll('photos').filter((item): item is File => item instanceof File && item.size > 0)
      for (const file of files) {
        setNotice(`Завантаження фото ${images.length + 1} з ${images.length + files.length}…`)
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
        const objectPath = `${id}/${crypto.randomUUID()}-${safeName}`
        const uploaded = await fetch(`${apiUrl}/storage/v1/object/sofas/${objectPath}`, { method: 'POST', headers: { apikey: anonKey!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'false' }, body: file })
        if (!uploaded.ok) {
          const responseText = await uploaded.text()
          const message = `Supabase Storage ${uploaded.status}: ${responseText || uploaded.statusText}`
          setDiagnostic(JSON.stringify({ step: 'upload', status: uploaded.status, file: file.name, response: responseText }, null, 2))
          throw new Error(message)
        }
        images.push(`${apiUrl}/storage/v1/object/public/sofas/${objectPath}`)
      }
      const categoryValue = String(form.get('category_id') || '')
      const product = { id, name: String(form.get('name')).trim(), description: String(form.get('description')).trim(), price: Number(form.get('price')), old_price: form.get('old_price') ? Number(form.get('old_price')) : null, is_promo: form.get('is_promo') === 'on', images, published: form.get('published') === 'on', category_id: categoryValue || null }
      // The "new product" editor also has an editing object, but its id is empty.
      // Only an existing database id should use PATCH.
      const isUpdate = Boolean(editing?.id)
      const method = isUpdate ? 'PATCH' : 'POST'
      const path = `/rest/v1/products${isUpdate ? `?id=eq.${id}` : ''}`
      setNotice('Надсилаємо товар до бази…')
      setDiagnostic(JSON.stringify({ step: 'database', method, endpoint: path, payload: product }, null, 2))
      const savedRows = await request<Product[]>(path, { method, headers: { Prefer: 'return=representation' }, body: JSON.stringify(product) }, session.access_token)
      if (!savedRows.length) {
        throw new Error(`Supabase прийняв запит, але не повернув зміненого товару. Для ${method} це зазвичай означає, що рядок не знайдено або його заблокувала політика доступу. Перевірте таблицю products та RLS.`)
      }
      const storageCleanupErrors: string[] = []
      for (const imageUrl of removedImages) {
        const objectPath = getStorageObjectPath(imageUrl)
        if (!objectPath) continue
        const response = await fetch(`${apiUrl}/storage/v1/object/sofas`, {
          method: 'DELETE',
          headers: { apikey: anonKey!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefixes: [objectPath] }),
        })
        if (!response.ok) storageCleanupErrors.push(`${objectPath}: ${await response.text()}`)
      }
      setEditing(null); setNotice('Товар збережено в Supabase'); await load(session.access_token)
      if (storageCleanupErrors.length) setNotice(`Товар збережено, але ${storageCleanupErrors.length} фото не вдалося видалити зі сховища.`)
      setDiagnostic(JSON.stringify({ step: 'database', method, endpoint: path, payload: product, response: savedRows, removedPhotos: removedImages.length - storageCleanupErrors.length, storageCleanupErrors }, null, 2) + '\n\nСписок товарів оновлено.')
    } catch (err) { setError((err as Error).message); setNotice(''); setDiagnostic(prev => `${prev}\n\nПомилка: ${(err as Error).message}`) } finally { setBusy(false) }
  }

  async function removeProduct(product: Product) {
    if (!session || !window.confirm(`Видалити «${product.name}»?`)) return
    try { await request(`/rest/v1/products?id=eq.${product.id}`, { method: 'DELETE' }, session.access_token); await load(session.access_token); setNotice('Товар видалено') }
    catch (err) { setError((err as Error).message) }
  }

  async function addCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!session) return
    const name = newCategoryName.trim()
    if (!name) return
    setBusy(true); setError(''); setNotice('')
    try {
      const created = await request<Category[]>('/rest/v1/categories', {
        method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ name }),
      }, session.access_token)
      if (!created.length) throw new Error('Категорію не створено. Перевірте таблицю categories та RLS.')
      setNewCategoryName(''); setNotice(`Категорію «${name}» створено`); await load(session.access_token)
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  async function removeCategory(category: Category) {
    if (!session || !window.confirm(`Видалити категорію «${category.name}»? Товари залишаться без категорії.`)) return
    setBusy(true); setError(''); setNotice('')
    try {
      await request(`/rest/v1/categories?id=eq.${category.id}`, { method: 'DELETE' }, session.access_token)
      if (editing?.category_id === category.id) setEditing({ ...editing, category_id: null })
      setNotice(`Категорію «${category.name}» видалено`); await load(session.access_token)
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  function logout() { localStorage.removeItem('sofa-session'); setSession(null); setProducts([]) }

  return <main className="admin-page"><div className="admin-top"><a className="logo" href="/"><span className="logo-mark">Диван</span><span className="logo-sub">від виробника</span></a><a href="/">На сайт ↗</a></div>
    {!configured && <div className="notice">Щоб увімкнути адмінку, задайте <code>VITE_SUPABASE_URL</code> та <code>VITE_SUPABASE_ANON_KEY</code> у файлі <code>.env.local</code> і в налаштуваннях Vercel.</div>}
    {!session ? <form className="admin-login" onSubmit={signIn}><span className="eyebrow">Керування магазином</span><h1>Вхід менеджера</h1><p>Увійдіть з обліковим записом Supabase.</p><label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Пароль<input name="password" type="password" autoComplete="current-password" required /></label><button className="btn btn-primary" disabled={!configured || busy}>{busy ? 'Зачекайте…' : 'Увійти'}</button>{error && <p className="error-text">{error}</p>}</form> : <section className="admin-content"><div className="admin-heading"><div><span className="eyebrow">Каталог</span><h1>Товари</h1></div><button className="btn btn-ghost" onClick={logout}>Вийти</button></div>
      {notice && <p className="success-text">{notice}</p>}{error && <p className="error-text">{error}</p>}{diagnostic && <details className="diagnostic"><summary>Діагностика останнього запиту</summary><pre>{diagnostic}</pre></details>}
      <div className="admin-layout"><div className="admin-list">
        <section className="category-manager"><div><h2>Категорії</h2><p>Організуйте каталог за напрямами</p></div><form className="category-create" onSubmit={addCategory}><input aria-label="Назва нової категорії" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Наприклад, Дивани для дому" required/><button className="btn btn-primary" disabled={busy}>Додати</button></form><div className="category-admin-list">{categories.map(category => <span className="category-admin-chip" key={category.id}>{category.name}<button type="button" aria-label={`Видалити категорію ${category.name}`} onClick={() => removeCategory(category)} disabled={busy}>×</button></span>)}{!categories.length && <small>Категорій ще немає</small>}</div></section>
        <div className="admin-list-head"><h2>Товари · {products.length}</h2><button className="btn btn-primary" onClick={() => setEditing({ id: '', name: '', description: '', price: 0, old_price: null, is_promo: false, images: [], published: true, category_id: null })}>Додати диван +</button></div>
        {products.map(product => <article className="admin-row" key={product.id}><img src={product.images[0] || '/images/placeholder.svg'} alt=""/><div className="admin-row-copy"><strong>{product.is_promo && '🔥 '}{product.name}</strong><span>{money(product.price)} · {categories.find(category => category.id === product.category_id)?.name || 'Без категорії'} · {product.published ? 'Опубліковано' : 'Чернетка'}{product.is_promo ? ' · Акція' : ''}</span></div><button onClick={() => setEditing(product)}>Змінити</button><button className="delete-button" onClick={() => removeProduct(product)}>Видалити</button></article>)}
      </div>
      {editing && <form className="product-editor" key={editing.id || 'new'} onSubmit={saveProduct}><div className="editor-head"><h2>{editing.name ? 'Змінити товар' : 'Новий товар'}</h2><button type="button" aria-label="Закрити" onClick={() => setEditing(null)}>×</button></div><label>Назва<input name="name" required defaultValue={editing.name}/></label><label>Опис<textarea name="description" rows={4} defaultValue={editing.description}/></label><label>Категорія<select name="category_id" value={editing.category_id || ''} onChange={e => setEditing({ ...editing, category_id: e.target.value || null })}><option value="">Без категорії</option>{categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><div className="editor-prices"><label>Ціна, ₴<input name="price" type="number" min="0" required defaultValue={editing.price || ''}/></label><label>Ціна до знижки, ₴<input name="old_price" type="number" min="0" defaultValue={editing.old_price || ''}/></label></div><label className="check-label promo-check"><input type="checkbox" name="is_promo" defaultChecked={editing.is_promo}/> Позначити як акцію{editing.old_price && editing.price ? <span>Знижка зараз −{discountPercent(editing)}%</span> : null}</label><label>Фотографії<input name="photos" type="file" accept="image/*" multiple/><small>Оберіть додаткові фото. Щоб видалити поточне, натисніть × на його мініатюрі.</small></label>{editorImages.length > 0 && <div className="editor-photos">{editorImages.map(url => <div className="editor-photo" key={url}><img src={url} alt="Фото товару"/><button type="button" aria-label="Видалити фото" title="Видалити фото" onClick={() => setEditorImages(current => current.filter(image => image !== url))}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button></div>)}</div>}<label className="check-label"><input type="checkbox" name="published" defaultChecked={editing.published}/> Опублікувати на сайті</label><button className="btn btn-primary" disabled={busy}>{busy ? 'Зберігаємо…' : 'Зберегти товар'}</button></form>}
      </div>
    </section>}
  </main>
}

function Storefront() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'price-desc'>('newest')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [loadError, setLoadError] = useState('')
  const [slideIndex, setSlideIndex] = useState(0)
  const [carouselPaused, setCarouselPaused] = useState(false)
  const [footerTaps, setFooterTaps] = useState(0)
  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([rows, categoryRows]) => { setProducts(rows); setCategories(categoryRows) })
      .catch((err: Error) => setLoadError(err.message))
  }, [])
  useEffect(() => {
    if (!sortMenuOpen) return
    const closeOnOutside = (event: PointerEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) setSortMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSortMenuOpen(false) }
    document.addEventListener('pointerdown', closeOnOutside)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [sortMenuOpen])
  const filteredProducts = products
    .filter(product => selectedCategory === 'all' || product.category_id === selectedCategory)
    .sort((a, b) => sortOrder === 'price-desc' ? b.price - a.price : (b.created_at || '').localeCompare(a.created_at || ''))
  const pageSize = 9
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize)
  const slides = products.length
    ? products.map(product => ({ src: product.images[0] || '/images/placeholder.svg', label: product.name }))
    : ['/images/sofa-1.jpg', '/images/sofa-2.jpg', '/images/sofa-3.jpg', '/images/sofa-4.jpg', '/images/sofa-5.jpg'].map((src, i) => ({ src, label: `Диван M31 · фото ${i + 1}` }))
  const currentSlide = slides[slideIndex % slides.length]
  useEffect(() => {
    setSlideIndex(i => i % slides.length)
    if (carouselPaused || slides.length < 2) return
    const timer = window.setInterval(() => setSlideIndex(i => (i + 1) % slides.length), 5000)
    return () => window.clearInterval(timer)
  }, [slides.length, carouselPaused])
  return <div className="landing" id="top"><header className="site-header"><div className="container header-inner"><a href="#top" className="logo"><span className="logo-mark">Диван</span><span className="logo-sub">від виробника</span></a><nav className="main-nav"><a href="#catalog">Каталог</a><a href="#about">Про нас</a></nav><a className="header-cta" href={`tel:${phone}`}>Зателефонувати</a></div></header>
    <main><section className="hero"><div className="container hero-grid"><div className="hero-copy"><span className="eyebrow">Меблі для вашого простору</span><h1 className="hero-title">Затишок, який створений для вас</h1><p className="hero-lead">Виготовляємо стильні дивани та меблі від виробника. Підберемо розмір, тканину й колір під ваш простір.</p><div className="hero-actions"><a className="btn btn-primary" href="#catalog">Переглянути каталог</a><a className="btn btn-ghost" href={`tel:${phone}`}>{phoneLabel}</a></div><div className="hero-note">Доставка по всій Україні · Власне виробництво</div></div><div className="hero-gallery"><div className="gallery hero-carousel" onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)}><img key={currentSlide.src} className="gallery-main hero-slide-image" src={currentSlide.src} alt={currentSlide.label}/><span className="hero-photo-label">{currentSlide.label}</span>{slides.length > 1 && <><button type="button" className="carousel-arrow carousel-prev" aria-label="Попереднє фото" onClick={() => setSlideIndex(i => (i - 1 + slides.length) % slides.length)}>‹</button><button type="button" className="carousel-arrow carousel-next" aria-label="Наступне фото" onClick={() => setSlideIndex(i => (i + 1) % slides.length)}>›</button><div className="carousel-dots">{slides.map((slide, i) => <button key={`${slide.src}-${i}`} type="button" className={i === slideIndex ? 'active' : ''} aria-label={`Показати ${slide.label}`} onClick={() => setSlideIndex(i)}/>)}</div></>}</div></div></div></section>
      <section className="section catalog-section"><div className="container"><div className="section-head" id="catalog"><span className="eyebrow">Знайдіть свій</span><h2>Каталог диванів</h2><p>Перегляньте моделі та зателефонуйте, щоб уточнити розміри й варіанти тканин.</p></div>
        {loadError && <p className="catalog-message">Не вдалося завантажити каталог із бази. {loadError}</p>}
        {!loadError && <><div className="catalog-toolbar"><div className="category-filters" role="group" aria-label="Фільтр за категорією"><button type="button" className={selectedCategory === 'all' ? 'active' : ''} onClick={() => { setSelectedCategory('all'); setPage(1) }}>Усі товари</button>{categories.map(category => <button type="button" key={category.id} className={selectedCategory === category.id ? 'active' : ''} onClick={() => { setSelectedCategory(category.id); setPage(1) }}>{category.name}</button>)}</div><div className="catalog-sort"><span>Сортування</span><div className="sort-dropdown" ref={sortMenuRef}><button type="button" className="sort-trigger" aria-haspopup="menu" aria-expanded={sortMenuOpen} onClick={() => setSortMenuOpen(open => !open)}><span>{sortOrder === 'newest' ? 'Спочатку нові' : 'Ціна: від високої до низької'}</span><svg className={sortMenuOpen ? 'open' : ''} viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5"/></svg></button>{sortMenuOpen && <div className="sort-menu" role="menu"><button type="button" role="menuitemradio" aria-checked={sortOrder === 'newest'} onClick={() => { setSortOrder('newest'); setPage(1); setSortMenuOpen(false) }}>Спочатку нові</button><button type="button" role="menuitemradio" aria-checked={sortOrder === 'price-desc'} onClick={() => { setSortOrder('price-desc'); setPage(1); setSortMenuOpen(false) }}>Ціна: від високої до низької</button></div>}</div></div></div>
          {visibleProducts.length ? <><p className="catalog-count">Товарів: {filteredProducts.length}</p><div className="product-grid">{visibleProducts.map(product => <ProductCard key={product.id} product={product} categoryName={categories.find(category => category.id === product.category_id)?.name}/>)}</div>{pageCount > 1 && <nav className="pagination" aria-label="Сторінки каталогу"><button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)}>← Попередня</button><span>Сторінка {page} з {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage(current => current + 1)}>Наступна →</button></nav>}</> : <p className="catalog-message">У цій категорії товарів поки немає.</p>}</>}
      </div></section>
      <section className="section section-alt"><div className="container"><div className="highlight-card" id="about"><div><div className="highlight-icon" aria-hidden>🛠</div><span className="eyebrow">Напряму від виробника</span><h3>Продумано для щоденного комфорту</h3><p>Виготовляємо меблі з увагою до деталей. Допоможемо обрати матеріали та конфігурацію, а готове замовлення доставимо по Україні.</p></div><div className="features-grid">{features.map(text => <article className="feature-card" key={text}><span aria-hidden>✓</span><p>{text}</p></article>)}</div></div></div></section>
      <section className="contact-band"><div className="container contact-inner"><div><span className="eyebrow">Є питання?</span><h2>Допоможемо обрати ваш диван</h2></div><a className="btn btn-primary" href={`tel:${phone}`}>Зателефонувати · {phoneLabel}</a></div></section>
    </main><footer className="site-footer"><div className="container footer-inner"><button type="button" className="footer-secret-trigger" aria-label="Меблі від виробника · доставка по Україні" onClick={() => setFooterTaps(count => Math.min(count + 1, 10))}>Меблі від виробника · доставка по Україні</button>{footerTaps >= 10 && <a className="footer-manager-link" href="/admin">Вхід менеджера ↗</a>}</div></footer></div>
}

function App() {
  const [adminRoute, setAdminRoute] = useState(window.location.pathname === '/admin')
  useEffect(() => { const update = () => setAdminRoute(window.location.pathname === '/admin'); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update) }, [])
  return adminRoute ? <Admin/> : <Storefront/>
}

export default App
