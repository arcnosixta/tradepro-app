function categorize(title: string): string {
  const t = title.toLowerCase()
  if (/bitcoin|btc|ethereum|eth|crypto|token|blockchain|defi|nft|solana|altcoin|коин|крипт/.test(t)) return 'Криптовалюта'
  if (/фрс|ставка|инфляц|процент|цб|ввп|безработиц|монетарн|экономик|золото|доллар|рубл|тенге|бюджет/.test(t)) return 'Макроэкономика'
  if (/sec|регул|закон|запрет|лиценз|налог|aml|kyc|комиссия|правил/.test(t)) return 'Регуляторика'
  if (/нефть|золот|сырь|металл|газ|пшениц|серебр|copper|crude|oil|gold/.test(t)) return 'Сырьё'
  return 'Криптовалюта'
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const NEWS_SOURCES = [
  { url: 'https://news.google.com/rss/search?q=crypto+bitcoin+market&hl=ru&gl=RU&ceid=RU:ru', name: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=bitcoin+trading+price&hl=en&gl=US&ceid=US:en', name: 'CoinDesk' },
  { url: 'https://news.google.com/rss/search?q=crypto+regulation+SEC&hl=en&gl=US&ceid=US:en', name: 'Crypto News' },
]

const PLACEHOLDER_IMAGES: Record<string, string> = {
  'Криптовалюта': 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&q=80',
  'Макроэкономика': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  'Регуляторика': 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80',
  'Сырьё': 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&q=80',
}

export interface LiveNewsItem {
  id: string
  title: string
  summary: string
  image: string
  category: string
  date: string
  source: string
  url: string
}

async function parseRssFeed(url: string, sourceName: string): Promise<LiveNewsItem[]> {
  const resp = await fetch(url, { mode: 'cors' })
  const text = await resp.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) return []

  const items = doc.querySelectorAll('item')
  return Array.from(items).slice(0, 15).map(item => {
    const title = item.querySelector('title')?.textContent || ''
    const link = item.querySelector('link')?.textContent || ''
    const desc = item.querySelector('description')?.textContent || ''
    const pubDate = item.querySelector('pubDate')?.textContent || ''
    const creator = item.querySelector('dc\\:creator, creator')?.textContent || sourceName
    const category = categorize(title)

    return {
      id: `live-${sourceName}-${link || Math.random().toString(36).slice(2)}`,
      title,
      summary: stripHtml(desc).slice(0, 200),
      image: PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES['Криптовалюта'],
      category,
      date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      source: creator,
      url: link,
    }
  })
}

export async function fetchLiveNews(): Promise<LiveNewsItem[]> {
  const results = await Promise.allSettled(
    NEWS_SOURCES.map(src => parseRssFeed(src.url, src.name))
  )

  const allItems: LiveNewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') allItems.push(...r.value)
  }

  allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const seen = new Set<string>()
  return allItems.filter(item => {
    const key = item.title.toLowerCase().slice(0, 60)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchTrendingCoins(): Promise<{ name: string; symbol: string; price: number; change24h: number }[]> {
  try {
    const resp = await fetch('https://api.coingecko.com/api/v3/search/trending')
    const data = await resp.json()
    const coinIds = (data.coins || []).slice(0, 7).map((c: any) => c.item.id)
    if (coinIds.length === 0) return []

    const priceResp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`)
    const prices = await priceResp.json()

    return (data.coins || []).slice(0, 7).map((c: any) => ({
      name: c.item.name,
      symbol: c.item.symbol.toUpperCase(),
      price: prices[c.item.id]?.usd || 0,
      change24h: prices[c.item.id]?.usd_24h_change || 0,
    }))
  } catch {
    return []
  }
}
