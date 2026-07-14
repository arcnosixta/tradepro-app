import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAdminStats } from '../../hooks/useFirestore'
import './admin.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }

const statIcons = [
  (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  (c: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
]

const shortcutIcons = [
  (c: string) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  (c: string) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  (c: string) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  (c: string) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  (c: string) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
]

export default function AdminDashboard() {
  const { stats, loading } = useAdminStats()
  const nav = useNavigate()

  const cards = [
    { label: 'Пользователей', value: stats.totalUsers, color: 'var(--accent)', to: '/app/admin/users', i: 0 },
    { label: 'Постов', value: stats.totalPosts, color: '#22c55e', to: '/app/admin/community', i: 1 },
    { label: 'Сделок', value: stats.totalTrades, color: '#f59e0b', to: '/app/admin/analytics', i: 2 },
    { label: 'Новых сегодня', value: stats.newUsersToday, color: '#a855f7', to: '/app/admin/users?filter=new', i: 3 },
    { label: 'Premium', value: stats.premiumUsers, color: '#f59e0b', to: '/app/admin/users?filter=premium', i: 4 },
    { label: 'Активных трейдеров', value: stats.activeTraders, color: '#06b6d4', to: '/app/admin/analytics', i: 5 },
  ]

  const shortcuts = [
    { label: 'Пользователи', desc: 'Просмотр, бан, роли', icon: 0, color: 'var(--accent)', to: '/app/admin/users' },
    { label: 'Модерация', desc: 'Посты и комментарии', icon: 1, color: '#22c55e', to: '/app/admin/community' },
    { label: 'Проходимость', desc: 'Прогресс по курсам', icon: 2, color: '#06b6d4', to: '/app/admin/courses' },
    { label: 'Оповещения', desc: 'Рассылка пользователям', icon: 3, color: '#f59e0b', to: '/app/admin/notifications' },
    { label: 'Тесты', desc: 'Управление тестами', icon: 4, color: '#a855f7', to: '/app/admin/quizzes' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 1100 }}>
      <motion.div style={{ marginBottom: 24 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="pg-title">Админ-панель</h1>
        <p className="pg-sub">Управление пользователями и контентом</p>
      </motion.div>

      <motion.div className="admin-stats" variants={stagger} initial="hidden" animate="show">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            className="admin-stat admin-stat-clickable"
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => nav(c.to)}
          >
            <div className="admin-stat-icon" style={{ background: `${c.color}18` }}>
              {statIcons[i](c.color)}
            </div>
            <div className="admin-stat-value" style={{ color: c.color }}>
              {loading ? '—' : c.value.toLocaleString()}
            </div>
            <div className="admin-stat-label">{c.label}</div>
            <div className="admin-stat-arrow">→</div>
            <div className="admin-stat-glow" style={{ background: c.color }} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="admin-stats"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {shortcuts.map((s, i) => (
          <motion.div
            key={s.label}
            className="admin-stat admin-stat-clickable"
            variants={fadeUp}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => nav(s.to)}
          >
            <div className="admin-stat-icon" style={{ background: `${s.color}18` }}>
              {shortcutIcons[i](s.color)}
            </div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)', marginTop: 8 }}>{s.label}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{s.desc}</div>
            <div className="admin-stat-arrow">→</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
