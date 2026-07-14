import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useTrades } from '../../hooks/useFirestore'
import { SkeletonProfile } from '../../components/ui/Skeleton'
import useCountUp from '../../hooks/useCountUp'
import './pages.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }

function AnimatedStat({ label, value, color }: { label: string; value: string; color: string }) {
  const numMatch = value.match(/-?\d[\d,.]*/)
  const animated = useCountUp(numMatch ? parseFloat(numMatch[0].replace(/,/g, '')) : 0)
  const display = numMatch ? value.replace(numMatch[0], animated.toLocaleString()) : value
  return (
    <motion.div className="ps" variants={fadeUp} whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <div className="ps-l">{label}</div>
      <div className="ps-v" style={{ color }}>{display}</div>
    </motion.div>
  )
}

export default function ProfilePage() {
  const { profile, updateProfileData } = useAuth()
  const { trades, loading } = useTrades(profile?.uid)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [bio, setBio] = useState(profile?.bio || '')

  if (loading) return <SkeletonProfile />

  const closed = trades.filter(t => t.status === 'closed')
  const totalPnl = closed.reduce((a, t) => a + t.pnl, 0)
  const wins = closed.filter(t => t.pnl > 0).length
  const wr = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0
  const avgW = wins > 0 ? closed.filter(t => t.pnl > 0).reduce((a, t) => a + t.pnl, 0) / wins : 0
  const lossN = closed.length - wins
  const avgL = lossN > 0 ? closed.filter(t => t.pnl < 0).reduce((a, t) => a + t.pnl, 0) / lossN : 0
  const pf = avgL !== 0 ? Math.abs(avgW / avgL).toFixed(2) : '∞'

  const stats = [
    { l: 'Общий PnL', v: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`, c: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
    { l: 'Винрейт', v: `${wr}%`, c: 'var(--accent)' },
    { l: 'Сделок', v: String(closed.length), c: 'var(--text)' },
    { l: 'Profit Factor', v: pf, c: 'var(--accent-2)' },
    { l: 'Ср. прибыль', v: `+$${Math.round(avgW)}`, c: '#22c55e' },
    { l: 'Ср. убыток', v: `$${Math.round(avgL)}`, c: '#ef4444' },
  ]

  const handleSave = async () => { await updateProfileData({ name, bio }); setEditing(false) }

  const achievements = [
    { icon: '🏆', t: 'Первая сделка', d: 'Завершил сделку', ok: closed.length >= 1 },
    { icon: '📈', t: '10 сделок', d: '10 сделок', ok: closed.length >= 10 },
    { icon: '🎯', t: 'Мастер винрейта', d: 'Винрейт 65%+', ok: wr >= 65 },
    { icon: '💎', t: '100 сделок', d: '100 сделок', ok: closed.length >= 100 },
    { icon: '🔥', t: 'Серия побед', d: '5 подряд в плюс', ok: false },
    { icon: '🎓', t: 'Выпускник', d: 'Все курсы', ok: false },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 900 }}>
      <motion.div className="profile-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="profile-bg" />
        <div className="profile-info">
          <motion.div
            className="profile-avatar"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {name[0]?.toUpperCase() || 'T'}
          </motion.div>
          <div className="profile-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1>{name}</h1>
              {profile?.premium && (
                <span style={{
                  fontSize: 'var(--text-xs)', fontWeight: 700,
                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  color: '#fff',
                }}>⭐ Premium</span>
              )}
              {profile?.admin && (
                <span style={{
                  fontSize: 'var(--text-xs)', fontWeight: 700,
                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(168,85,247,0.12)', color: '#a855f7',
                }}>👑 Админ</span>
              )}
            </div>
            <p className="muted">{profile?.email}</p>
            {!editing ? (
              <p className="muted">{bio || 'Нет описания'}</p>
            ) : (
              <div className="edit-fields">
                <input value={name} onChange={e => setName(e.target.value)} />
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} />
              </div>
            )}
            <p className="muted" style={{ fontSize: '0.8rem' }}>📅 {profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('ru', { month: 'long', year: 'numeric' }) : '—'}</p>
          </div>
          <motion.button className="btn-outline" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => editing ? handleSave() : setEditing(true)} style={{ marginTop: 48, flexShrink: 0 }}>
            {editing ? '💾 Сохранить' : '✏️ Редактировать'}
          </motion.button>
        </div>
      </motion.div>

      <motion.div className="pstats" variants={stagger} initial="hidden" animate="show">
        {stats.map(s => (
          <AnimatedStat key={s.l} label={s.l} value={s.v} color={s.c} />
        ))}
      </motion.div>

      <motion.div className="section-block" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <h2>Достижения</h2>
        <div className="ach-grid">
          {achievements.map((a, i) => (
            <motion.div
              key={a.t}
              className={`ach ${a.ok ? '' : 'ach-locked'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.08, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="ach-icon">{a.icon}</div>
              <div className="ach-t">{a.t}</div>
              <div className="ach-d">{a.d}</div>
              {a.ok && (
                <motion.div
                  className="ach-ok"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.5 + i * 0.1 }}
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div className="section-block" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
        <h2>Настройки</h2>
        <div className="settings">
          {[
            { i: '🔔', t: 'Уведомления', d: 'Push-уведомления' },
            { i: '🌐', t: 'Язык', d: 'Русский' },
            { i: '🔒', t: 'Безопасность', d: 'Пароль и 2FA' },
          ].map((s, i) => (
            <motion.div
              key={s.t}
              className="setting"
              whileHover={{ x: 4, backgroundColor: 'var(--bg-card-hover)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
            >
              <span className="setting-icon">{s.i}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.t}</div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>{s.d}</div>
              </div>
              <span className="muted" style={{ marginLeft: 'auto' }}>→</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
