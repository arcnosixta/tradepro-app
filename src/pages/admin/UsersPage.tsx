import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAllUsers, useUserPosts, useTrades } from '../../hooks/useFirestore'
import { useToast } from '../../context/ToastContext'
import './admin.css'

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const diff = Math.floor(Date.now() / 1000) - Math.floor(new Date(dateStr).getTime() / 1000)
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`
  return `${Math.floor(diff / 604800)} нед назад`
}

function UserDetailModal({ user, onClose, onBan, onAdmin }: {
  user: { uid: string; name: string; email: string; bio: string; joinedAt: string; admin?: boolean; banned?: boolean; avatar?: string }
  onClose: () => void
  onBan: () => void
  onAdmin: () => void
}) {
  const { posts } = useUserPosts(user.uid)
  const { trades } = useTrades(user.uid)
  const nav = useNavigate()

  const closed = trades.filter(t => t.status === 'closed')
  const totalPnl = closed.reduce((a, t) => a + t.pnl, 0)
  const wins = closed.filter(t => t.pnl > 0).length
  const wr = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="admin-modal admin-modal-lg" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300 }} onClick={e => e.stopPropagation()}>
        <div className="user-detail-header">
          <div className="user-detail-avatar">{user.name?.[0]?.toUpperCase() || '?'}</div>
          <div className="user-detail-info">
            <h3>{user.name}</h3>
            <div className="user-detail-email">{user.email}</div>
            <div className="user-detail-meta">
              {user.joinedAt && <span>📅 {new Date(user.joinedAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              {user.admin && <span className="admin-badge admin-badge-admin">👑 Админ</span>}
              {user.banned && <span className="admin-badge admin-badge-banned">🚫 Забанен</span>}
            </div>
          </div>
        </div>

        {user.bio && <div className="user-detail-bio">{user.bio}</div>}

        <div className="user-detail-stats">
          <div className="user-detail-stat">
            <div className="user-detail-stat-value" style={{ color: totalPnl >= 0 ? '#22c55e' : '#ef4444' }}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}
            </div>
            <div className="user-detail-stat-label">Общий PnL</div>
          </div>
          <div className="user-detail-stat">
            <div className="user-detail-stat-value" style={{ color: 'var(--accent)' }}>{wr}%</div>
            <div className="user-detail-stat-label">Винрейт</div>
          </div>
          <div className="user-detail-stat">
            <div className="user-detail-stat-value">{closed.length}</div>
            <div className="user-detail-stat-label">Сделок</div>
          </div>
          <div className="user-detail-stat">
            <div className="user-detail-stat-value">{posts.length}</div>
            <div className="user-detail-stat-label">Постов</div>
          </div>
        </div>

        {closed.length > 0 && (
          <div className="user-detail-section">
            <h4>Последние сделки</h4>
            <div className="user-detail-trades">
              {closed.slice(0, 5).map(t => (
                <div key={t.id} className="user-detail-trade">
                  <span className="user-detail-trade-pair">
                    <span style={{ color: t.type === 'LONG' ? '#22c55e' : '#ef4444' }}>{t.type}</span> {t.symbol}
                  </span>
                  <span style={{ color: t.pnl >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {posts.length > 0 && (
          <div className="user-detail-section">
            <h4>Последние посты</h4>
            <div className="user-detail-posts">
              {posts.slice(0, 3).map(p => (
                <div key={p.id} className="user-detail-post">
                  <div className="user-detail-post-content">{p.content.slice(0, 120)}{p.content.length > 120 ? '...' : ''}</div>
                  <div className="user-detail-post-stats">❤️ {p.likes} · 💬 {p.comments}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="user-detail-actions">
          <button className="admin-btn" onClick={() => { onClose(); nav(`/app/user/${user.uid}`) }}>👁 Открыть профиль</button>
          <button className={`admin-btn ${user.admin ? 'admin-btn-warn' : 'admin-btn-success'}`} onClick={onAdmin}>
            {user.admin ? 'Снять админа' : '👑 Назначить админом'}
          </button>
          <button className={`admin-btn ${user.banned ? 'admin-btn-success' : 'admin-btn-danger'}`} onClick={onBan}>
            {user.banned ? 'Разбанить' : '🚫 Забанить'}
          </button>
          <button className="admin-btn" onClick={onClose}>Закрыть</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null
  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div className="admin-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300 }} onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="admin-modal-actions">
          <button className="admin-btn" onClick={onCancel}>Отмена</button>
          <button className="admin-btn admin-btn-danger" onClick={onConfirm}>Подтвердить</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function UsersPage() {
  const { users, loading, banUser, setAdmin } = useAllUsers()
  const { toast } = useToast()
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'admin' | 'banned' | 'new'>(() => {
    const f = searchParams.get('filter')
    if (f === 'admin' || f === 'banned' || f === 'new') return f
    return 'all'
  })
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => void } | null>(null)

  useEffect(() => {
    const f = searchParams.get('filter')
    if (f === 'admin' || f === 'banned' || f === 'new') setFilter(f)
  }, [searchParams])

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f)
    if (f === 'all') setSearchParams({})
    else setSearchParams({ filter: f })
  }

  const filtered = users.filter(u => {
    if (search) {
      const q = search.toLowerCase()
      if (!u.name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false
    }
    if (filter === 'admin') return u.admin
    if (filter === 'banned') return u.banned
    if (filter === 'new') {
      const day = Date.now() - 86400000
      return u.joinedAt && new Date(u.joinedAt).getTime() > day
    }
    return true
  })

  const handleBan = (u: typeof users[0]) => {
    setConfirmAction({
      title: u.banned ? 'Разбанить пользователя?' : 'Забанить пользователя?',
      message: `${u.banned ? 'Разрешить' : 'Запретить'} ${u.name} (${u.email}) доступ к приложению?`,
      action: async () => {
        await banUser(u.uid, !u.banned)
        toast(u.banned ? 'Пользователь разбанен' : 'Пользователь забанен', 'success')
        setConfirmAction(null)
        setSelectedUser(null)
      },
    })
  }

  const handleAdmin = (u: typeof users[0]) => {
    setConfirmAction({
      title: u.admin ? 'Снять админа?' : 'Назначить админом?',
      message: `${u.admin ? 'Отобрать' : 'Дать'} ${u.name} права администратора?`,
      action: async () => {
        await setAdmin(u.uid, !u.admin)
        toast(u.admin ? 'Права администратора отобраны' : 'Пользователь назначен админом', 'success')
        setConfirmAction(null)
        setSelectedUser(null)
      },
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <button className="back" onClick={() => nav('/app/admin')}>← Назад</button>
        <h1 className="pg-title">Пользователи</h1>
        <p className="pg-sub">{users.length} всего · {filtered.length} показано</p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="admin-search" placeholder="Поиск по имени или email..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="admin-tabs">
          {([
            ['all', 'Все'],
            ['admin', 'Админы'],
            ['banned', 'Забанены'],
            ['new', 'Новые'],
          ] as const).map(([key, label]) => (
            <button key={key} className={`admin-tab ${filter === key ? 'admin-tab-active' : ''}`} onClick={() => handleFilterChange(key)}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-empty"><div className="admin-empty-icon">⏳</div>Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty"><div className="admin-empty-icon">🔍</div>Пользователи не найдены</div>
      ) : (
        <div className="admin-section">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Дата регистрации</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.uid} className="admin-table-row-clickable" onClick={() => setSelectedUser(u)}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">{u.name?.[0]?.toUpperCase() || '?'}</div>
                        <div>
                          <div className="admin-user-name">{u.name}</div>
                          <div className="admin-user-email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {u.joinedAt ? timeAgo(u.joinedAt) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {u.admin && <span className="admin-badge admin-badge-admin">👑 Админ</span>}
                        {u.banned && <span className="admin-badge admin-badge-banned">🚫 Забанен</span>}
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="admin-actions">
                        <button className="admin-btn" onClick={() => setSelectedUser(u)}>👁</button>
                        <button className={`admin-btn ${u.admin ? 'admin-btn-warn' : 'admin-btn-success'}`} onClick={() => handleAdmin(u)}>
                          {u.admin ? 'Снять админа' : '👑 Админ'}
                        </button>
                        <button className={`admin-btn ${u.banned ? 'admin-btn-success' : 'admin-btn-danger'}`} onClick={() => handleBan(u)}>
                          {u.banned ? 'Разбанить' : '🚫 Бан'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-mobile-cards" style={{ display: 'none' }}>
            {filtered.map(u => (
              <div key={u.uid} className="admin-post admin-card-clickable" onClick={() => setSelectedUser(u)}>
                <div className="admin-post-header">
                  <div className="admin-user-cell">
                    <div className="admin-user-avatar">{u.name?.[0]?.toUpperCase() || '?'}</div>
                    <div>
                      <div className="admin-user-name">{u.name}</div>
                      <div className="admin-user-email">{u.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {u.admin && <span className="admin-badge admin-badge-admin">👑</span>}
                    {u.banned && <span className="admin-badge admin-badge-banned">🚫</span>}
                  </div>
                </div>
                <div className="admin-post-meta">{u.joinedAt ? timeAgo(u.joinedAt) : '—'}</div>
                <div className="admin-actions" style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                  <button className={`admin-btn ${u.admin ? 'admin-btn-warn' : 'admin-btn-success'}`} onClick={() => handleAdmin(u)}>
                    {u.admin ? 'Снять' : '👑 Админ'}
                  </button>
                  <button className={`admin-btn ${u.banned ? 'admin-btn-success' : 'admin-btn-danger'}`} onClick={() => handleBan(u)}>
                    {u.banned ? 'Разбан' : '🚫 Бан'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onBan={() => handleBan(selectedUser)}
            onAdmin={() => handleAdmin(selectedUser)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmAction && (
          <ConfirmModal
            open={!!confirmAction}
            title={confirmAction.title}
            message={confirmAction.message}
            onConfirm={confirmAction.action}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
