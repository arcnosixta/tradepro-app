import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useTrades } from '../../hooks/useFirestore'
import { SkeletonTable } from '../../components/ui/Skeleton'
import useCountUp from '../../hooks/useCountUp'
import './pages.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

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

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }

export default function JournalPage() {
  const { profile } = useAuth()
  const { trades, loading, addTrade } = useTrades(profile?.uid)
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ symbol: '', type: 'LONG' as 'LONG' | 'SHORT', entry: '', exit: '', qty: '', notes: '', tags: '' })

  const filtered = filter === 'all' ? trades : trades.filter(t => t.status === filter)
  const closed = trades.filter(t => t.status === 'closed')
  const totalPnl = closed.reduce((a, t) => a + t.pnl, 0)
  const wins = closed.filter(t => t.pnl > 0).length
  const wr = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0

  const handleAdd = async () => {
    const e = parseFloat(form.entry), x = parseFloat(form.exit) || 0, q = parseFloat(form.qty)
    const pnl = form.exit ? (form.type === 'LONG' ? (x - e) * q : (e - x) * q) : 0
    await addTrade({
      userId: profile!.uid, symbol: form.symbol.toUpperCase(), type: form.type,
      entryPrice: e, exitPrice: x, quantity: q, pnl: Math.round(pnl),
      pnlPercent: e > 0 ? parseFloat(((pnl / (e * q)) * 100).toFixed(2)) : 0,
      status: form.exit ? 'closed' : 'open', openedAt: new Date().toISOString(),
      notes: form.notes, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setForm({ symbol: '', type: 'LONG', entry: '', exit: '', qty: '', notes: '', tags: '' })
    setShowAdd(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="pg-head">
        <div><h1 className="pg-title">Дневник сделок</h1><p className="pg-sub">Анализируй сделки и улучшай стратегию</p></div>
        <motion.button className="btn-primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(!showAdd)}>+ Новая сделка</motion.button>
      </div>

      <motion.div className="jstats" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <StatValue label="Общий PnL" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`} color={totalPnl >= 0 ? '#22c55e' : '#ef4444'} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatValue label="Винрейт" value={`${wr}%`} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatValue label="Всего" value={String(closed.length)} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatValue label="Открытых" value={String(trades.filter(t => t.status === 'open').length)} />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="form-card"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="form-grid">
              <div className="field"><label>Пара</label><input value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))} placeholder="BTC/USDT" /></div>
              <div className="field"><label>Тип</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as 'LONG' | 'SHORT' }))}><option>LONG</option><option>SHORT</option></select></div>
              <div className="field"><label>Вход</label><input type="number" value={form.entry} onChange={e => setForm(p => ({ ...p, entry: e.target.value }))} placeholder="67250" /></div>
              <div className="field"><label>Выход</label><input type="number" value={form.exit} onChange={e => setForm(p => ({ ...p, exit: e.target.value }))} placeholder="69100" /></div>
              <div className="field"><label>Кол-во</label><input type="number" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} placeholder="0.5" /></div>
              <div className="field"><label>Теги</label><input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="BTC, Свинг" /></div>
              <div className="field field-full"><label>Заметки</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Почему вошёл?" rows={2} /></div>
            </div>
            <div className="form-actions">
              <button className="btn-outline" onClick={() => setShowAdd(false)}>Отмена</button>
              <motion.button className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAdd}>Сохранить</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="filters">
        {(['all', 'open', 'closed'] as const).map(f => (
          <motion.button key={f} className={`filter-btn ${filter === f ? 'filter-active' : ''}`} onClick={() => setFilter(f)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            {f === 'all' ? 'Все' : f === 'open' ? 'Открытые' : 'Закрытые'}
          </motion.button>
        ))}
      </div>

      {loading ? <SkeletonTable rows={5} /> : (
        <>
          <div className="tbl-card">
            <div className="tbl">
              <div className="tbl-h"><span>Пара</span><span>Тип</span><span>Вход</span><span>Выход</span><span>PnL</span><span>Дата</span><span>Заметки</span></div>
              {filtered.map((t, i) => (
                <motion.div key={t.id} className="tbl-r" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                  <span className="pair">{t.symbol}</span>
                  <span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span>
                  <span>${t.entryPrice.toLocaleString()}</span>
                  <span>{t.exitPrice > 0 ? `$${t.exitPrice.toLocaleString()}` : '—'}</span>
                  <span className={t.pnl > 0 ? 'pos' : 'neg'} style={{ fontWeight: 700 }}>{t.pnl > 0 ? '+' : ''}${t.pnl}</span>
                  <span className="muted">{new Date(t.openedAt).toLocaleDateString('ru')}</span>
                  <span className="muted truncate">{t.notes}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="trade-cards">
            {filtered.length === 0 ? <p className="empty">Нет сделок</p> : filtered.map((t, i) => (
              <motion.div key={t.id} className="trade-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                <div className="trade-card-header">
                  <div className="trade-card-pair"><span className={`badge ${t.type.toLowerCase()}`}>{t.type}</span>{t.symbol}</div>
                  <div className={`trade-card-pnl ${t.pnl > 0 ? 'pos' : 'neg'}`}>{t.pnl > 0 ? '+' : ''}${t.pnl}</div>
                </div>
                <div className="trade-card-details">
                  <div className="trade-card-detail"><span className="trade-card-detail-label">Вход</span><span className="trade-card-detail-value">${t.entryPrice.toLocaleString()}</span></div>
                  <div className="trade-card-detail"><span className="trade-card-detail-label">Выход</span><span className="trade-card-detail-value">{t.exitPrice > 0 ? `$${t.exitPrice.toLocaleString()}` : '—'}</span></div>
                  <div className="trade-card-detail"><span className="trade-card-detail-label">Дата</span><span className="trade-card-detail-value">{new Date(t.openedAt).toLocaleDateString('ru')}</span></div>
                </div>
                {t.notes && <div className="trade-card-notes">{t.notes}</div>}
              </motion.div>
            ))}
          </div>
        </>
      )}

      <div className="tags-card">
        <h3>Теги сделок</h3>
        <div className="tags-cloud">
          {Array.from(new Set(trades.flatMap(t => t.tags))).map(tag => (
            <motion.span key={tag} className="tag-chip" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{tag}</motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
