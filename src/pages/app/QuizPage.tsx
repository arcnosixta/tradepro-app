import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useQuizById, useQuizResult, submitQuiz } from '../../hooks/useFirestore'
import type { QuizResult } from '../../types'
import './pages.css'



export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const nav = useNavigate()
  const { profile } = useAuth()
  const { quiz: quizData, loading: quizLoading } = useQuizById(quizId)
  const { loading: resultLoading } = useQuizResult(profile?.uid, quizId)

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(-1)

  useEffect(() => {
    if (!quizData) return
    setTimeLeft(quizData.questions.length * 60)
  }, [quizData])

  useEffect(() => {
    if (timeLeft <= 0 || submitted) return
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, submitted])

  useEffect(() => {
    if (timeLeft === 0 && !submitted && quizData && quizData.questions.length > 0) {
      handleSubmit()
    }
  }, [timeLeft, submitted, quizData])

  if (quizLoading || resultLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
        <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    )
  }

  if (!quizData) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>❓</div>
        <div>Тест не найден</div>
        <button className="back" onClick={() => nav(-1)} style={{ marginTop: 16 }}>← Назад</button>
      </div>
    )
  }

  const questions = quizData.questions
  const q = questions[currentQ]
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQ]: value }))
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const r = await submitQuiz(profile!.uid, quizId!, answers, questions, quizData.passScore)
      setResult(r)
      setSubmitted(true)
    } catch (err) {
      console.error('Submit quiz error:', err)
    }
    setSubmitting(false)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (submitted && result) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600, margin: '0 auto' }}>
        <button className="back" onClick={() => nav(-1)}>← Назад к уроку</button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--sp-8)',
            textAlign: 'center', marginTop: 'var(--sp-5)',
          }}
        >
          <motion.div
            style={{ fontSize: '4rem', marginBottom: 16 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            {result.passed ? '🎉' : '😔'}
          </motion.div>

          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            {result.passed ? 'Тест пройден!' : 'Тест не пройден'}
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>
            {result.passed
              ? `Отлично! Вы набрали ${result.score}% (минимум ${quizData.passScore}%)`
              : `Вы набрали ${result.score}%, а нужно ${quizData.passScore}%. Попробуйте ещё раз.`}
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 120, height: 120, borderRadius: '50%',
            background: result.passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `3px solid ${result.passed ? '#22c55e' : '#ef4444'}`,
            marginBottom: 24,
          }}>
            <span style={{
              fontSize: '2rem', fontWeight: 800,
              color: result.passed ? '#22c55e' : '#ef4444',
            }}>
              {result.score}%
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => nav(-1)}>
              {result.passed ? 'Продолжить →' : 'Вернуться к уроку'}
            </button>
            {!result.passed && (
              <button
                className="btn-outline"
                onClick={() => { setSubmitted(false); setResult(null); setCurrentQ(0); setAnswers({}); setTimeLeft(questions.length * 60) }}
              >
                🔄 Пройти заново
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600, margin: '0 auto' }}>
      <button className="back" onClick={() => nav(-1)}>← Назад к уроку</button>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--sp-5)',
        marginBottom: 'var(--sp-5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)' }}>
            Тест · Вопрос {currentQ + 1}/{questions.length}
          </h2>
          <span style={{
            fontSize: 'var(--text-sm)', fontWeight: 700,
            color: timeLeft < 60 ? '#ef4444' : 'var(--text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>

        <div className="bar-wrap" style={{ height: 6 }}>
          <motion.div className="bar-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--sp-6)',
          }}
        >
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
          }}>
            {q.type === 'choice' ? 'Выберите ответ' : 'Введите ответ'}
          </div>

          <h3 style={{
            fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)',
            marginBottom: 24, lineHeight: 1.4,
          }}>
            {q.question}
          </h3>

          {q.type === 'choice' && q.options ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i)
                const isSelected = answers[currentQ] === opt
                return (
                  <motion.button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 'var(--sp-3) var(--sp-4)',
                      background: isSelected ? 'var(--accent-glow)' : 'var(--bg)',
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer', textAlign: 'left',
                      color: 'var(--text)', fontSize: 'var(--text-sm)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{
                      width: 32, height: 32, borderRadius: 'var(--radius)',
                      background: isSelected ? 'var(--accent)' : 'var(--border)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 'var(--text-sm)', flexShrink: 0,
                    }}>
                      {letter}
                    </span>
                    {opt}
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <input
              type="text"
              value={answers[currentQ] || ''}
              onChange={e => handleAnswer(e.target.value)}
              placeholder="Введите ответ..."
              style={{
                width: '100%', padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--bg)', border: '2px solid var(--border)',
                borderRadius: 'var(--radius)', color: 'var(--text)',
                fontSize: 'var(--text-base)', outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              onKeyDown={e => { if (e.key === 'Enter' && currentQ < questions.length - 1) setCurrentQ(c => c + 1) }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
            <button
              className="btn-outline"
              disabled={currentQ === 0}
              onClick={() => setCurrentQ(c => c - 1)}
              style={{ opacity: currentQ === 0 ? 0.4 : 1 }}
            >
              ← Назад
            </button>
            {currentQ < questions.length - 1 ? (
              <button className="btn-primary" onClick={() => setCurrentQ(c => c + 1)}>
                Далее →
              </button>
            ) : (
              <motion.button
                className="btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting}
                style={{ background: '#22c55e', color: '#fff' }}
              >
                {submitting ? 'Отправка...' : '✓ Отправить тест'}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6,
        marginTop: 'var(--sp-5)',
      }}>
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            style={{
              width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer',
              background: i === currentQ ? 'var(--accent)' : answers[i] !== undefined ? 'var(--accent-glow)' : 'var(--border)',
              color: i === currentQ ? '#fff' : answers[i] !== undefined ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 'var(--text-xs)', fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
