import { useState } from 'react'
import { motion } from 'motion/react'
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
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="progress-ring-text" style={{ fontSize: '0.55rem' }}>{pct}%</div>
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

  const filtered = usersProgress.filter(u => {
    if (search) {
      const q = search.toLowerCase()
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (selectedCourse) {
      const aPct = a.courses[selectedCourse]?.pct || 0
      const bPct = b.courses[selectedCourse]?.pct || 0
      return bPct - aPct
    }
    const aMax = Math.max(0, ...Object.values(a.courses).map(c => c.pct))
    const bMax = Math.max(0, ...Object.values(b.courses).map(c => c.pct))
    return bMax - aMax
  })

  const getOverallPct = (u: typeof usersProgress[0]) => {
    if (Object.keys(u.courses).length === 0) return 0
    const pcts = Object.values(u.courses).map(c => c.pct)
    return Math.round(pcts.reduce((a, p) => a + p, 0) / pcts.length)
  }

  const courseStats = courses.map(c => {
    const withProgress = usersProgress.filter(u => u.courses[c.id])
    const avgPct = withProgress.length > 0
      ? Math.round(withProgress.reduce((a, u) => a + (u.courses[c.id]?.pct || 0), 0) / withProgress.length)
      : 0
    const completed = withProgress.filter(u => (u.courses[c.id]?.pct || 0) >= 100).length
    return { ...c, enrolled: withProgress.length, avgPct, completed }
  })

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <button className="back" onClick={() => nav('/app/admin')}>← Назад</button>
        <h1 className="pg-title">Проходимость курсов</h1>
        <p className="pg-sub">{usersProgress.length} пользователей · {courses.length} курсов</p>
      </div>

      {/* ─── Course Overview Cards ─── */}
      {!loading && courseStats.length > 0 && (
        <motion.div className="admin-stats" style={{ gridTemplateColumns: `repeat(${Math.min(courseStats.length, 4)}, 1fr)` }} variants={stagger} initial="hidden" animate="show">
          {courseStats.map(c => (
            <motion.div
              key={c.id}
              className={`admin-stat admin-stat-clickable ${selectedCourse === c.id ? 'admin-stat-selected' : ''}`}
              variants={fadeUp}
              onClick={() => setSelectedCourse(selectedCourse === c.id ? null : c.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="admin-stat-icon">📚</div>
                <ProgressRing pct={c.avgPct} size={40} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)', marginTop: 8 }}>{c.title}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                {c.level} · {c.enrolled} enrolled · {c.completed} завершили
              </div>
              <div className="bar-wrap" style={{ marginTop: 8 }}>
                <div className="bar-fill" style={{ width: `${c.avgPct}%` }} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ─── Search ─── */}
      <div style={{ marginBottom: 20 }}>
        <input
          className="admin-search"
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {selectedCourse && (
          <span style={{ marginLeft: 12, fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 600 }}>
            Фильтр: {courses.find(c => c.id === selectedCourse)?.title}
            <button style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setSelectedCourse(null)}>✕</button>
          </span>
        )}
      </div>

      {/* ─── Users Table ─── */}
      {loading ? (
        <div className="admin-empty"><div className="admin-empty-icon">⏳</div>Загрузка прогресса...</div>
      ) : sorted.length === 0 ? (
        <div className="admin-empty"><div className="admin-empty-icon">📚</div>Нет данных о прогрессе</div>
      ) : (
        <div className="admin-section">
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
                {sorted.map(u => (
                  <tr key={u.uid} className="admin-table-row-clickable" onClick={() => nav(`/app/user/${u.uid}`)}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">{u.name[0]?.toUpperCase() || '?'}</div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── Mobile Cards ─── */}
          <div className="admin-mobile-cards" style={{ display: 'none' }}>
            {sorted.map(u => (
              <div key={u.uid} className="admin-post admin-card-clickable" onClick={() => nav(`/app/user/${u.uid}`)}>
                <div className="admin-post-header">
                  <div className="admin-user-cell">
                    <div className="admin-user-avatar">{u.name[0]?.toUpperCase() || '?'}</div>
                    <div>
                      <div className="admin-user-name">{u.name}</div>
                      <div className="admin-user-email">{u.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ProgressRing pct={getOverallPct(u)} size={36} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {courses.map(c => {
                    const pct = u.courses[c.id]?.pct || 0
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                        <div className="bar-wrap" style={{ flex: 1 }}>
                          <div className="bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, width: 32, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
