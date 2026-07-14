import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useCourses, useUserProgress, useQuiz, useQuizResult } from '../../hooks/useFirestore'
import ProgressRing from '../../components/ui/ProgressRing'
import './pages.css'

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const nav = useNavigate()
  const { profile } = useAuth()
  const { courses } = useCourses()
  const { progress, toggleLesson } = useUserProgress(profile?.uid)
  const { quiz } = useQuiz(lessonId)
  const { result: quizResult } = useQuizResult(profile?.uid, quiz?.id)

  const course = courses.find(c => c.id === courseId)

  const allLessons = useMemo(() => {
    if (!course) return []
    return course.modules.flatMap(m => m.lessons)
  }, [course])

  const lessonIndex = allLessons.findIndex(l => l.id === lessonId)
  const lesson = allLessons[lessonIndex]
  const prev = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null
  const next = lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null

  const { pct } = useMemo(() => {
    if (!course) return { tot: 0, dn: 0, pct: 0 }
    const tot = allLessons.length
    const dn = allLessons.filter(l => (progress[course.id] || []).includes(l.id)).length
    return { tot, dn, pct: tot > 0 ? Math.round((dn / tot) * 100) : 0 }
  }, [course, allLessons, progress])

  if (!course || !lesson) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>📖</div>
        <div>Урок не найден</div>
        <button className="back" onClick={() => nav('/app/courses')} style={{ marginTop: 16 }}>← К списку курсов</button>
      </div>
    )
  }

  const done = (progress[course.id] || []).includes(lesson.id)

  const handleComplete = async () => {
    await toggleLesson(course.id, lesson.id)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <button className="back" onClick={() => nav(`/app/course/${courseId}`)}>← К урокам: {course.title}</button>

      <motion.div className="player" initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}>
        <div className="player-placeholder">
          <div className="player-content">
            <motion.div style={{ fontSize: '3rem', marginBottom: 12 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
              {lesson.type === 'video' ? '🎬' : lesson.type === 'quiz' ? '❓' : '📖'}
            </motion.div>
            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{lesson.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: 4 }}>
              {lesson.duration} · {lesson.type === 'video' ? 'Видеоурок' : lesson.type === 'quiz' ? 'Тест' : 'Текстовый урок'}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div className="lesson-info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2>{lesson.title}</h2>
            <div className="lesson-meta">
              <span className="tag">{lesson.type === 'video' ? '🎬 Видео' : lesson.type === 'quiz' ? '❓ Тест' : '📖 Текст'}</span>
              <span>{lesson.duration}</span>
              <span>Урок {lessonIndex + 1} из {allLessons.length}</span>
            </div>
          </div>
          <ProgressRing pct={pct} />
        </div>

        <div className="lesson-body">
          <p>Контент урока будет здесь — видео, текст или тест. Адаптируем под TG Mini App.</p>
        </div>

        <div className="lesson-actions">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {prev && (
              <button className="btn-outline" onClick={() => nav(`/app/course/${courseId}/lesson/${prev.id}`)}>
                ← Предыдущий
              </button>
            )}
            {next && (
              <button className="btn-outline" onClick={() => nav(`/app/course/${courseId}/lesson/${next.id}`)}>
                Следующий →
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              style={{
                background: done ? 'var(--bg)' : undefined,
                color: done ? 'var(--accent)' : undefined,
                border: done ? '1px solid var(--accent)' : undefined,
              }}
            >
              {done ? '✓ Пройдено' : 'Отметить пройденным'}
            </motion.button>

            {lesson.type === 'quiz' && (
              quiz ? (
                <motion.button
                  className="btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => nav(`/app/quiz/${quiz.id}`)}
                  style={{
                    background: quizResult?.passed ? '#22c55e' : quizResult ? '#f59e0b' : 'var(--accent)',
                    color: '#fff',
                  }}
                >
                  {quizResult?.passed ? '✓ Тест пройден' : quizResult ? '🔄 Пересдать тест' : '📝 Пройти тест'}
                </motion.button>
              ) : (
                <span style={{
                  padding: 'var(--sp-3) var(--sp-5)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                  ❓ Тест пока не добавлен
                </span>
              )
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
