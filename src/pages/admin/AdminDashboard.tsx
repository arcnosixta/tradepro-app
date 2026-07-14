import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAdminStats } from '../../hooks/useFirestore'
import './admin.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }

export default function AdminDashboard() {
  const { stats, loading } = useAdminStats()
  const nav = useNavigate()

  const cards = [
    { icon: '👥', label: 'Пользователей', value: stats.totalUsers, color: 'var(--accent)', to: '/app/admin/users' },
    { icon: '💬', label: 'Постов', value: stats.totalPosts, color: '#22c55e', to: '/app/admin/community' },
    { icon: '📈', label: 'Сделок', value: stats.totalTrades, color: '#f59e0b', to: '/app/admin/analytics' },
    { icon: '🆕', label: 'Новых сегодня', value: stats.newUsersToday, color: '#a855f7', to: '/app/admin/users?filter=new' },
    { icon: '⭐', label: 'Premium', value: stats.premiumUsers, color: '#f59e0b', to: '/app/admin/users?filter=premium' },
    { icon: '⚡', label: 'Активных трейдеров', value: stats.activeTraders, color: '#06b6d4', to: '/app/admin/analytics' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="pg-title">Админ-панель</h1>
        <p className="pg-sub">Управление пользователями и контентом</p>
      </div>

      <motion.div className="admin-stats" variants={stagger} initial="hidden" animate="show">
        {cards.map(c => (
          <motion.div
            key={c.label}
            className="admin-stat admin-stat-clickable"
            variants={fadeUp}
            onClick={() => nav(c.to)}
          >
            <div className="admin-stat-icon">{c.icon}</div>
            <div className="admin-stat-value" style={{ color: c.color }}>
              {loading ? '—' : c.value.toLocaleString()}
            </div>
            <div className="admin-stat-label">{c.label}</div>
            <div className="admin-stat-arrow">→</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="admin-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }} variants={stagger} initial="hidden" animate="show">
        <motion.div className="admin-stat admin-stat-clickable" variants={fadeUp} onClick={() => nav('/app/admin/users')}>
          <div className="admin-stat-icon">👤</div>
          <div className="admin-stat-label" style={{ marginBottom: 0, fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 700 }}>Пользователи</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>Просмотр, бан, роли</div>
          <div className="admin-stat-arrow">→</div>
        </motion.div>
        <motion.div className="admin-stat admin-stat-clickable" variants={fadeUp} onClick={() => nav('/app/admin/community')}>
          <div className="admin-stat-icon">🛡️</div>
          <div className="admin-stat-label" style={{ marginBottom: 0, fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 700 }}>Модерация</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>Посты и комментарии</div>
          <div className="admin-stat-arrow">→</div>
        </motion.div>
        <motion.div className="admin-stat admin-stat-clickable" variants={fadeUp} onClick={() => nav('/app/admin/courses')}>
          <div className="admin-stat-icon">📚</div>
          <div className="admin-stat-label" style={{ marginBottom: 0, fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 700 }}>Проходимость</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>Прогресс по курсам</div>
          <div className="admin-stat-arrow">→</div>
        </motion.div>
        <motion.div className="admin-stat admin-stat-clickable" variants={fadeUp} onClick={() => nav('/app/admin/notifications')}>
          <div className="admin-stat-icon">📢</div>
          <div className="admin-stat-label" style={{ marginBottom: 0, fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 700 }}>Оповещения</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>Рассылка пользователям</div>
          <div className="admin-stat-arrow">→</div>
        </motion.div>
        <motion.div className="admin-stat admin-stat-clickable" variants={fadeUp} onClick={() => nav('/app/admin/quizzes')}>
          <div className="admin-stat-icon">❓</div>
          <div className="admin-stat-label" style={{ marginBottom: 0, fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 700 }}>Тесты</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>Управление тестами</div>
          <div className="admin-stat-arrow">→</div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
