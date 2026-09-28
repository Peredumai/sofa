import { useCallback, useEffect, useState } from 'react'
import './App.css'

/** Додайте файли sofa-1.jpg, sofa-2.jpg … у public/images/ */
const GALLERY_IMAGES = [
  '/images/sofa-1.jpg',
  '/images/sofa-2.jpg',
  '/images/sofa-3.jpg',
  '/images/sofa-4.jpg',
  '/images/sofa-5.jpg',
] as const

const PLACEHOLDER = '/images/placeholder.svg'

const FEATURES = [
  'Меблі від виробника',
  'Виготовлення за індивідуальними розмірами',
  'Будь-який колір металу та тканини на вибір',
  'Надійне порошкове фарбування металу',
  'Знімні подушки для зручного догляду',
  'Можливість створення комплектів: дивани, крісла та столики',
  'Зручне зберігання після сезону завдяки розбірній конструкції',
  'Доставка по всій Україні',
] as const

/** Замініть на ваш номер для кнопки «Зателефонувати» */
const PHONE_DISPLAY = '+38 (099) 103-66-66'
const PHONE_TEL = '+380XXXXXXXXX'

function GalleryImage({
  src,
  alt,
  className = 'gallery-main',
}: {
  src: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="gallery-placeholder" role="img" aria-label={alt}>
        Завантажте фото дивана в <code>public/images/</code>
        <br />
        (sofa-1.jpg, sofa-2.jpg …)
      </div>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  )
}

