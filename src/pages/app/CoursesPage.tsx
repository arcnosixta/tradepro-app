import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useCourses, useUserProgress, type Course } from '../../hooks/useFirestore'
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
  const { progress } = useUserProgress(profile?.uid)
  const nav = useNavigate()
  const [filter, setFilter] = useState('all')
  const levels = ['all', 'Начинающий', 'Средний', 'Продвинутый']
  const filtered = filter === 'all' ? courses : courses.filter(c => c.level === filter)

  const getProg = (c: Course) => {
    const tot = c.modules.reduce((a, m) => a + m.lessons.length, 0)
    const dn = c.modules.reduce((a, m) => a + m.lessons.filter(l => (progress[c.id] || []).includes(l.id)).length, 0)
    return { tot, dn, pct: tot > 0 ? Math.round((dn / tot) * 100) : 0 }
  }

  if (loading) return <CoursesSkeleton />

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
          const isPremium = c.premium && !profile?.premium
          return (
            <motion.div
              key={c.id}
              className="course-card"
              variants={cardVariant}
              whileHover={!isPremium ? { y: -6, scale: 1.01 } : {}}
              whileTap={!isPremium ? { scale: 0.99 } : {}}
              onClick={() => {
                if (isPremium) {
                  nav('/app/profile')
                } else {
                  nav(`/app/course/${c.id}`)
                }
              }}
              style={{ opacity: isPremium ? 0.7 : 1, cursor: 'pointer' }}
            >
              <div className="cc-img-wrap">
                <img src={c.image} alt="" className="cc-img" />
                <div className="cc-overlay" />
                <span className={`lvl lvl-${c.level}`}>{c.level}</span>
                {isPremium && (
                  <span style={{
                    position: 'absolute', top: 'var(--sp-3)', left: 'var(--sp-3)',
                    fontSize: 'var(--text-xs)', fontWeight: 700,
                    padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    color: '#fff', zIndex: 1,
                  }}>⭐ Premium</span>
                )}
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
                  {isPremium ? (
                    <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 'var(--text-sm)' }}>🔒 Premium</span>
                  ) : (
                    <motion.button className="btn-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{dn > 0 ? 'Продолжить' : 'Начать'} →</motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
