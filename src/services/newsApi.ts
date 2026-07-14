function categorizeByPath(url: string): string {
  const u = url.toLowerCase()
  if (/\/news\/forex-news\//.test(u)) return 'Валюты'
  if (/\/news\/cryptocurrency-news\//.test(u)) return 'Криптовалюта'
  if (/\/news\/stock-market-news\/|\/news\/analyst-ratings\/|\/news\/company-news\//.test(u)) return 'Акции'
  if (/\/news\/commodities-news\//.test(u)) return 'Сырьё'
  if (/\/news\/economy-news\/|\/news\/economic-indicators\//.test(u)) return 'Макроэкономика'
  return 'Макроэкономика'
}

function categorizeByTitle(title: string): string {
  const t = title.toLowerCase()
  if (/bitcoin|btc|ethereum|eth|crypto|token|blockchain|defi|nft|solana|altcoin|криптовалют|биткоин|эфириум/.test(t)) return 'Криптовалюта'
  if (/forex|eur\/usd|gbp\/usd|usd\/jpy|currency|fx|dollar|валют|евро|доллар|йена/.test(t)) return 'Валюты'
  if (/gold|oil|crude|copper|silver|gas|wheat|commodit|сырь|золото|нефть|серебро/.test(t)) return 'Сырьё'
  if (/stock|share|equity|s&p|nasdaq|dow|earnings|акци|бирж|индекс/.test(t)) return 'Акции'
  if (/fed|rate|inflation|gdp|unemployment|monetary|economy|budget|central bank|цб|инфляц|ставк|ввп/.test(t)) return 'Макроэкономика'
  return 'Макроэкономика'
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function scoreImpactXau(title: string, category: string): 'high' | 'medium' | 'low' {
  const t = title.toLowerCase()

  if (
    /фрс|федере|ставк|процентн|инфляц|цб|central bank|fed\b|rate hike|rate cut|interest rate|монетарн/.test(t) ||
    /доллар|dollar|dxy|usd index|курс долл/.test(t) ||
    /геополитик|войн|конфликт|санкц|embargo|tensions|war|conflict|strike|missile|iran|хормуз/.test(t) ||
    /золото|gold|xau|bullion|central bank gold|закупк.*золот/.test(t) ||
    /recession|рецесси|crash|krach|паник|panic|flight to safety|убежищ/.test(t) ||
    /bond yield|доходн.*облигац|treasury|10-year|30-year|трежерис/.test(t) ||
    /cpi|ppi|индекс потреб|потребит.* цен|inflation data/.test(t)
  ) return 'high'

  if (
    /ввп|gdp|безработиц|employment|unemployment|non-farm|payroll|trade deficit|торгов.* баланс/.test(t) ||
    /нефть|oil|crude|brent|wti|opec/.test(t) ||
    /серебро|silver|xag/.test(t) ||
    /vix|волатильн|波动/.test(t) ||
    /акци|stock|s&p|nasdaq|dow|индекс.*акц/.test(t) ||
    /евро|eur|gbp|jpy|yen|валют.* пар/.test(t)
  ) return 'medium'

  return 'low'
}

const NEWS_SOURCES = [
  { url: 'https://ru.investing.com/rss/news.rss', name: 'Investing.com' },
  { url: 'https://ru.investing.com/rss/news_301.rss', name: 'Investing.com Crypto' },
  { url: 'https://ru.investing.com/rss/news_95.rss', name: 'Investing.com Economy' },
]

const PLACEHOLDER_IMAGES: Record<string, string> = {
  'Валюты': 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&q=80',
  'Криптовалюта': 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&q=80',
  'Акции': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  'Макроэкономика': 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&q=80',
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
  impact: 'high' | 'medium' | 'low'
}

async function fetchRssText(url: string): Promise<string> {
  try {
    const resp = await fetch(url)
    if (resp.ok) return await resp.text()
  } catch {}
  const resp = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
  return await resp.text()
}

async function parseRssFeed(url: string, sourceName: string): Promise<LiveNewsItem[]> {
  const text = await fetchRssText(url)
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')

  if (doc.querySelector('parsererror')) return []

  const items = doc.querySelectorAll('item')
  return Array.from(items).slice(0, 20).map(item => {
    const title = item.querySelector('title')?.textContent || ''
    const link = item.querySelector('link')?.textContent || ''
    const desc = item.querySelector('description')?.textContent || ''
    const pubDate = item.querySelector('pubDate')?.textContent || ''
    const author = item.querySelector('author')?.textContent || sourceName

    const enclosure = item.querySelector('enclosure')
    const imageFromFeed = enclosure?.getAttribute('url') || ''

    const category = link ? categorizeByPath(link) : categorizeByTitle(title)
    const image = imageFromFeed || PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES['Макроэкономика']
    const impact = scoreImpactXau(title, category)

    return {
      id: `live-${sourceName}-${link || Math.random().toString(36).slice(2)}`,
      title,
      summary: stripHtml(desc).slice(0, 200) || title,
      image,
      category,
      date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      source: author,
      url: link,
      impact,
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
