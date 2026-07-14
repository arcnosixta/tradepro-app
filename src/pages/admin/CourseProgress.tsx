import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useCourses, useAllUsersProgress } from '../../hooks/useFirestore'
import './admin.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } } }

function ProgressRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r, off = c - (pct / 100) * c
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="progress-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={4} />
        <motion.circle
          className="progress-ring-fill" cx={size / 2} cy={size / 2} r={r}
          strokeDasharray={c} strokeWidth={4}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="progress-ring-text" style={{ fontSize: '0.55rem' }}>{pct}%</div>
    </div>
  )
}

function UserAvatar({ name, avatar, size = 36 }: { name: string; avatar: string; size?: number }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        style={{ width: size, height: size, borderRadius: 'var(--radius)', objectFit: 'cover', border: '2px solid var(--border)' }}
      />
    )
  }
  return (
    <div
      className="admin-user-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name[0]?.toUpperCase() || '?'}
    </div>
  )
}

export default function CourseProgress() {
  const { courses, loading: coursesLoading } = useCourses()
  const { usersProgress, loading: progressLoading } = useAllUsersProgress(courses)
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  const loading = coursesLoading || progressLoading

  const filtered = useMemo(() => usersProgress.filter(u => {
    if (search) {
      const q = search.toLowerCase()
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
    }
    return true
  }), [usersProgress, search])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (selectedCourse) {
      const aPct = a.courses[selectedCourse]?.pct || 0
      const bPct = b.courses[selectedCourse]?.pct || 0
      return bPct - aPct
    }
    const aMax = Math.max(0, ...Object.values(a.courses).map(c => c.pct))
    const bMax = Math.max(0, ...Object.values(b.courses).map(c => c.pct))
    return bMax - aMax
  }), [filtered, selectedCourse])

  const getOverallPct = (u: typeof usersProgress[0]) => {
    if (Object.keys(u.courses).length === 0) return 0
    const pcts = Object.values(u.courses).map(c => c.pct)
    return Math.round(pcts.reduce((a, p) => a + p, 0) / pcts.length)
  }

  const courseStats = useMemo(() => courses.map(c => {
    const withProgress = usersProgress.filter(u => u.courses[c.id])
    const avgPct = withProgress.length > 0
      ? Math.round(withProgress.reduce((a, u) => a + (u.courses[c.id]?.pct || 0), 0) / withProgress.length)
      : 0
    const completed = withProgress.filter(u => (u.courses[c.id]?.pct || 0) >= 100).length
    const inProgress = withProgress.filter(u => {
      const p = u.courses[c.id]?.pct || 0
      return p > 0 && p < 100
    }).length
    return { ...c, enrolled: withProgress.length, avgPct, completed, inProgress }
  }), [courses, usersProgress])

  const totalEnrolled = useMemo(() => {
    const unique = new Set<string>()
    usersProgress.forEach(u => Object.keys(u.courses).forEach(cId => unique.add(`${u.uid}-${cId}`)))
    return unique.size
  }, [usersProgress])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <button className="back" onClick={() => nav('/app/admin')}>← Назад</button>
        <h1 className="pg-title">Проходимость курсов</h1>
        <p className="pg-sub">{usersProgress.length} пользователей · {courses.length} курсов · {totalEnrolled} записей</p>
      </div>

      {/* ─── Summary Stats ─── */}
      {!loading && (
        <motion.div className="admin-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }} variants={stagger} initial="hidden" animate="show">
          <motion.div className="admin-stat" variants={fadeUp}>
            <div className="admin-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.12)' }}>👥</div>
            <div className="admin-stat-value" style={{ color: 'var(--accent)' }}>{usersProgress.length}</div>
            <div className="admin-stat-label">Пользователей</div>
          </motion.div>
          <motion.div className="admin-stat" variants={fadeUp}>
            <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)' }}>📚</div>
            <div className="admin-stat-value" style={{ color: '#22c55e' }}>{totalEnrolled}</div>
            <div className="admin-stat-label">Записей на курсы</div>
          </motion.div>
          <motion.div className="admin-stat" variants={fadeUp}>
            <div className="admin-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.12)' }}>✅</div>
            <div className="admin-stat-value" style={{ color: '#06b6d4' }}>
              {courseStats.reduce((a, c) => a + c.completed, 0)}
            </div>
            <div className="admin-stat-label">Завершений</div>
          </motion.div>
          <motion.div className="admin-stat" variants={fadeUp}>
            <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)' }}>📊</div>
            <div className="admin-stat-value" style={{ color: '#f59e0b' }}>
              {courseStats.length > 0 ? Math.round(courseStats.reduce((a, c) => a + c.avgPct, 0) / courseStats.length) : 0}%
            </div>
            <div className="admin-stat-label">Средний прогресс</div>
          </motion.div>
        </motion.div>
      )}

      {/* ─── Course Cards ─── */}
      {!loading && courseStats.length > 0 && (
        <motion.div
          className="admin-stats"
          style={{ gridTemplateColumns: `repeat(${Math.min(courseStats.length, 4)}, 1fr)` }}
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {courseStats.map((c, i) => (
            <motion.div
              key={c.id}
              className={`admin-stat admin-stat-clickable ${selectedCourse === c.id ? 'admin-stat-selected' : ''}`}
              variants={fadeUp}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCourse(selectedCourse === c.id ? null : c.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="admin-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.12)' }}>📖</div>
                <ProgressRing pct={c.avgPct} size={44} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)', marginTop: 10 }}>{c.title}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
                {c.level}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--accent)' }}>{c.enrolled} записей</span>
                <span style={{ color: '#22c55e' }}>{c.completed} завершили</span>
                <span style={{ color: '#f59e0b' }}>{c.inProgress} в процессе</span>
              </div>
              <div className="bar-wrap" style={{ marginTop: 10 }}>
                <motion.div
                  className="bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${c.avgPct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ─── Search ─── */}
      <motion.div
        style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <input
          className="admin-search"
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <AnimatePresence>
          {selectedCourse && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {courses.find(c => c.id === selectedCourse)?.title}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}
                onClick={() => setSelectedCourse(null)}
              >✕</motion.button>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Users List ─── */}
      {loading ? (
        <motion.div className="admin-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="admin-empty-icon">⏳</div>
          <div>Загрузка прогресса...</div>
        </motion.div>
      ) : sorted.length === 0 ? (
        <motion.div className="admin-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="admin-empty-icon">📚</div>
          <div>Нет данных о прогрессе</div>
        </motion.div>
      ) : (
        <motion.div className="admin-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          {/* ─── Desktop Table ─── */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  {selectedCourse ? (
                    <>
                      <th>Прогресс</th>
                      <th>Уроки</th>
                      <th>Статус</th>
                    </>
                  ) : (
                    courses.map(c => (
                      <th key={c.id} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setSelectedCourse(c.id)}>
                        {c.title.length > 15 ? c.title.slice(0, 15) + '...' : c.title}
                      </th>
                    ))
                  )}
                  <th>Общий</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sorted.map((u, i) => (
                    <motion.tr
                      key={u.uid}
                      className="admin-table-row-clickable"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ delay: i * 0.02, duration: 0.3 }}
                      onClick={() => nav(`/app/user/${u.uid}`)}
                      whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.04)' }}
                    >
                      <td>
                        <div className="admin-user-cell">
                          <UserAvatar name={u.name} avatar={u.avatar} size={36} />
                          <div>
                            <div className="admin-user-name">{u.name}</div>
                            <div className="admin-user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      {selectedCourse ? (
                        <>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <ProgressRing pct={u.courses[selectedCourse]?.pct || 0} size={32} />
                              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{u.courses[selectedCourse]?.pct || 0}%</span>
                            </div>
                          </td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            {u.courses[selectedCourse]?.completed || 0}/{u.courses[selectedCourse]?.total || 0}
                          </td>
                          <td>
                            {(u.courses[selectedCourse]?.pct || 0) >= 100 ? (
                              <span className="admin-badge admin-badge-new">✅ Завершён</span>
                            ) : (u.courses[selectedCourse]?.pct || 0) > 0 ? (
                              <span className="admin-badge admin-badge-admin">📖 В процессе</span>
                            ) : (
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Не начат</span>
                            )}
                          </td>
                        </>
                      ) : (
                        courses.map(c => {
                          const pct = u.courses[c.id]?.pct || 0
                          return (
                            <td key={c.id} style={{ textAlign: 'center' }}>
                              {pct > 0 ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <ProgressRing pct={pct} size={28} />
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>—</span>
                              )}
                            </td>
                          )
                        })
                      )}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ProgressRing pct={getOverallPct(u)} size={32} />
                          <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>{getOverallPct(u)}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* ─── Mobile Cards ─── */}
          <div className="admin-mobile-cards">
            <motion.div variants={stagger} initial="hidden" animate="show">
              {sorted.map((u, i) => (
                <motion.div
                  key={u.uid}
                  className="admin-post admin-card-clickable"
                  variants={fadeUp}
                  whileHover={{ y: -2 }}
                  onClick={() => nav(`/app/user/${u.uid}`)}
                >
                  <div className="admin-post-header">
                    <div className="admin-user-cell">
                      <UserAvatar name={u.name} avatar={u.avatar} size={40} />
                      <div>
                        <div className="admin-user-name">{u.name}</div>
                        <div className="admin-user-email">{u.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ProgressRing pct={getOverallPct(u)} size={40} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {courses.map(c => {
                      const pct = u.courses[c.id]?.pct || 0
                      return (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                          <div className="bar-wrap" style={{ flex: 1 }}>
                            <motion.div
                              className="bar-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease }}
                            />
                          </div>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, width: 32, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
