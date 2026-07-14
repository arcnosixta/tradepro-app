import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useUserPosts, useTrades, useCourses, useUserProgress } from '../../hooks/useFirestore'
import { useAuth } from '../../context/AuthContext'
import { useAdmin } from '../../hooks/useAdmin'
import { SkeletonPost } from '../../components/ui/Skeleton'
import ProgressRing from '../../components/ui/ProgressRing'
import timeAgo from '../../utils/timeAgo'
import './pages.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }

interface UserData {
  uid: string
  name: string
  email: string
  avatar: string
  banner: string
  bio: string
  joinedAt: string
  admin?: boolean
  banned?: boolean
}

export default function UserPage() {
  const { uid } = useParams<{ uid: string }>()
  const { profile } = useAuth()
  const { isAdmin } = useAdmin()
  const { posts, loading: postsLoading } = useUserPosts(uid || null)
  const { trades, loading: tradesLoading } = useTrades(uid || undefined)
  const { courses } = useCourses()
  const { progress } = useUserProgress(uid || undefined)
  const nav = useNavigate()

  const [userData, setUserData] = useState<UserData | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setUserLoading(false); return }
    getDoc(doc(db, 'users', uid)).then(snap => {
      if (snap.exists()) setUserData(snap.data() as UserData)
      setUserLoading(false)
    }).catch(() => setUserLoading(false))
  }, [uid])

  const isOwn = profile?.uid === uid
  const showFull = isAdmin || isOwn

  const closed = trades.filter(t => t.status === 'closed')
  const totalPnl = closed.reduce((a, t) => a + t.pnl, 0)
  const wins = closed.filter(t => t.pnl > 0).length
  const wr = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0
  const avgW = wins > 0 ? closed.filter(t => t.pnl > 0).reduce((a, t) => a + t.pnl, 0) / wins : 0
  const lossN = closed.length - wins
  const avgL = lossN > 0 ? closed.filter(t => t.pnl < 0).reduce((a, t) => a + t.pnl, 0) / lossN : 0
  const pf = avgL !== 0 ? Math.abs(avgW / avgL).toFixed(2) : '∞'

  const getCourseProg = (courseId: string) => {
    const course = courses.find(c => c.id === courseId)
    if (!course) return null
    const total = course.modules.reduce((a, m) => a + m.lessons.length, 0)
    const completed = (progress[courseId] || []).length
    return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const loading = userLoading || postsLoading || tradesLoading
  const authorName = userData?.name || posts[0]?.authorName || 'Пользователь'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 900 }}>
      <button className="back" onClick={() => nav(-1)}>← Назад</button>

      {/* ─── Profile Card ─── */}
      <motion.div className="profile-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 24 }}>
        <div
          className="profile-banner"
          style={{
            height: 120,
            ...(userData?.banner ? { backgroundImage: `url(${userData.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})
          }}
        />
        <div style={{ display: 'flex', gap: 16, padding: '0 24px 24px', marginTop: -40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <motion.div
            className="profile-avatar-wrap"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {userData?.avatar ? (
              <img src={userData.avatar} alt="" className="profile-avatar-img" style={{ width: 80, height: 80 }} />
            ) : (
              <div className="profile-avatar" style={{ width: 80, height: 80, fontSize: '1.8rem' }}>
                {authorName[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </motion.div>
          <div style={{ flex: 1, paddingTop: 44 }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)' }}>
              {authorName}
              {userData?.admin && <span className="admin-badge admin-badge-admin" style={{ marginLeft: 8, verticalAlign: 'middle' }}>👑 Админ</span>}
              {userData?.banned && <span className="admin-badge admin-badge-banned" style={{ marginLeft: 8, verticalAlign: 'middle' }}>🚫 Забанен</span>}
            </h1>
            <p className="muted" style={{ fontSize: '0.85rem' }}>{userData?.email}</p>
            {userData?.bio && <p className="muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>{userData.bio}</p>}
            {userData?.joinedAt && (
              <p className="muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                📅 {new Date(userData.joinedAt).toLocaleDateString('ru', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          {isOwn && (
            <motion.button className="btn-outline" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => nav('/app/profile')} style={{ marginTop: 44, flexShrink: 0 }}>
              ✏️ Редактировать
            </motion.button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonPost key={i} />)}
        </div>
      ) : (
        <>
          {/* ─── Trading Stats (full dashboard) ─── */}
          {showFull && closed.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Трейдинг</h2>
              <div className="pstats">
                {[
                  { l: 'Общий PnL', v: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`, c: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
                  { l: 'Винрейт', v: `${wr}%`, c: 'var(--accent)' },
                  { l: 'Сделок', v: String(closed.length), c: 'var(--text)' },
                  { l: 'Profit Factor', v: pf, c: 'var(--accent-2)' },
                  { l: 'Ср. прибыль', v: `+$${Math.round(avgW)}`, c: '#22c55e' },
                  { l: 'Ср. убыток', v: `$${Math.round(avgL)}`, c: '#ef4444' },
                ].map(s => (
                  <div key={s.l} className="ps">
                    <div className="ps-l">{s.l}</div>
                    <div className="ps-v" style={{ color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Последние сделки</h3>
              <div className="tbl-card">
                <div className="tbl">
                  <div className="tbl-h">
                    <span>Пара</span><span>Тип</span><span>Вход</span><span>Выход</span><span>PnL</span><span>%</span><span>Дата</span>
                  </div>
                  {closed.slice(0, 10).map(t => (
                    <div key={t.id} className="tbl-r">
                      <span className="pair">{t.symbol}</span>
                      <span style={{ color: t.type === 'LONG' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{t.type}</span>
                      <span>${t.entryPrice.toLocaleString()}</span>
                      <span>${t.exitPrice.toLocaleString()}</span>
                      <span style={{ color: t.pnl >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{t.pnl >= 0 ? '+' : ''}${t.pnl.toLocaleString()}</span>
                      <span style={{ color: t.pnlPercent >= 0 ? '#22c55e' : '#ef4444' }}>{t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(1)}%</span>
                      <span className="muted" style={{ fontSize: '0.75rem' }}>{t.closedAt ? new Date(t.closedAt).toLocaleDateString('ru') : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Course Progress ─── */}
          {showFull && courses.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Прогресс по курсам</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {courses.map(c => {
                  const prog = getCourseProg(c.id)
                  if (!prog) return null
                  return (
                    <div key={c.id} className="user-course-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <ProgressRing pct={prog.pct} size={40} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)' }}>{c.title}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            {prog.completed}/{prog.total} уроков · {c.level}
                          </div>
                        </div>
                      </div>
                      <div className="bar-wrap" style={{ width: 120 }}>
                        <div className="bar-fill" style={{ width: `${prog.pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ─── Posts ─── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Публикации ({posts.length})</h2>
            {posts.length === 0 ? (
              <div className="empty" style={{ padding: '48px 0' }}>Пока нет публикаций</div>
            ) : (
              <motion.div className="posts" variants={stagger} initial="hidden" animate="show">
                {posts.map(post => (
                  <motion.div key={post.id} className="post-card" variants={fadeUp}>
                    <div className="post-head">
                      <div className="post-av">
                        {post.authorAvatar ? <img src={post.authorAvatar} alt="" /> : authorName[0]?.toUpperCase() || 'U'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="post-name">{authorName}</div>
                        <div className="muted" style={{ fontSize: '0.75rem' }}>{post.createdAt?.seconds ? timeAgo(post.createdAt) : ''}</div>
                      </div>
                    </div>
                    <div className="post-body">{post.content}</div>
                    {post.image && <div className="post-img-wrap"><img src={post.image} alt="" className="post-img" loading="lazy" /></div>}
                    {post.tags.length > 0 && <div className="post-tags">{post.tags.map(t => <span key={t} className="post-tag">#{t}</span>)}</div>}
                    <div className="post-foot">
                      <span className="post-act">❤️ {post.likes}</span>
                      <span className="post-act">💬 {post.comments}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
