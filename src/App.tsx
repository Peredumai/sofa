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
const telegramUrl = 'https://t.me/Wlsmebel'
const viberUrl = 'viber://chat?number=%2B380980808062'

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
async function getProduct(id: string): Promise<Product | null> {
  const rows = await request<Product[]>(`/rest/v1/products?select=*&id=eq.${encodeURIComponent(id)}&published=eq.true`)
  return rows[0] || null
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

function productPageUrl(id: string, category: string, sort: 'newest' | 'price-desc', page: number) {
  const query = new URLSearchParams()
  if (category !== 'all') query.set('category', category)
  if (sort !== 'newest') query.set('sort', sort)
  if (page > 1) query.set('page', String(page))
  const suffix = query.toString()
  return `/product/${id}${suffix ? `?${suffix}` : ''}`
}

function catalogReturnUrl(search: string) {
  const current = new URLSearchParams(search)
  const query = new URLSearchParams()
  const category = current.get('category')
  const sort = current.get('sort')
  const page = current.get('page')
  if (category) query.set('category', category)
  if (sort === 'price-desc') query.set('sort', sort)
  if (page && Number(page) > 1) query.set('page', String(Number(page)))
  const suffix = query.toString()
  return `/${suffix ? `?${suffix}` : ''}#catalog`
}

function HeaderContacts() {
  return <div className="header-contact-links" aria-label="Написати продавцю">
    <a className="header-contact telegram-contact" href={telegramUrl} aria-label="Написати в Telegram" title="Telegram">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.7 4.4 17.6 19c-.2 1-1 1.2-1.8.7l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.3L5.2 13 0.4 11.5c-1-.3-1-1 .2-1.5L19.3 2.8c.9-.3 1.7.2 1.4 1.6Z"/></svg>
    </a>
    <a className="header-contact viber-contact" href={viberUrl} aria-label="Написати у Viber" title="Viber">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.1 4.1A10.2 10.2 0 0 0 12 1.3C6.1 1.3 1.4 5.8 1.4 11.4c0 1.8.5 3.6 1.5 5.1l-1 5.9 6-1.5c1.3.7 2.7 1 4.2 1 5.8 0 10.5-4.6 10.5-10.2 0-2.9-1.3-5.6-3.5-7.6ZM12 20a8.7 8.7 0 0 1-3.8-.9l-.3-.2-3.5.9.6-3.4-.2-.3a8.4 8.4 0 0 1-1.3-4.6A8.5 8.5 0 0 1 12 3.2a8.5 8.5 0 0 1 8.7 8.3A8.5 8.5 0 0 1 12 20Zm4.8-6.2c-.3-.1-1.5-.7-1.8-.8-.2-.1-.4-.1-.6.2-.2.3-.7.8-.9 1-.2.2-.3.2-.6.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.5-1.5-1.8-.2-.3 0-.4.1-.6l.4-.4.3-.5c.1-.2 0-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.2-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.7 4.4 3.7.6.2 1.1.4 1.4.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z"/></svg>
    </a>
  </div>
}

function ProductCard({ product, categoryName, category, sort, page }: { product: Product; categoryName?: string; category: string; sort: 'newest' | 'price-desc'; page: number }) {
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const images = product.images.length ? product.images : ['/images/placeholder.svg']
  const detailUrl = productPageUrl(product.id, category, sort, page)
  const rememberCatalogPosition = () => sessionStorage.setItem('catalog-return-scroll', String(window.scrollY))
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
    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') setGalleryIndex(i => (i - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setGalleryIndex(i => (i + 1) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousRootOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [galleryOpen, images.length])
  return <article className="product-card">
    <button type="button" className="product-photo" onClick={() => { setGalleryIndex(0); setGalleryOpen(true) }} aria-label={`Відкрити галерею: ${product.name}`}>
      <img src={images[0]} alt={product.name} />
      {product.is_promo && <span className="sale-tag">{discountPercent(product) ? `Акція −${discountPercent(product)}%` : 'Акція'}</span>}
      {images.length > 1 && <span className="photo-count">{images.length} фото</span>}
    </button>
    <div className="product-info">
      {categoryName && <span className="product-category-tag">{categoryName}</span>}
      <a className="product-title-link" href={detailUrl} onClick={rememberCatalogPosition}><h3>{product.is_promo && <span className="promo-fire" aria-label="Акція">🔥 </span>}{product.name}</h3></a>
      <p>{product.description}</p>
      <div className="product-price"><strong>{money(product.price)}</strong>{product.is_promo && product.old_price && <del>{money(product.old_price)}</del>}</div>
      <a className="btn btn-primary product-details-link" href={detailUrl} onClick={rememberCatalogPosition}>Детальніше про диван</a>
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

function ProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageIndex, setImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const backUrl = catalogReturnUrl(window.location.search)

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    Promise.all([getProduct(productId), getCategories()]).then(([row, categories]) => {
      if (!active) return
      setProduct(row)
      setCategoryName(categories.find(category => category.id === row?.category_id)?.name || '')
      setImageIndex(0)
      if (row) document.title = `${row.name} | Диван від виробника`
      setLoading(false)
    }).catch((err: Error) => { if (active) { setError(err.message); setLoading(false) } })
    return () => { active = false }
  }, [productId])

  const photos = product?.images.length ? product.images : ['/images/placeholder.svg']
  const previousPhoto = () => setImageIndex(index => (index - 1 + photos.length) % photos.length)
  const nextPhoto = () => setImageIndex(index => (index + 1) % photos.length)
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null }
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) >= 45 && photos.length > 1) delta < 0 ? nextPhoto() : previousPhoto()
  }
  useEffect(() => {
    if (!lightboxOpen) return
    const oldBodyOverflow = document.body.style.overflow
    const oldRootOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowLeft') previousPhoto()
      if (event.key === 'ArrowRight') nextPhoto()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = oldBodyOverflow
      document.documentElement.style.overflow = oldRootOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxOpen, photos.length])

  if (loading) return <main className="detail-message"><p>Завантажуємо товар…</p></main>
  if (!product) return <main className="detail-message"><h1>Товар не знайдено</h1><p>{error || 'Можливо, його зняли з продажу або посилання застаріло.'}</p><a className="btn btn-primary" href={backUrl}>Повернутися до каталогу</a></main>

  return <div className="landing product-detail-page"><header className="site-header"><div className="container header-inner"><a href="/" className="logo"><span className="logo-mark">Диван</span><span className="logo-sub">від виробника</span></a><HeaderContacts/><a className="header-cta" href={`tel:${phone}`}>Зателефонувати</a></div></header>
    <main className="container detail-main"><a className="detail-back" href={backUrl}>← До каталогу</a><div className="detail-layout"><div className="detail-gallery-column"><button type="button" className="detail-main-photo" onClick={() => setLightboxOpen(true)} aria-label="Відкрити фото на весь екран"><img src={photos[imageIndex]} alt={`${product.name} — фото ${imageIndex + 1}`}/><span>Збільшити фото ⤢</span></button>{photos.length > 1 && <div className="detail-thumbnails">{photos.map((photo, index) => <button type="button" key={`${photo}-${index}`} className={index === imageIndex ? 'active' : ''} onClick={() => setImageIndex(index)} aria-label={`Фото ${index + 1}`}><img src={photo} alt=""/></button>)}</div>}</div>
      <article className="detail-copy">{categoryName && <span className="product-category-tag">{categoryName}</span>}{product.is_promo && <span className="detail-promo">🔥 Акційна пропозиція{discountPercent(product) ? ` · −${discountPercent(product)}%` : ''}</span>}<h1>{product.name}</h1><div className="detail-prices"><strong>{money(product.price)}</strong>{product.is_promo && product.old_price && <del>{money(product.old_price)}</del>}</div><h2>Опис</h2><p className="detail-description">{product.description || 'Зв’яжіться з нами, щоб дізнатися більше про цю модель.'}</p><div className="detail-actions"><a className="btn btn-primary" href={`tel:${phone}`}>Зателефонувати · {phoneLabel}</a><a className="btn btn-ghost" href={telegramUrl}>Написати в Telegram</a><a className="btn btn-ghost" href={viberUrl}>Написати у Viber</a></div><p className="detail-delivery">Доставка по Україні · Допоможемо підібрати тканину й розмір</p></article></div></main>
    {lightboxOpen && <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Фотогалерея: ${product.name}`} onClick={() => setLightboxOpen(false)}><button type="button" className="lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Закрити">×</button><p className="lightbox-counter">{product.name} · {imageIndex + 1} / {photos.length}</p>{photos.length > 1 && <button type="button" className="lightbox-nav lightbox-prev" onClick={event => { event.stopPropagation(); previousPhoto() }} aria-label="Попереднє фото">‹</button>}<div className="lightbox-stage" onClick={event => event.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}><img className="lightbox-img" src={photos[imageIndex]} alt={`${product.name} — фото ${imageIndex + 1}`}/></div>{photos.length > 1 && <button type="button" className="lightbox-nav lightbox-next" onClick={event => { event.stopPropagation(); nextPhoto() }} aria-label="Наступне фото">›</button>}</div>}
  </div>
}

function Storefront() {
  const initialQuery = new URLSearchParams(window.location.search)
  const initialPage = Number(initialQuery.get('page'))
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState(initialQuery.get('category') || 'all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'price-desc'>(initialQuery.get('sort') === 'price-desc' ? 'price-desc' : 'newest')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1)
  const [loadError, setLoadError] = useState('')
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [carouselPaused, setCarouselPaused] = useState(false)
  const [footerTaps, setFooterTaps] = useState(0)
  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([rows, categoryRows]) => { setProducts(rows); setCategories(categoryRows) })
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setCatalogLoaded(true))
  }, [])
  useEffect(() => {
    const url = new URL(window.location.href)
    if (selectedCategory === 'all') url.searchParams.delete('category')
    else url.searchParams.set('category', selectedCategory)
    if (sortOrder === 'newest') url.searchParams.delete('sort')
    else url.searchParams.set('sort', sortOrder)
    if (page <= 1) url.searchParams.delete('page')
    else url.searchParams.set('page', String(page))
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [selectedCategory, sortOrder, page])
  useEffect(() => {
    if (!catalogLoaded) return
    const savedPosition = sessionStorage.getItem('catalog-return-scroll')
    if (savedPosition === null) return
    sessionStorage.removeItem('catalog-return-scroll')
    requestAnimationFrame(() => window.scrollTo({ top: Number(savedPosition) || 0, behavior: 'auto' }))
  }, [catalogLoaded])
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
  useEffect(() => {
    if (catalogLoaded && page > pageCount) setPage(pageCount)
  }, [catalogLoaded, page, pageCount])
  const goToPage = (nextPage: number) => {
    setPage(nextPage)
    requestAnimationFrame(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
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
  return <div className="landing" id="top"><header className="site-header"><div className="container header-inner"><a href="#top" className="logo"><span className="logo-mark">Диван</span><span className="logo-sub">від виробника</span></a><nav className="main-nav"><a href="#catalog">Каталог</a><a href="#about">Про нас</a></nav><HeaderContacts/><a className="header-cta" href={`tel:${phone}`}>Зателефонувати</a></div></header>
    <main><section className="hero"><div className="container hero-grid"><div className="hero-copy"><span className="eyebrow">Меблі для вашого простору</span><h1 className="hero-title">Затишок, який створений для вас</h1><p className="hero-lead">Виготовляємо стильні дивани та меблі від виробника. Підберемо розмір, тканину й колір під ваш простір.</p><div className="hero-actions"><a className="btn btn-primary" href="#catalog">Переглянути каталог</a><a className="btn btn-ghost" href={`tel:${phone}`}>{phoneLabel}</a></div><div className="hero-note">Доставка по всій Україні · Власне виробництво</div></div><div className="hero-gallery"><div className="gallery hero-carousel" onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)}><img key={currentSlide.src} className="gallery-main hero-slide-image" src={currentSlide.src} alt={currentSlide.label}/><span className="hero-photo-label">{currentSlide.label}</span>{slides.length > 1 && <><button type="button" className="carousel-arrow carousel-prev" aria-label="Попереднє фото" onClick={() => setSlideIndex(i => (i - 1 + slides.length) % slides.length)}>‹</button><button type="button" className="carousel-arrow carousel-next" aria-label="Наступне фото" onClick={() => setSlideIndex(i => (i + 1) % slides.length)}>›</button><div className="carousel-dots">{slides.map((slide, i) => <button key={`${slide.src}-${i}`} type="button" className={i === slideIndex ? 'active' : ''} aria-label={`Показати ${slide.label}`} onClick={() => setSlideIndex(i)}/>)}</div></>}</div></div></div></section>
      <section className="section catalog-section"><div className="container"><div className="section-head" id="catalog"><span className="eyebrow">Знайдіть свій</span><h2>Каталог диванів</h2><p>Перегляньте моделі та зателефонуйте, щоб уточнити розміри й варіанти тканин.</p></div>
        {loadError && <p className="catalog-message">Не вдалося завантажити каталог із бази. {loadError}</p>}
        {!loadError && <><div className="catalog-toolbar"><div className="category-filters" role="group" aria-label="Фільтр за категорією"><button type="button" className={selectedCategory === 'all' ? 'active' : ''} onClick={() => { setSelectedCategory('all'); setPage(1) }}>Усі товари</button>{categories.map(category => <button type="button" key={category.id} className={selectedCategory === category.id ? 'active' : ''} onClick={() => { setSelectedCategory(category.id); setPage(1) }}>{category.name}</button>)}</div><div className="catalog-sort"><span>Сортування</span><div className="sort-dropdown" ref={sortMenuRef}><button type="button" className="sort-trigger" aria-haspopup="menu" aria-expanded={sortMenuOpen} onClick={() => setSortMenuOpen(open => !open)}><span>{sortOrder === 'newest' ? 'Спочатку нові' : 'Ціна: від високої до низької'}</span><svg className={sortMenuOpen ? 'open' : ''} viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5"/></svg></button>{sortMenuOpen && <div className="sort-menu" role="menu"><button type="button" role="menuitemradio" aria-checked={sortOrder === 'newest'} onClick={() => { setSortOrder('newest'); setPage(1); setSortMenuOpen(false) }}>Спочатку нові</button><button type="button" role="menuitemradio" aria-checked={sortOrder === 'price-desc'} onClick={() => { setSortOrder('price-desc'); setPage(1); setSortMenuOpen(false) }}>Ціна: від високої до низької</button></div>}</div></div></div>
          {visibleProducts.length ? <><p className="catalog-count">Товарів: {filteredProducts.length}</p><div className="product-grid">{visibleProducts.map(product => <ProductCard key={product.id} product={product} categoryName={categories.find(category => category.id === product.category_id)?.name} category={selectedCategory} sort={sortOrder} page={page}/>)}</div>{pageCount > 1 && <nav className="pagination" aria-label="Сторінки каталогу"><button type="button" disabled={page === 1} onClick={() => goToPage(page - 1)}>← Попередня</button><span>Сторінка {page} з {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => goToPage(page + 1)}>Наступна →</button></nav>}</> : <p className="catalog-message">У цій категорії товарів поки немає.</p>}</>}
      </div></section>
      <section className="section section-alt"><div className="container"><div className="highlight-card" id="about"><div><div className="highlight-icon" aria-hidden>🛠</div><span className="eyebrow">Напряму від виробника</span><h3>Продумано для щоденного комфорту</h3><p>Виготовляємо меблі з увагою до деталей. Допоможемо обрати матеріали та конфігурацію, а готове замовлення доставимо по Україні.</p></div><div className="features-grid">{features.map(text => <article className="feature-card" key={text}><span aria-hidden>✓</span><p>{text}</p></article>)}</div></div></div></section>
      <section className="contact-band"><div className="container contact-inner"><div><span className="eyebrow">Є питання?</span><h2>Допоможемо обрати ваш диван</h2></div><a className="btn btn-primary" href={`tel:${phone}`}>Зателефонувати · {phoneLabel}</a></div></section>
    </main><footer className="site-footer"><div className="container footer-inner"><button type="button" className="footer-secret-trigger" aria-label="Меблі від виробника · доставка по Україні" onClick={() => setFooterTaps(count => Math.min(count + 1, 10))}>Меблі від виробника · доставка по Україні</button>{footerTaps >= 10 && <a className="footer-manager-link" href="/admin">Вхід менеджера ↗</a>}</div></footer></div>
}

function App() {
  const [pathname, setPathname] = useState(window.location.pathname)
  useEffect(() => { const update = () => setPathname(window.location.pathname); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update) }, [])
  if (pathname === '/admin') return <Admin/>
  const productRoute = pathname.match(/^\/product\/([^/]+)\/?$/)
  if (productRoute) return <ProductDetail productId={decodeURIComponent(productRoute[1])}/>
  return <Storefront/>
}

export default App
