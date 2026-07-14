import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCourses, useUserProgress, useTrades } from '../../hooks/useFirestore'
import Skeleton, { SkeletonStat } from '../../components/ui/Skeleton'
import ProgressRing from '../../components/ui/ProgressRing'
import useCountUp from '../../hooks/useCountUp'
import { getEventsForMonth, getEventsForDate, type EconEvent } from '../../data/econCalendar'
import { CloseIcon } from '../../components/ui/Icons'
import './pages.css'

const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } } }

const MONTHS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

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

const statIcons = [
  (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
    </svg>
  ),
  (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
]

function EconCalendar() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7

  const events = useMemo(() => getEventsForMonth(year, month), [year, month])

  const eventsByDay = useMemo(() => {
    const map: Record<string, EconEvent[]> = {}
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [events])

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    return getEventsForDate(selectedDate)
  }, [selectedDate])

  const goToPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else { setMonth(m => m - 1) }
    setSelectedDate(null)
  }
  const goToNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else { setMonth(m => m + 1) }
    setSelectedDate(null)
  }

  const cells: (string | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(String(d).padStart(2, '0'))

  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return '#ef4444'
    if (impact === 'medium') return '#f59e0b'
    return '#22c55e'
  }

  return (
    <motion.div className="econ-calendar" variants={fadeUp}>
      <div className="econ-cal-header">
        <h2>Экономический календарь</h2>
        <span className="econ-cal-pair">XAU/USD</span>
      </div>

      <div className="econ-cal-nav">
        <motion.button className="cal-nav" whileTap={{ scale: 0.9 }} onClick={goToPrev}>‹</motion.button>
        <span className="cal-title">{MONTHS_RU[month]} {year}</span>
        <motion.button className="cal-nav" whileTap={{ scale: 0.9 }} onClick={goToNext}>›</motion.button>
      </div>

      <div className="econ-cal-weekdays">
        {WEEKDAYS_RU.map(w => <span key={w} className="cal-wd">{w}</span>)}
      </div>

      <div className="econ-cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="econ-cal-cell econ-cal-empty" />
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${d}`
          const dayEvents = eventsByDay[key] || []
          const isToday = key === today
          const isSelected = key === selectedDate
          const hasHigh = dayEvents.some(e => e.impact === 'high')
          const hasMed = dayEvents.some(e => e.impact === 'medium')

          return (
            <motion.button
              key={key}
              className={`econ-cal-cell ${isToday ? 'econ-today' : ''} ${isSelected ? 'econ-selected' : ''} ${dayEvents.length > 0 ? 'econ-has-events' : ''}`}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelectedDate(isSelected ? null : key)}
            >
              <span className="econ-day-num">{parseInt(d)}</span>
              {dayEvents.length > 0 && (
                <div className="econ-dots">
                  {hasHigh && <span className="econ-dot" style={{ background: '#ef4444' }} />}
                  {hasMed && <span className="econ-dot" style={{ background: '#f59e0b' }} />}
                  {!hasHigh && !hasMed && dayEvents.length > 0 && <span className="econ-dot" style={{ background: '#22c55e' }} />}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedDate && selectedEvents.length > 0 && (
          <motion.div
            className="econ-events-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
          >
            <div className="econ-events-head">
              <span className="econ-events-date">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
              </span>
              <motion.button className="econ-events-close" whileTap={{ scale: 0.9 }} onClick={() => setSelectedDate(null)}>
                <CloseIcon size={14} />
              </motion.button>
            </div>
            <div className="econ-events-list">
              {selectedEvents.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  className="econ-event-item"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <div className="econ-event-time">{ev.time}</div>
                  <div className="econ-event-impact" style={{ background: getImpactColor(ev.impact) }} />
                  <div className="econ-event-info">
                    <div className="econ-event-title">{ev.title}</div>
                    <div className="econ-event-vals">
                      <span className="econ-val">Прогноз: <b>{ev.forecast}</b></span>
                      <span className="econ-val">Пред: <b>{ev.previous}</b></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedDate && selectedEvents.length === 0 && (
        <motion.div
          className="econ-no-events"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Нет событий на эту дату
        </motion.div>
      )}
    </motion.div>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { courses, loading: coursesLoading } = useCourses()
  const { progress } = useUserProgress(profile?.uid)
  const { trades, loading: tradesLoading } = useTrades(profile?.uid)

  if (coursesLoading || tradesLoading) return <DashboardSkeleton />

  const closed = trades.filter(t => t.status === 'closed')
  const wins = closed.filter(t => t.pnl > 0).length
  const wr = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0

  let totalL = 0, doneL = 0
  courses.forEach(c => c.modules.forEach(m => {
    totalL += m.lessons.length
    doneL += m.lessons.filter(l => (progress[c.id] || []).includes(l.id)).length
  }))
  const cp = totalL > 0 ? Math.round((doneL / totalL) * 100) : 0

  const stats = [
    { label: 'Баланс', value: '24,850', ch: '+12.4%', pos: true, prefix: '$', color: '#22c55e' },
    { label: 'Сделки', value: String(closed.length), ch: `${closed.length} закрытых`, pos: true, prefix: '', color: '#06b6d4' },
    { label: 'Винрейт', value: `${wr}`, ch: `${wins}/${closed.length}`, pos: wr >= 50, prefix: '', color: '#a855f7' },
    { label: 'На курсах', value: `${cp}`, ch: `${doneL}/${totalL} уроков`, pos: true, prefix: '', color: '#f59e0b' },
  ]

  return (
    <div className="dashboard-page">
      <div className="dashboard-bg" />

      <motion.div className="pg" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <h1 className="pg-title">Привет, {profile?.name || 'Трейдер'} 👋</h1>
          <p className="pg-sub">Вот обзор твоего прогресса на сегодня</p>
        </motion.div>

        <motion.div className="stats-grid" variants={stagger}>
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="stat-card"
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="stat-icon" style={{ background: `${s.color}18` }}>
                {statIcons[i](s.color)}
              </div>
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
                {courses.map((c, ci) => {
                  const tot = c.modules.reduce((a, m) => a + m.lessons.length, 0)
                  const dn = c.modules.reduce((a, m) => a + m.lessons.filter(l => (progress[c.id] || []).includes(l.id)).length, 0)
                  const pct = tot > 0 ? Math.round((dn / tot) * 100) : 0
                  return (
                    <motion.div
                      key={c.id}
                      className="op-item"
                      whileHover={{ scale: 1.03, x: 4 }}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + ci * 0.1, duration: 0.4 }}
                    >
                      <ProgressRing pct={pct} size={48} />
                      <div className="op-info">
                        <div className="op-title">{c.title}</div>
                        <div className="op-meta">{dn}/{tot} уроков · {pct}%</div>
                        <div className="bar-wrap" style={{ marginTop: 6 }}><motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, delay: 0.5 + ci * 0.15, ease: easeOut }} /></div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          <EconCalendar />

          <motion.div className="card card-wide" variants={fadeUp}>
            <div className="card-head"><h2>Последние сделки</h2><Link to="/app/journal" className="link">Дневник →</Link></div>
            <div className="tbl">
              <div className="tbl-h"><span>Пара</span><span>Тип</span><span>PnL</span><span>Дата</span></div>
              {closed.length === 0 ? <p className="empty">Нет закрытых сделок</p> : closed.slice(0, 5).map((t, i) => (
                <motion.div
                  key={t.id}
                  className="tbl-r"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                  whileHover={{ x: 4, boxShadow: '0 0 12px var(--accent-glow)' }}
                >
                  <span className="pair">{t.symbol}</span>
                  <span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span>
                  <span className={t.pnl > 0 ? 'pos' : 'neg'} style={{ fontWeight: 700 }}>{t.pnl > 0 ? '+' : ''}${t.pnl}</span>
                  <span className="muted">{new Date(t.closedAt || t.openedAt).toLocaleDateString('ru')}</span>
                </motion.div>
              ))}
            </div>
            <div className="trade-cards">
              {closed.length === 0 ? <p className="empty">Нет закрытых сделок</p> : closed.slice(0, 4).map((t, i) => (
                <motion.div
                  key={t.id}
                  className="trade-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="trade-card-header">
                    <div className="trade-card-pair"><span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span>{t.symbol}</div>
                    <div className={`trade-card-pnl ${t.pnl > 0 ? 'pos' : 'neg'}`}>{t.pnl > 0 ? '+' : ''}${t.pnl}</div>
                  </div>
                  <div className="trade-card-details">
                    <div className="trade-card-detail"><span className="trade-card-detail-label">Дата</span><span className="trade-card-detail-value">{new Date(t.closedAt || t.openedAt).toLocaleDateString('ru')}</span></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>


        </div>
      </motion.div>
    </div>
  )
}
