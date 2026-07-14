import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useTrades, useUserProgress, useCourses } from '../../hooks/useFirestore'
import { useToast } from '../../context/ToastContext'
import { SkeletonProfile } from '../../components/ui/Skeleton'
import useCountUp from '../../hooks/useCountUp'
import { compressAvatar, compressBanner } from '../../utils/imageCompression'
import { CameraIcon } from '../../components/ui/Icons'
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
  const { progress } = useUserProgress(profile?.uid)
  const { courses } = useCourses()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const avatarInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)

  if (loading) return <SkeletonProfile />

  const closed = trades.filter(t => t.status === 'closed')
  const totalPnl = closed.reduce((a, t) => a + t.pnl, 0)
  const wins = closed.filter(t => t.pnl > 0).length
  const wr = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0
  const avgW = wins > 0 ? closed.filter(t => t.pnl > 0).reduce((a, t) => a + t.pnl, 0) / wins : 0
  const lossN = closed.length - wins
  const avgL = lossN > 0 ? closed.filter(t => t.pnl < 0).reduce((a, t) => a + t.pnl, 0) / lossN : 0
  const pf = avgL !== 0 ? Math.abs(avgW / avgL).toFixed(2) : '∞'
  const bestTrade = closed.length > 0 ? Math.max(...closed.map(t => t.pnl)) : 0
  // worstTrade available if needed

  let maxStreak = 0, curStreak = 0
  closed.forEach(t => { if (t.pnl > 0) { curStreak++; maxStreak = Math.max(maxStreak, curStreak) } else { curStreak = 0 } })

  let totalLessons = 0, doneLessons = 0
  courses.forEach(c => c.modules.forEach(m => {
    totalLessons += m.lessons.length
    doneLessons += m.lessons.filter(l => (progress[c.id] || []).includes(l.id)).length
  }))
  const coursesDone = courses.filter(c => {
    const tot = c.modules.reduce((a, m) => a + m.lessons.length, 0)
    const dn = c.modules.reduce((a, m) => a + m.lessons.filter(l => (progress[c.id] || []).includes(l.id)).length, 0)
    return tot > 0 && dn === tot
  }).length

  const stats = [
    { l: 'Общий PnL', v: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`, c: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
    { l: 'Винрейт', v: `${wr}%`, c: 'var(--accent)' },
    { l: 'Сделок', v: String(closed.length), c: 'var(--text)' },
    { l: 'Profit Factor', v: pf, c: 'var(--accent-2)' },
    { l: 'Ср. прибыль', v: `+$${Math.round(avgW)}`, c: '#22c55e' },
    { l: 'Ср. убыток', v: `$${Math.round(avgL)}`, c: '#ef4444' },
  ]

  const achievements = [
    { icon: '🏆', t: 'Первая сделка', d: 'Завершил первую сделку', ok: closed.length >= 1 },
    { icon: '📈', t: '10 сделок', d: '10 закрытых сделок', ok: closed.length >= 10 },
    { icon: '🔥', t: '50 сделок', d: '50 закрытых сделок', ok: closed.length >= 50 },
    { icon: '💎', t: '100 сделок', d: '100 закрытых сделок', ok: closed.length >= 100 },
    { icon: '🎯', t: 'Мастер винрейта', d: 'Винрейт 65%+', ok: wr >= 65 },
    { icon: '👑', t: 'Элита', d: 'Винрейт 80%+', ok: wr >= 80 },
    { icon: '💰', t: 'Первая прибыль', d: 'PnL > $0', ok: totalPnl > 0 },
    { icon: '🚀', t: '$1,000 профит', d: 'Общий PnL > $1,000', ok: totalPnl >= 1000 },
    { icon: '⚡', t: '$5,000 профит', d: 'Общий PnL > $5,000', ok: totalPnl >= 5000 },
    { icon: '🌟', t: '$10,000 профит', d: 'Общий PnL > $10,000', ok: totalPnl >= 10000 },
    { icon: '🔥', t: '5 подряд в плюс', d: 'Серия из 5 побед', ok: maxStreak >= 5 },
    { icon: '💪', t: '10 подряд в плюс', d: 'Серия из 10 побед', ok: maxStreak >= 10 },
    { icon: '📚', t: 'Студент', d: 'Прошёл 1 курс', ok: coursesDone >= 1 },
    { icon: '🎓', t: 'Выпускник', d: 'Все курсы пройдены', ok: totalLessons > 0 && doneLessons === totalLessons },
    { icon: '📊', t: 'Аналитик', d: '20+ сделок', ok: closed.length >= 20 },
    { icon: '🏅', t: 'PF 2.0+', d: 'Profit Factor > 2', ok: parseFloat(pf) >= 2 },
    { icon: '⭐', t: 'Лучший день', d: 'Одна сделка > $500', ok: bestTrade >= 500 },
  ]

  const handleSave = async () => {
    await updateProfileData({ name, bio })
    setEditing(false)
    toast('Профиль сохранён', 'success')
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressAvatar(file)
      await updateProfileData({ avatar: dataUrl })
      toast('Аватар обновлён', 'success')
    } catch { toast('Ошибка загрузки', 'error') }
  }

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressBanner(file)
      await updateProfileData({ banner: dataUrl })
      toast('Баннер обновлён', 'success')
    } catch { toast('Ошибка загрузки', 'error') }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 900 }}>
      <motion.div className="profile-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div
          className="profile-banner"
          style={profile?.banner ? { backgroundImage: `url(${profile.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          <input ref={bannerInput} type="file" accept="image/*" hidden onChange={handleBannerChange} />
          <motion.button
            className="profile-banner-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => bannerInput.current?.click()}
          >
            <CameraIcon size={16} />
            <span>{profile?.banner ? 'Изменить фон' : 'Добавить фон'}</span>
          </motion.button>
        </div>

        <div className="profile-info">
          <motion.div
            className="profile-avatar-wrap"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {profile?.avatar ? (
              <img src={profile.avatar} alt="" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar">{name[0]?.toUpperCase() || 'T'}</div>
            )}
            <input ref={avatarInput} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            <motion.button
              className="profile-avatar-btn"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => avatarInput.current?.click()}
            >
              <CameraIcon size={14} />
            </motion.button>
          </motion.div>

          <div className="profile-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1>{name}</h1>
              {profile?.premium && (
                <span className="badge-premium">⭐ Premium</span>
              )}
              {profile?.admin && (
                <span className="badge-admin">👑 Админ</span>
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
        <h2>Достижения <span className="ach-count">{achievements.filter(a => a.ok).length}/{achievements.length}</span></h2>
        <div className="ach-grid">
          {achievements.map((a, i) => (
            <motion.div
              key={a.t}
              className={`ach ${a.ok ? '' : 'ach-locked'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 200 }}
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
                  transition={{ type: 'spring', stiffness: 300, delay: 0.5 + i * 0.08 }}
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
