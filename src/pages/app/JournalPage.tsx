import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useTrades } from '../../hooks/useFirestore'
import { useToast } from '../../context/ToastContext'
import { SkeletonTable } from '../../components/ui/Skeleton'
import useCountUp from '../../hooks/useCountUp'
import {
  PlusIcon, CloseIcon, SendIcon, TrashIcon
} from '../../components/ui/Icons'
import './pages.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function StatValue({ label, value, color }: { label: string; value: string; color?: string }) {
  const numMatch = value.match(/-?\d[\d,]*/)
  const animated = useCountUp(numMatch ? parseInt(numMatch[0].replace(/,/g, '')) : 0)
  const display = numMatch ? value.replace(numMatch[0], animated.toLocaleString()) : value
  return (
    <div className="js">
      <div className="js-l">{label}</div>
      <div className="js-v" style={{ color }}>{display}</div>
    </div>
  )
}

function PnLBarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const values = data.map(d => d.value)
  const maxVal = Math.max(...values, 0)
  const minVal = Math.min(...values, 0)
  const range = Math.max(Math.abs(maxVal), Math.abs(minVal), 1)

  const svgW = 600
  const svgH = 220
  const padL = 52
  const padR = 16
  const padT = 16
  const padB = 32
  const chartW = svgW - padL - padR
  const chartH = svgH - padT - padB
  const midY = padT + chartH / 2

  const barW = Math.min(chartW / data.length * 0.6, 40)
  const gap = chartW / data.length

  const gridLines = 5
  const yTicks: { y: number; label: string }[] = []
  for (let i = 0; i <= gridLines; i++) {
    const ratio = i / gridLines
    const y = padT + ratio * chartH
    const val = maxVal - ratio * (maxVal - minVal)
    yTicks.push({ y, label: val >= 0 ? `+${Math.round(val)}` : String(Math.round(val)) })
  }

  return (
    <div className="chart-card">
      <div className="chart-header"><h3>{label}</h3></div>
      <div className="coord-chart">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="coord-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="barRed" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={padL} y1={t.y} x2={svgW - padR} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={padL - 8} y={t.y + 4} textAnchor="end" fill="var(--text-secondary)" fontSize="9" fontWeight="600">{t.label}</text>
            </g>
          ))}

          <line x1={padL} y1={midY} x2={svgW - padR} y2={midY} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

          <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <text x={padL - 8} y={padT - 4} textAnchor="end" fill="var(--text-secondary)" fontSize="8" fontWeight="600">$</text>

          {data.map((d, i) => {
            const x = padL + gap * i + gap / 2
            const barH = Math.abs(d.value) / range * (chartH / 2)
            const isPos = d.value >= 0
            const y = isPos ? midY - barH : midY
            return (
              <g key={i}>
                <motion.rect
                  x={x - barW / 2}
                  y={isPos ? midY : midY}
                  width={barW}
                  height={0}
                  rx={4}
                  fill={isPos ? 'url(#barGreen)' : 'url(#barRed)'}
                  initial={{ y: midY, height: 0 }}
                  animate={{ y, height: Math.max(barH, 2) }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.text
                  x={x}
                  y={isPos ? midY - barH - 6 : midY + barH + 12}
                  textAnchor="middle"
                  fill={isPos ? '#22c55e' : '#ef4444'}
                  fontSize="9"
                  fontWeight="700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.06 + 0.3 }}
                >
                  {isPos ? '+' : ''}{d.value}
                </motion.text>
                <text x={x} y={svgH - 8} textAnchor="middle" fill="var(--text-secondary)" fontSize="8" fontWeight="600">{d.label}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function WinLossDonut({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses
  const winPct = total > 0 ? Math.round((wins / total) * 100) : 0
  const lossPct = total > 0 ? 100 - winPct : 0

  const r = 54
  const stroke = 14
  const circ = 2 * Math.PI * r
  const winLen = circ * (winPct / 100)
  const lossLen = circ * (lossPct / 100)

  return (
    <div className="donut-card">
      <div className="donut-header"><h3>Соотношение</h3></div>
      <div className="donut-wrap">
        <svg viewBox="0 0 140 140" className="donut-svg">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <motion.circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke="#22c55e"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${winLen} ${circ}`}
            transform="rotate(-90 70 70)"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${winLen} ${circ}` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke="#ef4444"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${lossLen} ${circ}`}
            strokeDashoffset={-winLen}
            transform="rotate(-90 70 70)"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${lossLen} ${circ}` }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          <text x="70" y="64" textAnchor="middle" fill="var(--text)" fontSize="20" fontWeight="800">{winPct}%</text>
          <text x="70" y="82" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600">винрейт</text>
        </svg>
      </div>
      <div className="donut-legend">
        <div className="donut-legend-item">
          <span className="donut-legend-dot" style={{ background: '#22c55e' }} />
          <span className="donut-legend-label">Прибыль</span>
          <span className="donut-legend-value pos">{wins}</span>
        </div>
        <div className="donut-legend-item">
          <span className="donut-legend-dot" style={{ background: '#ef4444' }} />
          <span className="donut-legend-label">Убыток</span>
          <span className="donut-legend-value neg">{losses}</span>
        </div>
      </div>
    </div>
  )
}

function TradeCalendar({ trades, selectedDate, onSelect }: {
  trades: any[]
  selectedDate: string | null
  onSelect: (d: string | null) => void
}) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7

  const dayPnl = useMemo(() => {
    const map: Record<string, number> = {}
    trades.forEach(t => {
      const d = t.openedAt ? new Date(t.openedAt) : null
      if (!d) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map[key] = (map[key] || 0) + t.pnl
    })
    return map
  }, [trades])

  const goToPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else { setMonth(m => m - 1) }
  }
  const goToNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else { setMonth(m => m + 1) }
  }

  const cells: (string | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(String(d).padStart(2, '0'))

  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <div className="cal-card">
      <div className="cal-head">
        <button className="cal-nav" onClick={goToPrev}>‹</button>
        <span className="cal-title">{MONTHS[month]} {year}</span>
        <button className="cal-nav" onClick={goToNext}>›</button>
      </div>
      <div className="cal-weekdays">
        {WEEKDAYS.map(w => <span key={w} className="cal-wd">{w}</span>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="cal-cell cal-empty" />
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${d}`
          const pnl = dayPnl[key] || 0
          const hasData = key in dayPnl
          const isToday = key === today
          const isSelected = key === selectedDate
          let dotClass = ''
          if (hasData) dotClass = pnl > 0 ? 'cal-dot-green' : pnl < 0 ? 'cal-dot-red' : 'cal-dot-gray'
          return (
            <button
              key={key}
              className={`cal-cell ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''}`}
              onClick={() => onSelect(isSelected ? null : key)}
            >
              <span className="cal-day">{parseInt(d)}</span>
              {hasData && <span className={`cal-dot ${dotClass}`} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function JournalPage() {
  const { profile } = useAuth()
  const { trades, loading, addTrade, deleteTrade } = useTrades(profile?.uid)
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    symbol: 'XAU/USD', type: 'LONG' as 'LONG' | 'SHORT', entry: '', exit: '', qty: '', notes: '', tags: ''
  })

  const LOT_PRESETS = [0.01, 0.05, 0.1, 0.5, 1.0]
  const isXau = form.symbol.toUpperCase().includes('XAU')
  const lots = parseFloat(form.qty) || 0
  const entryPrice = parseFloat(form.entry) || 0
  const ozPerLot = isXau ? 100 : 1
  const contractValue = lots * ozPerLot * entryPrice
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week')

  const closed = trades.filter(t => t.status === 'closed')

  const displayTrades = useMemo(() => {
    if (!selectedDate) return closed
    return closed.filter(t => {
      const d = new Date(t.openedAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return key === selectedDate
    })
  }, [closed, selectedDate])

  const totalPnl = displayTrades.reduce((a, t) => a + t.pnl, 0)
  const wins = displayTrades.filter(t => t.pnl > 0).length
  const losses = displayTrades.filter(t => t.pnl < 0).length
  const wr = displayTrades.length > 0 ? Math.round((wins / displayTrades.length) * 100) : 0

  const weeklyData = useMemo(() => {
    const now = new Date()
    const weeks: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now)
      start.setDate(start.getDate() - start.getDay() + 1 - i * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      const label = `${start.getDate()}.${start.getMonth() + 1}`
      const value = closed
        .filter(t => {
          const d = new Date(t.openedAt)
          return d >= start && d <= end
        })
        .reduce((a, t) => a + t.pnl, 0)
      weeks.push({ label, value })
    }
    return weeks
  }, [closed])

  const monthlyData = useMemo(() => {
    const now = new Date()
    const months: { label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const m = (now.getMonth() - i + 12) % 12
      const y = now.getFullYear() - (now.getMonth() - i < 0 ? 1 : 0)
      const label = MONTHS[m]
      const value = closed
        .filter(t => {
          const d = new Date(t.openedAt)
          return d.getMonth() === m && d.getFullYear() === y
        })
        .reduce((a, t) => a + t.pnl, 0)
      months.push({ label, value })
    }
    return months
  }, [closed])

  const handleAdd = async () => {
    const e = parseFloat(form.entry), x = parseFloat(form.exit) || 0, q = parseFloat(form.qty) || 0
    const actualQty = q * ozPerLot
    const pnl = form.exit ? (form.type === 'LONG' ? (x - e) * actualQty : (e - x) * actualQty) : 0
    await addTrade({
      userId: profile!.uid, symbol: form.symbol.toUpperCase(), type: form.type,
      entryPrice: e, exitPrice: x, quantity: q, pnl: Math.round(pnl),
      pnlPercent: e > 0 ? parseFloat(((pnl / (e * actualQty)) * 100).toFixed(2)) : 0,
      status: form.exit ? 'closed' : 'open', openedAt: new Date().toISOString(),
      notes: form.notes, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setForm({ symbol: 'XAU/USD', type: 'LONG', entry: '', exit: '', qty: '', notes: '', tags: '' })
    setShowForm(false)
    toast('Сделка добавлена', 'success')
  }

  const handleDelete = async (id: string) => {
    await deleteTrade(id)
    toast('Сделка удалена', 'info')
  }

  const dateLabel = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <motion.div className="journal-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Дневник сделок</h1>
          <p className="pg-sub">{dateLabel ? `${dateLabel}` : 'Анализируй сделки и улучшай стратегию'}</p>
        </div>
        <motion.button className="btn-primary" whileHover={{ scale: 1.03 }} onClick={() => setShowForm(!showForm)}>
          <PlusIcon size={18} /> Сделка
        </motion.button>
      </div>

      <motion.div className="jstats" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <StatValue label="PnL" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`} color={totalPnl >= 0 ? '#22c55e' : '#ef4444'} />
        <StatValue label="Винрейт" value={`${wr}%`} />
        <StatValue label="Сделок" value={String(displayTrades.length)} />
        <StatValue label="Открытых" value={String(trades.filter(t => t.status === 'open').length)} />
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="journal-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="jf-head">
              <span className="jf-title">Новая сделка</span>
              <button className="jf-close" onClick={() => setShowForm(false)}>
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="jf-type-row">
              <button
                className={`jf-type-btn jf-long ${form.type === 'LONG' ? 'jf-type-active' : ''}`}
                onClick={() => setForm(p => ({ ...p, type: 'LONG' }))}
              >LONG</button>
              <button
                className={`jf-type-btn jf-short ${form.type === 'SHORT' ? 'jf-type-active' : ''}`}
                onClick={() => setForm(p => ({ ...p, type: 'SHORT' }))}
              >SHORT</button>
            </div>
            <div className="jf-fields">
              <div className="jf-field">
                <label>Пара</label>
                <input value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))} placeholder="XAU/USD" />
              </div>
              <div className="jf-field">
                <label>Вход</label>
                <input type="number" step="0.01" value={form.entry} onChange={e => setForm(p => ({ ...p, entry: e.target.value }))} placeholder="2350.50" />
              </div>
              <div className="jf-field">
                <label>Выход</label>
                <input type="number" step="0.01" value={form.exit} onChange={e => setForm(p => ({ ...p, exit: e.target.value }))} placeholder="2365.00" />
              </div>
              <div className="jf-field">
                <label>Лот</label>
                <input type="number" step="0.01" min="0.01" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} placeholder="0.1" />
              </div>
            </div>

            {isXau && (
              <motion.div
                className="jf-lot-presets"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
              >
                <div className="jf-presets-row">
                  {LOT_PRESETS.map(lot => (
                    <button
                      key={lot}
                      className={`jf-preset ${lots === lot ? 'jf-preset-active' : ''}`}
                      onClick={() => setForm(p => ({ ...p, qty: String(lot) }))}
                    >
                      {lot}
                    </button>
                  ))}
                </div>
                {entryPrice > 0 && lots > 0 && (
                  <motion.div
                    className="jf-working-money"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="jf-wm-row">
                      <span className="jf-wm-label">Работает:</span>
                      <span className="jf-wm-value">${contractValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="jf-wm-row">
                      <span className="jf-wm-label">Маржа (1:100):</span>
                      <span className="jf-wm-value jf-wm-margin">${(contractValue / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="jf-wm-row">
                      <span className="jf-wm-label">= {lots} × {ozPerLot} oz × ${entryPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
            <div className="jf-field" style={{ marginBottom: 12 }}>
              <label>Заметки</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Почему вошёл?" rows={2} />
            </div>
            <div className="jf-field" style={{ marginBottom: 16 }}>
              <label>Теги</label>
              <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="BTC, Свинг" />
            </div>
            <motion.button
              className="btn-primary btn-full"
              whileHover={{ scale: 1.02 }}
              onClick={handleAdd}
              disabled={!form.symbol || !form.entry}
            >
              <SendIcon size={16} /> Сохранить сделку
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="journal-charts">
        <div className="chart-tabs">
          <button className={`filter-btn ${chartPeriod === 'week' ? 'filter-active' : ''}`} onClick={() => setChartPeriod('week')}>Неделя</button>
          <button className={`filter-btn ${chartPeriod === 'month' ? 'filter-active' : ''}`} onClick={() => setChartPeriod('month')}>Месяц</button>
        </div>
        <div className="journal-charts-row">
          <div className="journal-charts-main">
            <PnLBarChart
              data={chartPeriod === 'week' ? weeklyData : monthlyData}
              label={chartPeriod === 'week' ? 'PnL по неделям' : 'PnL по месяцам'}
            />
          </div>
          <WinLossDonut wins={wins} losses={losses} />
        </div>
      </div>

      <TradeCalendar trades={closed} selectedDate={selectedDate} onSelect={setSelectedDate} />

      {selectedDate && (
        <motion.div className="cal-filter-info" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <span>Показаны сделки за {dateLabel}</span>
          <button className="cal-filter-clear" onClick={() => setSelectedDate(null)}>
            <CloseIcon size={14} /> Показать все
          </button>
        </motion.div>
      )}

      <div className="journal-trades-section">
        <h3 className="journal-section-title">Сделки {selectedDate ? `(${displayTrades.length})` : ''}</h3>
        {loading ? <SkeletonTable rows={3} /> : displayTrades.length === 0 ? (
          <div className="empty" style={{ padding: '32px 0' }}>
            {selectedDate ? 'Нет сделок за этот день' : 'Нет сделок'}
          </div>
        ) : (
          <div className="journal-trade-list">
            {displayTrades.map((t, i) => (
              <motion.div
                key={t.id}
                className="jt-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <div className="jt-left">
                  <div className={`jt-type-dot ${t.type === 'LONG' ? 'jt-dot-long' : 'jt-dot-short'}`} />
                  <div className="jt-info">
                    <div className="jt-symbol">{t.symbol}</div>
                    <div className="jt-meta">
                      <span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span>
                      <span className="muted">{new Date(t.openedAt).toLocaleDateString('ru')}</span>
                    </div>
                  </div>
                </div>
                <div className="jt-right">
                  <div className={`jt-pnl ${t.pnl > 0 ? 'pos' : 'neg'}`}>
                    {t.pnl > 0 ? '+' : ''}${t.pnl}
                  </div>
                  {t.notes && <div className="jt-notes muted">{t.notes}</div>}
                </div>
                <button className="jt-delete" onClick={() => handleDelete(t.id)}>
                  <TrashIcon size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
