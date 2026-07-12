import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCourses, useUserProgress, useTrades, useNews } from '../../hooks/useFirestore'
import Skeleton, { SkeletonStat } from '../../components/ui/Skeleton'
import ProgressRing from '../../components/ui/ProgressRing'
import useCountUp from '../../hooks/useCountUp'
import './pages.css'

const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } } }

function DashboardSkeleton() {
  return (
    <div className="pg">
      <div><Skeleton variant="text" width="55%" height={28} /><Skeleton variant="text" width="40%" height={14} /></div>
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
      <div className="grid-2">
        <Skeleton variant="rect" width="100%" height={280} />
        <Skeleton variant="rect" width="100%" height={280} />
        <Skeleton variant="rect" width="100%" height={200} className="card-wide" />
        <Skeleton variant="rect" width="100%" height={220} />
      </div>
    </div>
  )
}

function AnimatedStatValue({ value, prefix = '' }: { value: string; prefix?: string }) {
  const numMatch = value.match(/[\d,]+/)
  const num = numMatch ? parseInt(numMatch[0].replace(/,/g, '')) : 0
  const animated = useCountUp(num)
  if (!numMatch) return <span className="stat-value">{prefix}{value}</span>
  const display = value.replace(numMatch[0], animated.toLocaleString())
  return <span className="stat-value counter-value">{prefix}{display}</span>
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { courses, loading: coursesLoading } = useCourses()
  const { progress } = useUserProgress(profile?.uid)
  const { trades, loading: tradesLoading } = useTrades(profile?.uid)
  const { news, loading: newsLoading } = useNews()

  if (coursesLoading || tradesLoading) return <DashboardSkeleton />

  const closed = trades.filter(t => t.status === 'closed')
  const open = trades.filter(t => t.status === 'open')
  const wins = closed.filter(t => t.pnl > 0).length
  const wr = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0

  let totalL = 0, doneL = 0
  courses.forEach(c => c.modules.forEach(m => {
    totalL += m.lessons.length
    doneL += m.lessons.filter(l => (progress[c.id] || []).includes(l.id)).length
  }))
  const cp = totalL > 0 ? Math.round((doneL / totalL) * 100) : 0

  const stats = [
    { label: 'Баланс', value: '24,850', ch: '+12.4%', pos: true, icon: '💰', prefix: '$' },
    { label: 'Сделки', value: String(trades.length), ch: `${closed.length} закрытых`, pos: true, icon: '📈', prefix: '' },
    { label: 'Винрейт', value: `${wr}`, ch: `${wins}/${closed.length}`, pos: wr >= 50, icon: '🎯', prefix: '' },
    { label: 'На курсах', value: `${cp}`, ch: `${doneL}/${totalL} уроков`, pos: true, icon: '📚', prefix: '' },
  ]

  return (
      <motion.div className="pg" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <h1 className="pg-title">Привет, {profile?.name || 'Трейдер'} 👋</h1>
        <p className="pg-sub">Вот обзор твоего прогресса на сегодня</p>
      </motion.div>

      <motion.div className="stats-grid" variants={stagger}>
        {stats.map((s) => (
          <motion.div key={s.label} className="stat-card" variants={fadeUp} whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <AnimatedStatValue value={s.value} prefix={s.prefix} />
              <div className={`stat-ch ${s.pos ? 'pos' : 'neg'}`}>{s.ch}</div>
            </div>
            <div className="stat-glow" />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid-2">
        <motion.div className="card" variants={fadeUp}>
          <div className="card-head"><h2>Прогресс курсов</h2><Link to="/app/courses" className="link">Все →</Link></div>
          <div className="overall-progress" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <div className="progress-ring-wrap" style={{ marginBottom: 16 }}>
              <ProgressRing pct={cp} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{doneL} из {totalL} уроков</div>
                <div className="muted" style={{ fontSize: '0.85rem' }}>{cp === 100 ? 'Все курсы пройдены!' : cp > 0 ? 'Продолжай в том же духе' : 'Начни первый курс'}</div>
              </div>
            </div>
            <div className="op-grid">
              {courses.map(c => {
                const tot = c.modules.reduce((a, m) => a + m.lessons.length, 0)
                const dn = c.modules.reduce((a, m) => a + m.lessons.filter(l => (progress[c.id] || []).includes(l.id)).length, 0)
                const pct = tot > 0 ? Math.round((dn / tot) * 100) : 0
                return (
                  <motion.div key={c.id} className="op-item" whileHover={{ scale: 1.02 }}>
                    <ProgressRing pct={pct} size={48} />
                    <div className="op-info">
                      <div className="op-title">{c.title}</div>
                      <div className="op-meta">{dn}/{tot} уроков · {pct}%</div>
                      <div className="bar-wrap" style={{ marginTop: 6 }}><motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.5 }} /></div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        <motion.div className="card" variants={fadeUp}>
          <div className="card-head"><h2>Открытые сделки</h2><Link to="/app/journal" className="link">Все →</Link></div>
          {open.length === 0 ? <p className="empty">Нет открытых сделок</p> : (
            <div className="list">
              {open.map((t, i) => (
                <motion.div key={t.id} className="row" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ x: 4 }}>
                  <div className="pair"><span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span>{t.symbol}</div>
                  <div className={t.pnl >= 0 ? 'pos' : 'neg'} style={{ fontWeight: 700 }}>{t.pnl >= 0 ? '+' : ''}${Math.abs(t.pnl)}</div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div className="card card-wide" variants={fadeUp}>
          <div className="card-head"><h2>Последние сделки</h2><Link to="/app/journal" className="link">Дневник →</Link></div>
          <div className="tbl">
            <div className="tbl-h"><span>Пара</span><span>Тип</span><span>PnL</span><span>Дата</span></div>
            {closed.length === 0 ? <p className="empty">Нет закрытых сделок</p> : closed.slice(0, 4).map((t, i) => (
              <motion.div key={t.id} className="tbl-r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}>
                <span className="pair">{t.symbol}</span>
                <span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span>
                <span className={t.pnl > 0 ? 'pos' : 'neg'} style={{ fontWeight: 700 }}>{t.pnl > 0 ? '+' : ''}${t.pnl}</span>
                <span className="muted">{t.closedAt ? new Date(t.closedAt).toLocaleDateString('ru') : '—'}</span>
              </motion.div>
            ))}
          </div>
          <div className="trade-cards">
            {closed.length === 0 ? <p className="empty">Нет закрытых сделок</p> : closed.slice(0, 4).map((t, i) => (
              <motion.div key={t.id} className="trade-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                <div className="trade-card-header">
                  <div className="trade-card-pair"><span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span>{t.symbol}</div>
                  <div className={`trade-card-pnl ${t.pnl > 0 ? 'pos' : 'neg'}`}>{t.pnl > 0 ? '+' : ''}${t.pnl}</div>
                </div>
                <div className="trade-card-details">
                  <div className="trade-card-detail"><span className="trade-card-detail-label">Дата</span><span className="trade-card-detail-value">{t.closedAt ? new Date(t.closedAt).toLocaleDateString('ru') : '—'}</span></div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="card" variants={fadeUp}>
          <div className="card-head"><h2>Новости</h2><Link to="/app/news" className="link">Все →</Link></div>
          {newsLoading ? <Skeleton count={4} variant="row" /> : (
            <div className="list">
              {news.slice(0, 4).map((n, i) => (
                <motion.div key={n.id} className="row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} whileHover={{ x: 4 }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div><div className="muted" style={{ fontSize: '0.8rem' }}>{n.category}</div></div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
