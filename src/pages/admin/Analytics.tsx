import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAllUsers, useAllTrades, useAdminCommunity } from '../../hooks/useFirestore'
import './admin.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }

function BarChart({ data, maxVal }: { data: { label: string; value: number; color: string }[]; maxVal: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(d => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 100, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>{d.label}</span>
          <div style={{ flex: 1, height: 24, background: 'var(--bg)', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: maxVal > 0 ? `${(d.value / maxVal) * 100}%` : '0%' }}
              transition={{ duration: 0.8, ease }}
              style={{ height: '100%', background: d.color, borderRadius: 'var(--radius)', position: 'relative' }}
            />
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--text-xs)', fontWeight: 700, color: '#fff' }}>
              {d.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="admin-stat" style={{ textAlign: 'center' }}>
      <div className="admin-stat-value" style={{ color, fontSize: 'var(--text-xl)' }}>{value}</div>
      <div className="admin-stat-label">{label}</div>
    </div>
  )
}

export default function Analytics() {
  const { users, loading: usersLoading } = useAllUsers()
  const { trades, loading: tradesLoading } = useAllTrades()
  const { posts, loading: postsLoading } = useAdminCommunity()
  const nav = useNavigate()

  const loading = usersLoading || tradesLoading || postsLoading

  const analytics = useMemo(() => {
    const now = Date.now()
    const day = 86400000

    const usersPerDay: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * day)
      const key = d.toLocaleDateString('ru', { day: 'numeric', month: 'short' })
      usersPerDay[key] = 0
    }
    users.forEach(u => {
      if (!u.joinedAt) return
      const d = new Date(u.joinedAt)
      const key = d.toLocaleDateString('ru', { day: 'numeric', month: 'short' })
      if (key in usersPerDay) usersPerDay[key]++
    })

    const postsPerDay: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * day)
      const key = d.toLocaleDateString('ru', { day: 'numeric', month: 'short' })
      postsPerDay[key] = 0
    }
    posts.forEach(p => {
      if (!p.createdAt?.seconds) return
      const d = new Date(p.createdAt.seconds * 1000)
      const key = d.toLocaleDateString('ru', { day: 'numeric', month: 'short' })
      if (key in postsPerDay) postsPerDay[key]++
    })

    const closedTrades = trades.filter(t => t.status === 'closed')
    const totalPnl = closedTrades.reduce((a, t) => a + (t.pnl || 0), 0)
    const wins = closedTrades.filter(t => t.pnl > 0).length
    const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0

    const userTradeCount: Record<string, number> = {}
    trades.forEach(t => {
      userTradeCount[t.userId] = (userTradeCount[t.userId] || 0) + 1
    })
    const topTraders = Object.entries(userTradeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([uid, count]) => {
        const user = users.find(u => u.uid === uid)
        return { name: user?.name || uid.slice(0, 8), count, uid }
      })

    const topTradersUid = topTraders.map(t => t.uid)

    const tagCount: Record<string, number> = {}
    posts.forEach(p => {
      (p.tags || []).forEach(t => {
        tagCount[t] = (tagCount[t] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    const uniquePostAuthors = new Set(posts.map(p => p.authorUid)).size

    return {
      usersChart: Object.entries(usersPerDay).map(([label, value]) => ({ label, value, color: 'var(--accent)' })),
      postsChart: Object.entries(postsPerDay).map(([label, value]) => ({ label, value, color: '#22c55e' })),
      totalPnl,
      winRate,
      topTraders,
      topTradersUid,
      topTags,
      uniquePostAuthors,
      totalLikes: posts.reduce((a, p) => a + (p.likes || 0), 0),
    }
  }, [users, trades, posts])

  const maxUsers = Math.max(1, ...analytics.usersChart.map(d => d.value))
  const maxPosts = Math.max(1, ...analytics.postsChart.map(d => d.value))

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <button className="back" onClick={() => nav('/app/admin')}>← Назад</button>
        <h1 className="pg-title">Аналитика</h1>
        <p className="pg-sub">Статистика платформы за всё время</p>
      </div>

      {loading ? (
        <div className="admin-empty"><div className="admin-empty-icon">⏳</div>Загрузка...</div>
      ) : (
        <>
          <motion.div className="admin-stats" variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp}><StatBox label="Всего PnL пользователей" value={`${analytics.totalPnl >= 0 ? '+' : ''}$${analytics.totalPnl.toLocaleString()}`} color={analytics.totalPnl >= 0 ? '#22c55e' : '#ef4444'} /></motion.div>
            <motion.div variants={fadeUp}><StatBox label="Средний винрейт" value={`${analytics.winRate}%`} color="var(--accent)" /></motion.div>
            <motion.div variants={fadeUp}><StatBox label="Авторов постов" value={String(analytics.uniquePostAuthors)} color="#a855f7" /></motion.div>
            <motion.div variants={fadeUp}><StatBox label="Всего лайков" value={String(analytics.totalLikes)} color="#f59e0b" /></motion.div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <motion.div className="admin-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
              <div className="admin-section-header">
                <h2>Регистрации (7 дней)</h2>
              </div>
              <div style={{ padding: 'var(--sp-5)' }}>
                <BarChart data={analytics.usersChart} maxVal={maxUsers} />
              </div>
            </motion.div>

            <motion.div className="admin-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
              <div className="admin-section-header">
                <h2>Посты (7 дней)</h2>
              </div>
              <div style={{ padding: 'var(--sp-5)' }}>
                <BarChart data={analytics.postsChart} maxVal={maxPosts} />
              </div>
            </motion.div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <motion.div className="admin-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
              <div className="admin-section-header">
                <h2>Топ трейдеров</h2>
              </div>
              <div style={{ padding: 'var(--sp-4)' }}>
                {analytics.topTraders.length === 0 ? (
                  <div className="admin-empty">Нет данных</div>
                ) : (
                  analytics.topTraders.map((t, i) => (
                    <div key={t.name} className="admin-trader-row" onClick={() => nav(`/app/user/${analytics.topTradersUid?.[i] || ''}`)}>
                      <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: i < 3 ? 'var(--accent)' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, color: i < 3 ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: 'var(--text-sm)' }}>{t.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{t.count} сделок</span>
                      <span className="admin-trader-arrow">→</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div className="admin-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
              <div className="admin-section-header">
                <h2>Популярные теги</h2>
              </div>
              <div style={{ padding: 'var(--sp-4)' }}>
                {analytics.topTags.length === 0 ? (
                  <div className="admin-empty">Нет данных</div>
                ) : (
                  analytics.topTags.map(([tag, count]) => (
                    <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--accent)' }}>#{tag}</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{count} постов</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  )
}