function Thumb({ src, active, onClick }: { src: string; active: boolean; onClick: () => void }) {
  const [failed, setFailed] = useState(false)

  return (
    <button
      type="button"
      className={`gallery-thumb${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label="Мініатюра"
    >
      <img
        src={failed ? PLACEHOLDER : src}
        alt=""
        onError={() => setFailed(true)}
      />
    </button>
  )
}

function App() {
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  // const [name, setName] = useState('')
  // const [phone, setPhone] = useState('')
  // const [comment, setComment] = useState('')
  // const [sent, setSent] = useState(false)

  const total = GALLERY_IMAGES.length
  const currentSrc = GALLERY_IMAGES[index] ?? PLACEHOLDER

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total)
  }, [total])

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % total)
  }, [total])

  useEffect(() => {
    if (!lightboxOpen) return

    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxOpen, prev, next])

  // function handleSubmit(e: React.FormEvent) {
  //   e.preventDefault()
  //   const body = encodeURIComponent(
  //     `Замовлення диван M31\nІм'я: ${name}\nТелефон: ${phone}\nКоментар: ${comment || '—'}`,
  //   )
  //   window.open(`https://t.me/share/url?url=&text=${body}`, '_blank', 'noopener,noreferrer')
  //   setSent(true)
  // }

  return (
    <div className="landing">
      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="logo">
            <span className="logo-mark">Диван</span>
            <span className="logo-sub">від виробника</span>
          </a>
          <a className="header-cta" href={`tel:${PHONE_TEL.replace(/\s/g, '')}`}>
            Замовити — 6 900 ₴
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="promo-badge">🔥 Акція −19% 🔥</span>
            <h1 className="hero-title">Диван M31</h1>
            <p className="hero-lead">
              <strong>Розбірна конструкція</strong> — значно зменшує вартість доставки по
              Україні та дозволяє легко розібрати меблі для зберігання після сезону.
            </p>
            <div className="price-block">
              <span className="price-current">6 900 ₴</span>
              <span className="price-old">8 500 ₴</span>
              <span className="price-note">Ціна за акцією · економія 1 600 ₴</span>
            </div>
            <div className="hero-actions">
              {/* <a className="btn btn-primary" href="#order">
                Замовити зі знижкою
              </a> */}
              <a className="btn btn-ghost" href={`tel:${PHONE_TEL.replace(/\s/g, '')}`}>
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>

          <div className="hero-gallery">
            <div className="gallery">
              <button
                type="button"
                className="gallery-open"
                onClick={() => setLightboxOpen(true)}
                aria-label="Відкрити фото на весь екран"
              >
                <GalleryImage src={currentSrc} alt={`Диван M31 — фото ${index + 1}`} />
                <span className="gallery-open-hint" aria-hidden>
                  ⛶
                </span>
              </button>
              <div className="gallery-nav">
                <button
                  type="button"
                  className="gallery-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    prev()
                  }}
                  aria-label="Попереднє фото"
                >
                  ‹
                </button>
                <div className="gallery-dots">
                  {GALLERY_IMAGES.map((_, i) => (
                    <button
                      key={GALLERY_IMAGES[i]}
                      type="button"
                      className={`gallery-dot${i === index ? ' active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIndex(i)
                      }}
                      aria-label={`Фото ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="gallery-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    next()
                  }}
                  aria-label="Наступне фото"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="gallery-thumbs">
              {GALLERY_IMAGES.map((src, i) => (
                <Thumb key={src} src={src} active={i === index} onClick={() => setIndex(i)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="highlight-card">
            <div>
              <div className="highlight-icon" aria-hidden>
                🛠
              </div>
              <h3>Розбірна конструкція</h3>
              <p>
                Компактна упаковка при доставці — менша ціна перевезення по всій Україні. Після
                сезону диван збирається і займає мінімум місця на балконі чи в коморі.
              </p>
            </div>
            <div className="features-grid">
              {FEATURES.map((text) => (
                <article key={text} className="feature-card">
                  <span aria-hidden>✓</span>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* <section className="section" id="order">
        <div className="container">
          <div className="section-head">
            <h2>Оформити замовлення</h2>
            <p>Залиште контакти — підберемо тканину, колір металу та розміри під ваш простір.</p>
          </div>
          <div className="order-grid">
            <div className="order-summary">
              <p className="promo-badge" style={{ marginBottom: '1rem' }}>
                🔥 −19%
              </p>
              <h2>Диван M31</h2>
              <p className="price-current">6 900 ₴</p>
              <p className="price-old" style={{ color: 'rgba(255,255,255,0.55)' }}>
                замість 8 500 ₴
              </p>
              <ul>
                <li>Індивідуальні розміри</li>
                <li>Доставка по Україні</li>
                <li>Комплекти з кріслами та столиками</li>
              </ul>
            </div>
            <form className="order-form" onSubmit={handleSubmit}>
              <h3>Зворотний зв&apos;язок</h3>
              <p>Ми передзвонимо протягом робочого дня.</p>
              <div className="field">
                <label htmlFor="name">Ім&apos;я</label>
                <input
                  id="name"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Олена"
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Телефон</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+38 (0__) ___-__-__"
                />
              </div>
              <div className="field">
                <label htmlFor="comment">Коментар (необов&apos;язково)</label>
                <textarea
                  id="comment"
                  name="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Колір тканини, розміри, місто доставки…"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Надіслати заявку
              </button>
              {sent && (
                <p className="form-success">
                  Дякуємо! Відкрито вікно для надсилання заявки — або зателефонуйте:{' '}
                  <a href={`tel:${PHONE_TEL.replace(/\s/g, '')}`}>{PHONE_DISPLAY}</a>
                </p>
              )}
            </form>
          </div>
        </div>
      </section> */}

      <footer className="site-footer">
        <div className="container">
          Диван M31 · меблі від виробника · доставка по Україні
        </div>
      </footer>

      {lightboxOpen && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Перегляд фото"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Закрити"
          >
            ×
          </button>
          <p className="lightbox-counter">
            {index + 1} / {total}
          </p>
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Попереднє фото"
          >
            ‹
          </button>
          <div
            className="lightbox-stage"
            onClick={(e) => e.stopPropagation()}
          >
            <GalleryImage
              src={currentSrc}
              alt={`Диван M31 — фото ${index + 1}`}
              className="lightbox-img"
            />
          </div>
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Наступне фото"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}

export default App
