import { useEffect } from 'react'

type SEOProduct = {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
}

const DEFAULT_DESCRIPTION = 'Northstar — продуманные вещи для современной жизни: техника, книги и товары для дома с быстрой доставкой.'

function absoluteUrl(value: string, siteUrl: string) {
  try {
    return new URL(value, siteUrl).toString()
  } catch {
    return value
  }
}

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  element.content = content
}

export function SEOHead({ products }: { products: SEOProduct[] }) {
  useEffect(() => {
    const siteUrl = (import.meta.env.VITE_SITE_URL ?? window.location.origin).replace(/\/$/, '')
    const canonicalUrl = `${siteUrl}${window.location.pathname === '/' ? '/' : window.location.pathname}`
    const title = 'Northstar — продуманные вещи для современной жизни'

    document.documentElement.lang = 'ru'
    document.title = title
    setMeta('description', DEFAULT_DESCRIPTION)
    setMeta('robots', 'index, follow')
    setMeta('theme-color', '#f7f5f0')
    setMeta('og:title', title, 'property')
    setMeta('og:description', DEFAULT_DESCRIPTION, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('og:url', canonicalUrl, 'property')
    setMeta('og:site_name', 'Northstar', 'property')
    setMeta('og:locale', 'ru_RU', 'property')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title)
    setMeta('twitter:description', DEFAULT_DESCRIPTION)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'Northstar',
          url: siteUrl,
          logo: absoluteUrl('/favicon.svg', siteUrl),
        },
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          name: 'Northstar',
          url: siteUrl,
          inLanguage: 'ru-RU',
          publisher: { '@id': `${siteUrl}/#organization` },
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'ItemList',
          name: 'Каталог Northstar',
          itemListElement: products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Product',
              '@id': `${siteUrl}/#product-${product.id}`,
              name: product.name,
              description: product.description ?? undefined,
              image: product.image_url ? absoluteUrl(product.image_url, siteUrl) : undefined,
              offers: {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
                url: canonicalUrl,
              },
            },
          })),
        },
      ],
    }

    let script = document.head.querySelector<HTMLScriptElement>('script[data-seo-schema]')
    if (!script) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.seoSchema = 'true'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(schema)

    return () => {
      script?.remove()
    }
  }, [products])

  return null
}
