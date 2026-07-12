import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAllUsers } from '../../hooks/useFirestore'
import { broadcastNotification, type Notification } from '../../hooks/useNotifications'
import { useToast } from '../../context/ToastContext'
import './admin.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } } }

const NOTIF_TYPES: { value: Notification['type']; label: string; icon: string }[] = [
  { value: 'system', label: 'Системное', icon: '🔔' },
  { value: 'achievement', label: 'Достижение', icon: '🏆' },
  { value: 'course', label: 'Курс', icon: '📚' },
  { value: 'trade', label: 'Торговля', icon: '📈' },
  { value: 'comment', label: 'Комментарий', icon: '💬' },
  { value: 'like', label: 'Лайк', icon: '❤️' },
]

export default function NotificationsAdmin() {
  const { users, loading: usersLoading } = useAllUsers()
  const { toast } = useToast()
  const nav = useNavigate()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<Notification['type']>('system')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ count: number; time: string } | null>(null)

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { toast('Заполни заголовок и текст', 'error'); return }
    setSending(true)
    try {
      const result = await broadcastNotification({ type, title: title.trim(), body: body.trim() })
      if (result.errors > 0) {
        toast(`Отправлено ${result.sent}, ошибок: ${result.errors}`, 'error')
      } else {
        toast(`Оповещение отправлено ${result.sent} пользователям`, 'success')
      }
      setSent({ count: result.sent, time: new Date().toLocaleTimeString('ru') })
      setTitle('')
      setBody('')
      setType('system')
    } catch (err) {
      console.error(err)
      toast('Ошибка отправки', 'error')
    }
    setSending(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <button className="back" onClick={() => nav('/app/admin')}>← Назад</button>
        <h1 className="pg-title">Оповещения</h1>
        <p className="pg-sub">Отправка оповещений всем пользователям</p>
      </div>

      {/* ─── Stat ─── */}
      <motion.div className="admin-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }} variants={stagger} initial="hidden" animate="show">
        <motion.div className="admin-stat" variants={fadeUp}>
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-value" style={{ color: 'var(--accent)' }}>
            {usersLoading ? '—' : users.length}
          </div>
          <div className="admin-stat-label">Получателей</div>
        </motion.div>
        <motion.div className="admin-stat" variants={fadeUp}>
          <div className="admin-stat-icon">✅</div>
          <div className="admin-stat-value" style={{ color: '#22c55e' }}>
            {sent ? sent.count : '—'}
          </div>
          <div className="admin-stat-label">Отправлено</div>
        </motion.div>
        <motion.div className="admin-stat" variants={fadeUp}>
          <div className="admin-stat-icon">🕐</div>
          <div className="admin-stat-value" style={{ color: '#f59e0b', fontSize: 'var(--text-lg)' }}>
            {sent ? sent.time : '—'}
          </div>
          <div className="admin-stat-label">Последняя отправка</div>
        </motion.div>
      </motion.div>

      {/* ─── Form ─── */}
      <motion.div className="admin-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <div className="admin-section-header">
          <h2>📝 Новое оповещение</h2>
        </div>
        <div style={{ padding: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {/* Type selector */}
            <div>
              <label className="admin-label">Тип</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {NOTIF_TYPES.map(t => (
                  <button
                    key={t.value}
                    className={`admin-type-btn ${type === t.value ? 'admin-type-active' : ''}`}
                    onClick={() => setType(t.value)}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="admin-label">Заголовок</label>
              <input
                className="admin-input"
                placeholder="Например: Новый курс доступен!"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
              />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>{title.length}/100</div>
            </div>

            {/* Body */}
            <div>
              <label className="admin-label">Текст</label>
              <textarea
                className="admin-textarea"
                placeholder="Текст оповещения для пользователей..."
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>{body.length}/500</div>
            </div>

            {/* Preview */}
            {(title.trim() || body.trim()) && (
              <div>
                <label className="admin-label">Предпросмотр</label>
                <div className="notif-preview">
                  <span className="notif-preview-icon">{NOTIF_TYPES.find(t => t.value === type)?.icon || '🔔'}</span>
                  <div className="notif-preview-body">
                    <div className="notif-preview-title">{title || 'Заголовок'}</div>
                    <div className="notif-preview-text">{body || 'Текст оповещения...'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Send button */}
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              style={{ opacity: sending || !title.trim() || !body.trim() ? 0.5 : 1, marginTop: 8, padding: '14px 24px' }}
            >
              {sending ? 'Отправка...' : `📢 Отправить ${users.length} пользователям`}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ─── Sent History (session only) ─── */}
      <AnimatePresence>
        {sent && (
          <motion.div
            className="admin-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="admin-section-header">
              <h2>✅ Отправлено</h2>
            </div>
            <div style={{ padding: 'var(--sp-5) var(--sp-6)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Последнее оповещение доставлено <strong style={{ color: 'var(--text)' }}>{sent.count}</strong> пользователям в {sent.time}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
