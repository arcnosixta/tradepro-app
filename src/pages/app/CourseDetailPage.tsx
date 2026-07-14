import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useCourses, useUserProgress, useAllQuizResults } from '../../hooks/useFirestore'
import ProgressRing from '../../components/ui/ProgressRing'
import './pages.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { profile } = useAuth()
  const { courses } = useCourses()
  const { progress } = useUserProgress(profile?.uid)
  const { results: quizResults } = useAllQuizResults(profile?.uid)

  const course = courses.find(c => c.id === id)

  const allLessons = useMemo(() => {
    if (!course) return []
    return course.modules.flatMap(m => m.lessons)
  }, [course])

  const getLessonUnlockStatus = (lessonIndex: number): 'unlocked' | 'locked' | 'completed' => {
    if (!course) return 'locked'
    const lessonId = allLessons[lessonIndex]?.id
    if (!lessonId) return 'locked'

    const isCompleted = (progress[course.id] || []).includes(lessonId)
    if (isCompleted) return 'completed'

    if (lessonIndex === 0) return 'unlocked'

    const prevLesson = allLessons[lessonIndex - 1]
    if (!prevLesson) return 'unlocked'

    const prevQuiz = Object.values(quizResults).find(r => {
      const quizForPrev = allLessons[lessonIndex - 1]
      return r.passed && quizForPrev?.id === prevLesson.id
    })

    if (prevQuiz) return 'unlocked'

    const prevLessonCompleted = (progress[course.id] || []).includes(prevLesson.id)
    if (prevLessonCompleted && !prevLesson.id) return 'unlocked'

    return 'locked'
  }

  const { tot, dn, pct } = useMemo(() => {
    if (!course) return { tot: 0, dn: 0, pct: 0 }
    const tot = allLessons.length
    const dn = allLessons.filter(l => (progress[course.id] || []).includes(l.id)).length
    return { tot, dn, pct: tot > 0 ? Math.round((dn / tot) * 100) : 0 }
  }, [course, allLessons, progress])

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>📚</div>
        <div>Курс не найден</div>
        <button className="back" onClick={() => nav('/app/courses')} style={{ marginTop: 16 }}>← К списку курсов</button>
      </div>
    )
  }

  const isPremiumLocked = course.premium && !profile?.premium

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <button className="back" onClick={() => nav('/app/courses')}>← К списку курсов</button>

      <motion.div className="course-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <img src={course.image} alt="" className="course-hero-img" />
        <div className="course-hero-info">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`lvl lvl-${course.level}`}>{course.level}</span>
            {course.premium && (
              <span style={{
                fontSize: 'var(--text-xs)', fontWeight: 700,
                padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                color: '#fff',
              }}>⭐ Premium</span>
            )}
          </div>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="course-stats">
            <span>📚 {tot} уроков</span>
            <span>⏱ {course.duration}</span>
            <span>✅ {dn}/{tot}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <div className="bar-wrap" style={{ flex: 1, height: 10 }}>
              <motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }} />
            </div>
            <ProgressRing pct={pct} size={52} />
          </div>
        </div>
      </motion.div>

      {isPremiumLocked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--sp-6)',
            textAlign: 'center', marginBottom: 'var(--sp-5)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
          <h3 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 8 }}>Premium курс</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
            Этот курс доступен только для Premium пользователей.
          </p>
          <button
            className="btn-sm"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff' }}
            onClick={() => nav('/app/profile')}
          >
            Узнать больше →
          </button>
        </motion.div>
      )}

      <motion.div className="modules" variants={stagger} initial="hidden" animate="show">
        {course.modules.map((mod) => {
          const modLessonStartIdx = allLessons.findIndex(l => l.id === mod.lessons[0]?.id)
          const modDone = mod.lessons.filter(l => (progress[course.id] || []).includes(l.id)).length
          return (
            <motion.div key={mod.id} className="mod-card" variants={fadeUp}>
              <div className="mod-head">
                <h3>{mod.title}</h3>
                <span className="muted">{modDone}/{mod.lessons.length} уроков</span>
              </div>
              <div className="lessons">
                {mod.lessons.map((l, li) => {
                  const globalIdx = modLessonStartIdx + li
                  const status = getLessonUnlockStatus(globalIdx)
                  const isLocked = status === 'locked' && !isPremiumLocked

                  return (
                    <motion.div
                      key={l.id}
                      className={`les-item ${status === 'completed' ? 'les-done' : ''}`}
                      onClick={() => {
                        if (!isLocked && !isPremiumLocked) {
                          nav(`/app/course/${course.id}/lesson/${l.id}`)
                        }
                      }}
                      whileHover={!isLocked && !isPremiumLocked ? { x: 4 } : {}}
                      whileTap={!isLocked && !isPremiumLocked ? { scale: 0.98 } : {}}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isLocked ? 0.4 : 1, x: 0 }}
                      transition={{ delay: 0.3 + li * 0.05, duration: 0.3 }}
                      style={{ cursor: isLocked || isPremiumLocked ? 'not-allowed' : 'pointer' }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>
                        {status === 'completed' ? '✅' : status === 'unlocked' ? '🔓' : '🔒'}
                      </span>
                      <div className="les-info">
                        <div className="les-title">{l.title}</div>
                        <div className="les-meta">
                          {l.type === 'video' ? '🎬' : l.type === 'quiz' ? '❓' : '📖'} {l.duration}
                          {isLocked && <span style={{ marginLeft: 8, color: '#f59e0b' }}>🔒 Пройдите предыдущий тест</span>}
                        </div>
                      </div>
                      {!isLocked && !isPremiumLocked && <span className="muted">→</span>}
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
