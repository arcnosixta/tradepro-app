import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications, type Notification } from '../../hooks/useNotifications'
import timeAgo from '../../utils/timeAgo'
import './notifications.css'

const typeIcons: Record<string, string> = {
  comment: '💬', like: '❤️', trade: '📈', achievement: '🏆', course: '📚', system: '🔔', ban: '🚫',
}

export default function NotificationBell() {
  const { profile } = useAuth()
  const { notifications, unread, markRead, markAllRead } = useNotifications(profile?.uid)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id)
    if (n.link) window.location.href = n.link
  }

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="notif-bell-btn" onClick={() => setOpen(p => !p)}>
        <span className="notif-bell-icon">🔔</span>
        {unread > 0 && (
          <motion.span
            className="notif-bell-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            {unread > 99 ? '99+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="notif-panel"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="notif-panel-head">
              <span className="notif-panel-title">Уведомления</span>
              {unread > 0 && (
                <button className="notif-panel-mark" onClick={markAllRead}>
                  Прочитать все
                </button>
              )}
            </div>
            <div className="notif-panel-list">
              {notifications.length === 0 ? (
                <div className="notif-panel-empty">Пока нет уведомлений</div>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <motion.div
                    key={n.id}
                    className={`notif-item ${n.read ? '' : 'notif-item-unread'}`}
                    onClick={() => handleClick(n)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="notif-item-icon">{typeIcons[n.type] || '🔔'}</span>
                    <div className="notif-item-body">
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-text">{n.body}</div>
                      <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.read && <span className="notif-item-dot" />}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
