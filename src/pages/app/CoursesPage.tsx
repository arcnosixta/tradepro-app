import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useCourses, useUserProgress, type Course, type Lesson } from '../../hooks/useFirestore'
import Skeleton, { SkeletonCourseCard } from '../../components/ui/Skeleton'
import ProgressRing from '../../components/ui/ProgressRing'
import './pages.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const cardVariant = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }

function CoursesSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}><Skeleton variant="text" width="50%" height={28} /><Skeleton variant="text" width="35%" height={14} /></div>
      <div className="courses-grid">{Array.from({ length: 3 }).map((_, i) => <SkeletonCourseCard key={i} />)}</div>
    </div>
  )
}

export default function CoursesPage() {
  const { profile } = useAuth()
  const { courses, loading } = useCourses()
  const { progress, toggleLesson } = useUserProgress(profile?.uid)
  const [sel, setSel] = useState<Course | null>(null)
  const [les, setLes] = useState<Lesson | null>(null)
  const [filter, setFilter] = useState('all')
  const levels = ['all', 'Начинающий', 'Средний', 'Продвинутый']
  const filtered = filter === 'all' ? courses : courses.filter(c => c.level === filter)

  const getProg = (c: Course) => {
    const tot = c.modules.reduce((a, m) => a + m.lessons.length, 0)
    const dn = c.modules.reduce((a, m) => a + m.lessons.filter(l => (progress[c.id] || []).includes(l.id)).length, 0)
    return { tot, dn, pct: tot > 0 ? Math.round((dn / tot) * 100) : 0 }
  }

  if (loading) return <CoursesSkeleton />

  if (les && sel) {
    const done = (progress[sel.id] || []).includes(les.id)
    const allLessons = sel.modules.flatMap(m => m.lessons)
    const lesIdx = allLessons.findIndex(l => l.id === les.id)
    const prev = lesIdx > 0 ? allLessons[lesIdx - 1] : null
    const next = lesIdx < allLessons.length - 1 ? allLessons[lesIdx + 1] : null

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button className="back" onClick={() => setLes(null)}>← К урокам: {sel.title}</button>
        <motion.div className="player" initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="player-placeholder">
            <div className="player-content">
              <motion.div style={{ fontSize: '3rem', marginBottom: 12 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
                {les.type === 'video' ? '🎬' : les.type === 'quiz' ? '❓' : '📖'}
              </motion.div>
              <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{les.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: 4 }}>{les.duration} · {les.type === 'video' ? 'Видеоурок' : les.type === 'quiz' ? 'Тест' : 'Текстовый урок'}</div>
            </div>
          </div>
        </motion.div>

        <motion.div className="lesson-info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2>{les.title}</h2>
              <div className="lesson-meta">
                <span className="tag">{les.type === 'video' ? '🎬 Видео' : les.type === 'quiz' ? '❓ Тест' : '📖 Текст'}</span>
                <span>{les.duration}</span>
                <span>Урок {lesIdx + 1} из {allLessons.length}</span>
              </div>
            </div>
            <ProgressRing pct={getProg(sel).pct} />
          </div>

          <div className="lesson-body">
            <p>Контент урока будет здесь — видео, текст или тест. Адаптируем под TG Mini App.</p>
          </div>

          <div className="lesson-actions">
            <div style={{ display: 'flex', gap: 8 }}>
              {prev && <button className="btn-outline" onClick={() => setLes(prev)}>← Предыдущий</button>}
              {next && <button className="btn-outline" onClick={() => setLes(next)}>Следующий →</button>}
            </div>
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleLesson(sel.id, les.id)}
              style={{ background: done ? 'var(--bg)' : undefined, color: done ? 'var(--accent)' : undefined, border: done ? '1px solid var(--accent)' : undefined }}
            >
              {done ? '✓ Пройдено' : 'Отметить пройденным'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (sel) {
    const { tot, dn, pct } = getProg(sel)
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button className="back" onClick={() => setSel(null)}>← К списку курсов</button>
        <motion.div className="course-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <img src={sel.image} alt="" className="course-hero-img" />
          <div className="course-hero-info">
            <span className={`lvl lvl-${sel.level}`}>{sel.level}</span>
            <h1>{sel.title}</h1>
            <p>{sel.description}</p>
            <div className="course-stats"><span>📚 {tot} уроков</span><span>⏱ {sel.duration}</span><span>✅ {dn}/{tot}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
              <div className="bar-wrap" style={{ flex: 1, height: 10 }}><motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }} /></div>
              <ProgressRing pct={pct} size={52} />
            </div>
          </div>
        </motion.div>

        <motion.div className="modules" variants={stagger} initial="hidden" animate="show">
          {sel.modules.map((mod) => {
            const modDone = mod.lessons.filter(l => (progress[sel.id] || []).includes(l.id)).length
            return (
              <motion.div key={mod.id} className="mod-card" variants={cardVariant}>
                <div className="mod-head">
                  <h3>{mod.title}</h3>
                  <span className="muted">{modDone}/{mod.lessons.length} уроков</span>
                </div>
                <div className="lessons">
                  {mod.lessons.map((l, li) => {
                    const d = (progress[sel.id] || []).includes(l.id)
                    return (
                      <motion.div
                        key={l.id}
                        className={`les-item ${d ? 'les-done' : ''}`}
                        onClick={() => setLes(l)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + li * 0.05, duration: 0.3 }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>{d ? '✅' : '⬜'}</span>
                        <div className="les-info">
                          <div className="les-title">{l.title}</div>
                          <div className="les-meta">{l.type === 'video' ? '🎬' : l.type === 'quiz' ? '❓' : '📖'} {l.duration}</div>
                        </div>
                        <span className="muted">→</span>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h1 className="pg-title">Курсы трейдинга</h1>
      <p className="pg-sub">Структурированное обучение от основ до продвинутых стратегий</p>
      <div className="filters">
        {levels.map(l => (
          <motion.button key={l} className={`filter-btn ${filter === l ? 'filter-active' : ''}`} onClick={() => setFilter(l)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            {l === 'all' ? 'Все' : l}
          </motion.button>
        ))}
      </div>
      <motion.div className="courses-grid" variants={stagger} initial="hidden" animate="show">
        {filtered.map(c => {
          const { tot, dn, pct } = getProg(c)
          return (
            <motion.div key={c.id} className="course-card" variants={cardVariant} layout whileHover={{ y: -6, scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setSel(c)}>
              <div className="cc-img-wrap">
                <img src={c.image} alt="" className="cc-img" />
                <div className="cc-overlay" />
                <span className={`lvl lvl-${c.level}`}>{c.level}</span>
                <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 2 }}>
                  <ProgressRing pct={pct} />
                </div>
              </div>
              <div className="cc-body">
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <div className="cc-meta"><span>📚 {tot} уроков</span><span>⏱ {c.duration}</span></div>
                <div className="bar-wrap" style={{ marginTop: 12 }}><motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.5 }} /></div>
                <div className="cc-foot">
                  <span>{dn}/{tot} пройдено · {pct}%</span>
                  <motion.button className="btn-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{dn > 0 ? 'Продолжить' : 'Начать'} →</motion.button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
