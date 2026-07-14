import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useCourses, useAllQuizzes } from '../../hooks/useFirestore'
import { useToast } from '../../context/ToastContext'
import type { QuizQuestion } from '../../types'
import './admin.css'

export default function QuizManager() {
  const nav = useNavigate()
  const { courses } = useCourses()
  const { quizzes, loading, addQuiz, updateQuiz, deleteQuiz } = useAllQuizzes()
  const { toast } = useToast()

  const [editingQuiz, setEditingQuiz] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    courseId: '',
    lessonId: '',
    passScore: 60,
    questions: [] as QuizQuestion[],
  })
  const [questionForm, setQuestionForm] = useState<QuizQuestion>({
    type: 'choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
  })

  const handleAddQuestion = () => {
    if (!questionForm.question.trim()) return
    const q = { ...questionForm }
    if (q.type === 'choice') {
      q.options = (q.options ?? []).filter(o => o.trim())
    } else {
      q.options = undefined
    }
    setForm(prev => ({ ...prev, questions: [...prev.questions, q] }))
    setQuestionForm({ type: 'choice', question: '', options: ['', '', '', ''], correctAnswer: '' })
  }

  const handleRemoveQuestion = (idx: number) => {
    setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }))
  }

  const handleSaveQuiz = async () => {
    if (!form.courseId || !form.lessonId || form.questions.length === 0) {
      toast('Заполните все поля и добавьте вопросы', 'error')
      return
    }
    try {
      if (editingQuiz) {
        await updateQuiz(editingQuiz, form)
        toast('Тест обновлён', 'success')
      } else {
        await addQuiz({ ...form, order: 0 })
        toast('Тест создан', 'success')
      }
      setForm({ courseId: '', lessonId: '', passScore: 60, questions: [] })
      setShowForm(false)
      setEditingQuiz(null)
    } catch (err) {
      console.error('Save quiz error:', err)
      toast('Ошибка: тест не сохранён. Проверь права доступа.', 'error')
    }
  }

  const handleEditQuiz = (quiz: typeof quizzes[0]) => {
    setForm({
      courseId: quiz.courseId,
      lessonId: quiz.lessonId,
      passScore: quiz.passScore,
      questions: quiz.questions,
    })
    setEditingQuiz(quiz.id)
    setShowForm(true)
  }

  const handleDeleteQuiz = async (id: string) => {
    if (confirm('Удалить тест?')) {
      await deleteQuiz(id)
      toast('Тест удалён', 'success')
    }
  }

  const getCourseLessons = (courseId: string) => {
    const course = courses.find(c => c.id === courseId)
    if (!course) return []
    return course.modules.flatMap(m => m.lessons)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <button className="back" onClick={() => nav('/app/admin')}>← Назад</button>
        <h1 className="pg-title">Управление тестами</h1>
        <p className="pg-sub">{quizzes.length} тестов · {loading ? 'Загрузка...' : ''}</p>
      </div>

      <motion.button
        className="btn-primary"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => { setShowForm(!showForm); setEditingQuiz(null); setForm({ courseId: '', lessonId: '', passScore: 60, questions: [] }) }}
        style={{ marginBottom: 'var(--sp-5)' }}
      >
        {showForm ? '✕ Закрыть' : '＋ Создать тест'}
      </motion.button>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--sp-6)',
              marginBottom: 'var(--sp-5)', overflow: 'hidden',
            }}
          >
            <h3 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>
              {editingQuiz ? 'Редактировать тест' : 'Новый тест'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Курс</label>
                <select
                  value={form.courseId}
                  onChange={e => setForm(prev => ({ ...prev, courseId: e.target.value, lessonId: '' }))}
                  style={{
                    width: '100%', padding: 'var(--sp-2) var(--sp-3)',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 'var(--text-sm)',
                  }}
                >
                  <option value="">Выберите курс</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Урок</label>
                <select
                  value={form.lessonId}
                  onChange={e => setForm(prev => ({ ...prev, lessonId: e.target.value }))}
                  disabled={!form.courseId}
                  style={{
                    width: '100%', padding: 'var(--sp-2) var(--sp-3)',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 'var(--text-sm)',
                    opacity: form.courseId ? 1 : 0.5,
                  }}
                >
                  <option value="">Выберите урок</option>
                  {getCourseLessons(form.courseId).map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Проходной балл (%)</label>
                <input
                  type="number"
                  value={form.passScore}
                  onChange={e => setForm(prev => ({ ...prev, passScore: parseInt(e.target.value) || 60 }))}
                  min={0}
                  max={100}
                  style={{
                    width: '100%', padding: 'var(--sp-2) var(--sp-3)',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 'var(--text-sm)',
                  }}
                />
              </div>
            </div>

            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--sp-5)',
              marginBottom: 'var(--sp-4)',
            }}>
              <h4 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 'var(--sp-3)', fontSize: 'var(--text-sm)' }}>
                Добавить вопрос ({form.questions.length} текущих)
              </h4>

              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
                <button
                  className={`admin-btn ${questionForm.type === 'choice' ? 'admin-btn-success' : ''}`}
                  onClick={() => setQuestionForm(prev => ({ ...prev, type: 'choice' }))}
                >
                  Варианты ответа
                </button>
                <button
                  className={`admin-btn ${questionForm.type === 'input' ? 'admin-btn-success' : ''}`}
                  onClick={() => setQuestionForm(prev => ({ ...prev, type: 'input', options: undefined }))}
                >
                  Ввод текста
                </button>
              </div>

              <textarea
                value={questionForm.question}
                onChange={e => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Текст вопроса..."
                rows={2}
                style={{
                  width: '100%', padding: 'var(--sp-3)',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--sp-3)', resize: 'vertical',
                }}
              />

              {questionForm.type === 'choice' && questionForm.options && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
                  {questionForm.options.map((opt, i) => (
                    <input
                      key={i}
                      value={opt}
                      onChange={e => {
                        const newOpts = [...questionForm.options!]
                        newOpts[i] = e.target.value
                        setQuestionForm(prev => ({ ...prev, options: newOpts }))
                      }}
                      placeholder={`${String.fromCharCode(65 + i)} variant`}
                      style={{
                        padding: 'var(--sp-2) var(--sp-3)',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 'var(--text-sm)',
                      }}
                    />
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {questionForm.type === 'choice' ? 'Номер правильного ответа (A=1, B=2...)' : 'Правильный ответ'}
                  </label>
                  <input
                    value={questionForm.correctAnswer}
                    onChange={e => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    placeholder={questionForm.type === 'choice' ? '1' : 'Текст ответа'}
                    style={{
                      width: '100%', padding: 'var(--sp-2) var(--sp-3)',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 'var(--text-sm)',
                    }}
                  />
                </div>
                <button className="admin-btn admin-btn-success" onClick={handleAddQuestion}>
                  + Добавить
                </button>
              </div>
            </div>

            {form.questions.length > 0 && (
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                {form.questions.map((q, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                    padding: 'var(--sp-3)', background: 'var(--bg)',
                    borderRadius: 'var(--radius)', marginBottom: 'var(--sp-2)',
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-glow)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 600 }}>{q.question}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {q.type === 'choice' ? `Варианты: ${q.options?.join(', ')}` : 'Ввод текста'} · Ответ: {q.correctAnswer}
                      </div>
                    </div>
                    <button className="admin-btn admin-btn-danger" onClick={() => handleRemoveQuestion(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              <button className="btn-primary" onClick={handleSaveQuiz}>
                {editingQuiz ? '💾 Сохранить' : '✓ Создать тест'}
              </button>
              <button className="btn-outline" onClick={() => { setShowForm(false); setEditingQuiz(null) }}>
                Отмена
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="admin-empty"><div className="admin-empty-icon">⏳</div>Загрузка...</div>
      ) : quizzes.length === 0 ? (
        <div className="admin-empty"><div className="admin-empty-icon">📝</div>Тестов пока нет. Создайте первый!</div>
      ) : (
        <div className="admin-section">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Курс</th>
                  <th>Урок</th>
                  <th>Вопросов</th>
                  <th>Проходной</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map(q => {
                  const course = courses.find(c => c.id === q.courseId)
                  const lesson = course?.modules.flatMap(m => m.lessons).find(l => l.id === q.lessonId)
                  return (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600 }}>{course?.title || q.courseId}</td>
                      <td>{lesson?.title || q.lessonId}</td>
                      <td>{q.questions.length}</td>
                      <td>{q.passScore}%</td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn" onClick={() => handleEditQuiz(q)}>✏️</button>
                          <button className="admin-btn admin-btn-danger" onClick={() => handleDeleteQuiz(q.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}
