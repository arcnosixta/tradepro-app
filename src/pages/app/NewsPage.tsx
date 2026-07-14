import { useState } from 'react'
import { motion } from 'motion/react'
import { useNews } from '../../hooks/useFirestore'
import { SkeletonNews } from '../../components/ui/Skeleton'
import './pages.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const cats = ['Все', 'Валюты', 'Криптовалюта', 'Акции', 'Макроэкономика', 'Сырьё']

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }

const IMPACT_STYLES: Record<string, { label: string; bg: string; color: string; pulse?: boolean }> = {
  high:   { label: 'HIGH', bg: 'rgba(239,68,68,0.15)', color: '#ef4444', pulse: true },
  medium: { label: 'MED',  bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  low:    { label: 'LOW',  bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' },
}

function timeSince(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  return `${Math.floor(diff / 86400)} дн назад`
}

function isRecent(dateStr: string): boolean {
  const d = new Date(dateStr)
  return Date.now() - d.getTime() < 3600 * 1000
}

export default function NewsPage() {
  const { news, loading, refresh, lastRefresh } = useNews()
  const [cat, setCat] = useState('Все')
  const [xauOnly, setXauOnly] = useState(true)
  const filtered = news
    .filter(n => xauOnly ? n.impact !== 'low' : true)
    .filter(n => cat === 'Все' ? true : n.category === cat)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 className="pg-title">Новости рынка</h1>
          <p className="pg-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Обновлено {timeSince(lastRefresh)}
            <motion.span
              style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </p>
        </div>
        <motion.button className="btn-outline" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={refresh} style={{ flexShrink: 0 }}>
          🔄 Обновить
        </motion.button>
      </div>

      <div className="filters">
        <motion.button
          className={`filter-btn ${xauOnly ? 'filter-active' : ''}`}
          onClick={() => setXauOnly(v => !v)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={xauOnly ? { background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' } : undefined}
        >
          {xauOnly ? '✕ XAU/USD' : '◉ XAU/USD'}
        </motion.button>
        {cats.map(c => (
          <motion.button key={c} className={`filter-btn ${cat === c ? 'filter-active' : ''}`} onClick={() => setCat(c)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            {c}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div>
          <SkeletonNews />
          <div className="news-grid" style={{ marginTop: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonNews key={i} />)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ padding: 'var(--sp-10) 0' }}>
          {xauOnly ? 'Нет новостей, влияющих на XAU/USD. Попробуйте выключить фильтр.' : 'Нет новостей в этой категории.'}
        </div>
      ) : (
        <>
          {filtered.length > 0 && (
            <motion.div
              className="news-feat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.005 }}
              transition={{ duration: 0.5, ease }}
            >
              <img src={filtered[0].image} alt="" className="nf-img" />
              <div className="nf-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="tag-sm">{filtered[0].category}</span>
                  <span className="impact-badge" style={{ background: IMPACT_STYLES[filtered[0].impact].bg, color: IMPACT_STYLES[filtered[0].impact].color }}>
                    XAU {IMPACT_STYLES[filtered[0].impact].label}
                  </span>
                  {isRecent(filtered[0].date) && (
                    <motion.span
                      className="tag-sm"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      LIVE
                    </motion.span>
                  )}
                </div>
                <h2>{filtered[0].title}</h2>
                <p>{filtered[0].summary}</p>
                <span className="muted">{filtered[0].source} · {new Date(filtered[0].date).toLocaleDateString('ru')}</span>
              </div>
            </motion.div>
          )}
          <motion.div className="news-grid" variants={stagger} initial="hidden" animate="show">
            {filtered.slice(1).map(n => (
              <motion.div key={n.id} className="news-card" variants={fadeUp} whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <div className="nc-img-wrap">
                  <img src={n.image} alt="" className="nc-img" loading="lazy" />
                  <div className="nc-overlay" />
                  {isRecent(n.date) && (
                    <motion.span
                      style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, zIndex: 1 }}
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      LIVE
                    </motion.span>
                  )}
                </div>
                <div className="nc-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className="tag-sm">{n.category}</span>
                    <span className="impact-badge" style={{ background: IMPACT_STYLES[n.impact].bg, color: IMPACT_STYLES[n.impact].color }}>
                      XAU {IMPACT_STYLES[n.impact].label}
                    </span>
                  </div>
                  <h3>{n.title}</h3>
                  <p>{n.summary}</p>
                  <span className="muted" style={{ fontSize: '0.75rem' }}>{n.source} · {new Date(n.date).toLocaleDateString('ru')}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
