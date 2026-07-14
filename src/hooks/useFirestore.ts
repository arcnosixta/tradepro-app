import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, writeBatch, setDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { fetchLiveNews, fetchTrendingCoins } from '../services/newsApi'
import type {
  Course, Module, Lesson, Quiz, QuizQuestion, QuizResult,
  Trade, NewsItem, CommunityPost, Notification, Comment, AdminUser, UserProgressEntry,
} from '../types'

export type { Course, Module, Lesson, Quiz, QuizQuestion, QuizResult, Trade, NewsItem, CommunityPost, Notification, Comment, AdminUser, UserProgressEntry }

/* ─── Image upload helper ─── */
export async function uploadImage(file: File, _path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

/* ─── Default news ─── */
const DEFAULT_NEWS: NewsItem[] = [
  { id: 'd1', title: 'Bitcoin достиг нового ATH: $73,000', summary: 'Биткоин обновил исторический максимум на фоне институциональных инвестиций и одобрения ETF.', image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&q=80', category: 'Криптовалюта', date: new Date().toISOString(), source: 'CoinDesk', impact: 'low' },
  { id: 'd2', title: 'ФРС сохранила ставку без изменений', summary: 'Федеральная резервная система приняла решение о сохранении текущей процентной ставки на уровне 5.25-5.50%.', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80', category: 'Макроэкономика', date: new Date(Date.now() - 3600000 * 5).toISOString(), source: 'Reuters', impact: 'high' },
  { id: 'd3', title: 'EUR/USD обновил 3-месячный максимум', summary: 'Евро укрепляется на фоне ожиданий изменения денежно-кредитной политики ФРС.', image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&q=80', category: 'Валюты', date: new Date(Date.now() - 3600000 * 8).toISOString(), source: 'Bloomberg', impact: 'medium' },
  { id: 'd4', title: 'Apple и Microsoft обновили максимумы', summary: 'Технологические акции растут на фоне сильных квартальных отчётов.', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80', category: 'Акции', date: new Date(Date.now() - 3600000 * 12).toISOString(), source: 'Reuters', impact: 'low' },
  { id: 'd5', title: 'Ethereum готовится к обновлению Pectra', summary: 'Девелоперы анонсировали обновление для улучшения масштабируемости сети.', image: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=600&q=80', category: 'Криптовалюта', date: new Date(Date.now() - 86400000).toISOString(), source: 'The Block', impact: 'low' },
  { id: 'd6', title: 'Золото обновило 6-месячный максимум', summary: 'Безопасные активы растут на фоне геополитической напряжённости.', image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&q=80', category: 'Сырьё', date: new Date(Date.now() - 86400000 * 2).toISOString(), source: 'Financial Times', impact: 'high' },
]

/* ─── Default courses ─── */
const DEFAULT_COURSES: Course[] = [
  {
    id: 'dc1', title: 'Основы трейдинга', description: 'Полный курс для начинающих. От азов до первой стратегии.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    level: 'Начинающий', lessonsCount: 11, duration: '6ч 15мин', order: 1, premium: false,
    modules: [
      { id: 'dm1', title: 'Введение в рынки', lessons: [
        { id: 'dl1', title: 'Что такое трейдинг?', duration: '15мин', type: 'video' },
        { id: 'dl2', title: 'Как работают биржи', duration: '22мин', type: 'video' },
        { id: 'dl3', title: 'Типы ордеров', duration: '18мин', type: 'video' },
        { id: 'dl4', title: 'Тест: Основы рынков', duration: '10мин', type: 'quiz' },
      ]},
      { id: 'dm2', title: 'Технический анализ', lessons: [
        { id: 'dl5', title: 'Свечные паттерны', duration: '25мин', type: 'video' },
        { id: 'dl6', title: 'Поддержка и сопротивление', duration: '20мин', type: 'video' },
        { id: 'dl7', title: 'Индикаторы: RSI, MACD, EMA', duration: '30мин', type: 'video' },
        { id: 'dl8', title: 'Объёмный анализ', duration: '18мин', type: 'text' },
      ]},
      { id: 'dm3', title: 'Управление рисками', lessons: [
        { id: 'dl9', title: 'Position sizing', duration: '20мин', type: 'video' },
        { id: 'dl10', title: 'Стоп-лосс и тейк-профит', duration: '15мин', type: 'video' },
        { id: 'dl11', title: 'Риск-менеджмент на практике', duration: '25мин', type: 'video' },
      ]},
    ],
  },
  {
    id: 'dc2', title: 'Трейдинг-стратегии', description: 'Скейлинг, дейтрейдинг, свинг — рабочие стратегии.',
    image: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80',
    level: 'Средний', lessonsCount: 5, duration: '3ч 35мин', order: 2, premium: false,
    modules: [
      { id: 'dm4', title: 'Скейлинг-стратегии', lessons: [
        { id: 'dl12', title: 'Введение в скейлинг', duration: '20мин', type: 'video' },
        { id: 'dl13', title: 'Order flow анализ', duration: '25мин', type: 'video' },
        { id: 'dl14', title: 'Скальпинг на 1-минутке', duration: '30мин', type: 'video' },
      ]},
      { id: 'dm5', title: 'Свинг-трейдинг', lessons: [
        { id: 'dl15', title: 'Поиск свинг-точек', duration: '22мин', type: 'video' },
        { id: 'dl16', title: 'Паттерны продолжения', duration: '18мин', type: 'video' },
      ]},
    ],
  },
  {
    id: 'dc3', title: 'Продвинутый анализ', description: 'Микроструктура рынка и алгоритмические стратегии.',
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80',
    level: 'Продвинутый', lessonsCount: 2, duration: '50мин', order: 3, premium: false,
    modules: [
      { id: 'dm6', title: 'Микроструктура', lessons: [
        { id: 'dl17', title: 'Order book dynamics', duration: '28мин', type: 'video' },
        { id: 'dl18', title: 'Liquidity zones', duration: '22мин', type: 'video' },
      ]},
    ],
  },
]

/* ─── Courses ─── */
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'courses'), orderBy('order')),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Course))
        setCourses(data.length > 0 ? data : DEFAULT_COURSES)
        setLoading(false)
      },
      err => {
        console.error('Courses error:', err)
        setCourses(DEFAULT_COURSES)
        setLoading(false)
      }
    )
    return unsub
  }, [])
  return { courses, loading }
}

/* ─── User Progress ─── */
export function useUserProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    const unsub = onSnapshot(
      collection(db, 'users', userId, 'progress'),
      snap => {
        const map: Record<string, string[]> = {}
        snap.docs.forEach(d => { map[d.id] = d.data().completedLessons || [] })
        setProgress(map)
        setLoading(false)
      },
      err => { console.error('Progress error:', err); setLoading(false) }
    )
    return unsub
  }, [userId])

  const toggleLesson = async (courseId: string, lessonId: string) => {
    if (!userId) return
    const ref = doc(db, 'users', userId, 'progress', courseId)
    try {
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const completed = snap.data().completedLessons || []
        await updateDoc(ref, {
          completedLessons: completed.includes(lessonId)
            ? completed.filter((id: string) => id !== lessonId)
            : [...completed, lessonId],
          lastAccessed: new Date().toISOString(),
        })
      } else {
        await setDoc(ref, { completedLessons: [lessonId], lastAccessed: new Date().toISOString() })
      }
    } catch (err) { console.error('Toggle lesson error:', err) }
  }
  return { progress, loading, toggleLesson }
}

/* ─── Quizzes ─── */
export function useQuiz(lessonId: string | undefined) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lessonId) { setQuiz(null); setLoading(false); return }
    const q = query(collection(db, 'quizzes'), where('lessonId', '==', lessonId))
    const unsub = onSnapshot(q, snap => {
      if (snap.docs.length > 0) {
        setQuiz({ id: snap.docs[0].id, ...snap.docs[0].data() } as Quiz)
      } else {
        setQuiz(null)
      }
      setLoading(false)
    }, err => { console.error('Quiz error:', err); setLoading(false) })
    return unsub
  }, [lessonId])

  return { quiz, loading }
}

export function useQuizById(quizId: string | undefined) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!quizId) { setQuiz(null); setLoading(false); return }
    const ref = doc(db, 'quizzes', quizId)
    const unsub = onSnapshot(ref, snap => {
      setQuiz(snap.exists() ? { id: snap.id, ...snap.data() } as Quiz : null)
      setLoading(false)
    }, err => { console.error('QuizById error:', err); setLoading(false) })
    return unsub
  }, [quizId])

  return { quiz, loading }
}

export function useQuizResult(userId: string | undefined, quizId: string | undefined) {
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !quizId) { setResult(null); setLoading(false); return }
    const ref = doc(db, 'users', userId, 'quizResults', quizId)
    const unsub = onSnapshot(ref, snap => {
      setResult(snap.exists() ? { id: snap.id, ...snap.data() } as QuizResult : null)
      setLoading(false)
    }, err => { console.error('QuizResult error:', err); setLoading(false) })
    return unsub
  }, [userId, quizId])

  return { result, loading }
}

export function useAllQuizResults(userId: string | undefined) {
  const [results, setResults] = useState<Record<string, QuizResult>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setResults({}); setLoading(false); return }
    const unsub = onSnapshot(
      collection(db, 'users', userId, 'quizResults'),
      snap => {
        const map: Record<string, QuizResult> = {}
        snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() } as QuizResult })
        setResults(map)
        setLoading(false)
      },
      err => { console.error('AllQuizResults error:', err); setLoading(false) }
    )
    return unsub
  }, [userId])

  return { results, loading }
}

export async function submitQuiz(
  userId: string,
  quizId: string,
  answers: Record<number, string>,
  questions: QuizQuestion[],
  passScore: number,
): Promise<QuizResult> {
  let correct = 0
  questions.forEach((q, i) => {
    const userAns = (answers[i] || '').trim().toLowerCase()
    if (q.type === 'choice' && q.options) {
      const idx = parseInt(q.correctAnswer, 10) - 1
      const correctText = (q.options[idx] || '').trim().toLowerCase()
      if (userAns === correctText) correct++
    } else {
      const correctAns = q.correctAnswer.trim().toLowerCase()
      if (userAns === correctAns) correct++
    }
  })
  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  const passed = score >= passScore
  const resultData: Omit<QuizResult, 'id'> = {
    score, passed, answers, completedAt: new Date().toISOString(),
  }
  const ref = doc(db, 'users', userId, 'quizResults', quizId)
  await setDoc(ref, resultData)
  return { id: quizId, ...resultData }
}

export function useAllQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'quizzes'),
      snap => { setQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz))); setLoading(false) },
      err => { console.error('AllQuizzes error:', err); setLoading(false) }
    )
    return unsub
  }, [])

  const addQuiz = async (data: Omit<Quiz, 'id'>) => {
    try { await addDoc(collection(db, 'quizzes'), data) } catch (err) { console.error('addQuiz error:', err); throw err }
  }
  const updateQuiz = async (id: string, data: Partial<Quiz>) => {
    try { await updateDoc(doc(db, 'quizzes', id), data) } catch (err) { console.error('updateQuiz error:', err); throw err }
  }
  const deleteQuiz = async (id: string) => {
    try { await deleteDoc(doc(db, 'quizzes', id)) } catch (err) { console.error('deleteQuiz error:', err); throw err }
  }

  return { quizzes, loading, addQuiz, updateQuiz, deleteQuiz }
}

/* ─── Trades ─── */
export function useTrades(userId: string | undefined) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    const tryIndexed = () => {
      try {
        return onSnapshot(
          query(collection(db, 'trades'), where('userId', '==', userId), orderBy('createdAt', 'desc')),
          snap => { setTrades(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trade))); setLoading(false) },
          err => {
            console.warn('Trades indexed query failed, using fallback:', err.message)
            fallback()
          }
        )
      } catch { fallback(); return () => {} }
    }
    const fallback = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'trades'), where('userId', '==', userId)))
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Trade))
        data.sort((a, b) => {
          const ta = a.createdAt?.seconds || 0, tb = b.createdAt?.seconds || 0
          return tb - ta
        })
        setTrades(data)
      } catch (err2) { console.error('Trades fallback error:', err2) }
      setLoading(false)
    }
    const unsub = tryIndexed()
    return unsub
  }, [userId])
  const addTrade = async (data: Omit<Trade, 'id' | 'createdAt'>) => {
    if (!userId) return
    try { await addDoc(collection(db, 'trades'), { ...data, userId, createdAt: serverTimestamp() }) } catch (err) { console.error(err) }
  }
  const deleteTrade = async (id: string) => {
    try { await deleteDoc(doc(db, 'trades', id)) } catch (err) { console.error(err) }
  }
  return { trades, loading, addTrade, deleteTrade }
}

/* ─── News (with live API) ─── */
export function useNews() {
  const [news, setNews] = useState<NewsItem[]>(DEFAULT_NEWS)
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const liveItems = await fetchLiveNews()
      if (liveItems.length > 0) {
        setNews(liveItems.map(n => ({
          id: n.id, title: n.title, summary: n.summary,
          image: n.image, category: n.category, date: n.date, source: n.source,
          impact: n.impact,
        })))
      }
      setLastRefresh(new Date())
    } catch (err) {
      console.warn('News refresh error:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh().catch(() => {})
    const interval = setInterval(() => { refresh().catch(() => {}) }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refresh])

  return { news, loading, refresh, lastRefresh }
}

/* ─── Trending Coins ─── */
export function useTrendingCoins() {
  const [coins, setCoins] = useState<{ name: string; symbol: string; price: number; change24h: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrendingCoins().then(data => { setCoins(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { coins, loading }
}

/* ─── Community (with algorithm) ─── */
function scorePost(post: CommunityPost): number {
  const likes = (post.likedBy || []).length
  const comments = post.comments || 0
  const ageHours = post.createdAt?.seconds
    ? (Date.now() / 1000 - post.createdAt.seconds) / 3600
    : 24
  const recency = 1 / (ageHours + 1)
  return likes * 2 + comments * 3 + recency * 10
}

export function useCommunity(sortBy: 'popular' | 'newest' = 'newest') {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'posts'), orderBy('createdAt', 'desc')),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost))
        if (sortBy === 'popular') {
          data.sort((a, b) => scorePost(b) - scorePost(a))
        }
        setPosts(data)
        setLoading(false)
      },
      err => { console.error('Community error:', err); setLoading(false) }
    )
    return unsub
  }, [sortBy])

  const addPost = async (data: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'likedBy' | 'createdAt'>) => {
    try {
      const docData: any = { ...data, likes: 0, comments: 0, likedBy: [], savedBy: [], views: 0, createdAt: serverTimestamp() }
      if (!docData.image) delete docData.image
      await addDoc(collection(db, 'posts'), docData)
    } catch (err) {
      console.error('addPost error:', err)
      throw err
    }
  }

  const toggleLike = async (postId: string, userId: string) => {
    try {
      const ref = doc(db, 'posts', postId)
      const snap = await getDoc(ref)
      if (!snap.exists()) return
      const d = snap.data(); const liked = d.likedBy || []
      const batch = writeBatch(db)
      if (liked.includes(userId)) {
        batch.update(ref, { likedBy: liked.filter((id: string) => id !== userId), likes: (d.likes || 0) - 1 })
      } else {
        batch.update(ref, { likedBy: [...liked, userId], likes: (d.likes || 0) + 1 })
        if (d.authorUid !== userId) {
          const notifRef = doc(collection(db, 'notifications'))
          batch.set(notifRef, {
            type: 'like', title: 'Новый лайк', body: 'поставил лайк вашему посту',
            link: '/community', read: false, createdAt: serverTimestamp(), userId: d.authorUid,
          })
        }
      }
      await batch.commit()
    } catch (err) { console.error(err) }
  }

  const toggleSave = async (postId: string, userId: string) => {
    try {
      const ref = doc(db, 'posts', postId)
      const snap = await getDoc(ref)
      if (!snap.exists()) return
      const d = snap.data(); const saved = d.savedBy || []
      if (saved.includes(userId)) {
        await updateDoc(ref, { savedBy: saved.filter((id: string) => id !== userId) })
      } else {
        await updateDoc(ref, { savedBy: [...saved, userId] })
      }
    } catch (err) { console.error(err) }
  }

  const searchPosts = (query: string): CommunityPost[] => {
    const q = query.toLowerCase()
    return posts.filter(p =>
      p.content.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    )
  }

  return { posts, loading, addPost, toggleLike, toggleSave, searchPosts }
}

/* ─── Comments ─── */
export function useComments(postId: string | null) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!postId) { setComments([]); setLoading(false); return }
    const unsub = onSnapshot(
      query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc')),
      snap => { setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment))); setLoading(false) },
      err => { console.error('Comments error:', err); setLoading(false) }
    )
    return unsub
  }, [postId])

  const addComment = async (data: { authorUid: string; authorName: string; content: string }) => {
    if (!postId) return
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), { ...data, createdAt: serverTimestamp() })
      const ref = doc(db, 'posts', postId)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        await updateDoc(ref, { comments: (snap.data().comments || 0) + 1 })
        if (snap.data().authorUid !== data.authorUid) {
          await addDoc(collection(db, 'notifications'), {
            type: 'comment', title: 'Новый комментарий', body: `${data.authorName} прокомментировал ваш пост`,
            link: '/community', read: false, createdAt: serverTimestamp(), userId: snap.data().authorUid,
          })
        }
      }
    } catch (err) { console.error(err) }
  }

  const deleteComment = async (commentId: string) => {
    if (!postId) return
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId))
      const ref = doc(db, 'posts', postId)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        await updateDoc(ref, { comments: Math.max(0, (snap.data().comments || 1) - 1) })
      }
    } catch (err) { console.error(err) }
  }

  return { comments, loading, addComment, deleteComment }
}

/* ─── User Posts (for public profile) ─── */
export function useUserPosts(uid: string | null) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setPosts([]); setLoading(false); return }
    const unsub = onSnapshot(
      query(collection(db, 'posts'), where('authorUid', '==', uid), orderBy('createdAt', 'desc')),
      snap => { setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost))); setLoading(false) },
      err => { console.error('User posts error:', err); setLoading(false) }
    )
    return unsub
  }, [uid])

  return { posts, loading }
}

/* ─── Saved Posts ─── */
export function useSavedPosts(userId: string | undefined) {
  const [savedPosts, setSavedPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setSavedPosts([]); setLoading(false); return }
    const unsub = onSnapshot(
      collection(db, 'posts'),
      snap => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as CommunityPost))
          .filter(p => (p.savedBy || []).includes(userId))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setSavedPosts(data)
        setLoading(false)
      },
      err => { console.error('Saved posts error:', err); setLoading(false) }
    )
    return unsub
  }, [userId])

  return { savedPosts, loading }
}

/* ═══════════════════════════════════════════════════════════
   ADMIN HOOKS
   ═══════════════════════════════════════════════════════════ */

export function useAllUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      snap => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser)))
        setLoading(false)
      },
      err => { console.error('AllUsers error:', err); setLoading(false) }
    )
    return unsub
  }, [])

  const banUser = async (uid: string, banned: boolean) => {
    try { await updateDoc(doc(db, 'users', uid), { banned }) } catch (err) { console.error(err) }
  }

  const setAdmin = async (uid: string, admin: boolean) => {
    try { await updateDoc(doc(db, 'users', uid), { admin }) } catch (err) { console.error(err) }
  }

  const setPremium = async (uid: string, premium: boolean) => {
    try { await updateDoc(doc(db, 'users', uid), { premium }) } catch (err) { console.error(err) }
  }

  const deleteUser = async (uid: string) => {
    try { await deleteDoc(doc(db, 'users', uid)) } catch (err) { console.error(err) }
  }

  return { users, loading, banUser, setAdmin, setPremium, deleteUser }
}

export function useAllTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'trades'), orderBy('createdAt', 'desc')),
      snap => {
        setTrades(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trade)))
        setLoading(false)
      },
      err => { console.error('AllTrades error:', err); setLoading(false) }
    )
    return unsub
  }, [])

  return { trades, loading }
}

export function useAdminCommunity() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'posts'), orderBy('createdAt', 'desc')),
      snap => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost)))
        setLoading(false)
      },
      err => { console.error('AdminCommunity error:', err); setLoading(false) }
    )
    return unsub
  }, [])

  const deletePost = async (postId: string) => {
    try { await deleteDoc(doc(db, 'posts', postId)) } catch (err) { console.error(err) }
  }

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId))
      const ref = doc(db, 'posts', postId)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        await updateDoc(ref, { comments: Math.max(0, (snap.data().comments || 1) - 1) })
      }
    } catch (err) { console.error(err) }
  }

  return { posts, loading, deletePost, deleteComment }
}

export function useAllComments(postId: string | null) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!postId) { setComments([]); setLoading(false); return }
    const unsub = onSnapshot(
      query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc')),
      snap => { setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment))); setLoading(false) },
      err => { console.error('AdminComments error:', err); setLoading(false) }
    )
    return unsub
  }, [postId])

  return { comments, loading }
}

export function useAdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalTrades: 0,
    totalComments: 0,
    bannedUsers: 0,
    adminUsers: 0,
    premiumUsers: 0,
    newUsersToday: 0,
    activeTraders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchStats = async () => {
      try {
        const [usersSnap, postsSnap, tradesSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'posts')),
          getDocs(query(collection(db, 'trades'), orderBy('createdAt', 'desc'))),
        ])
        if (cancelled) return

        const users = usersSnap.docs.map(d => d.data())
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayMs = today.getTime()
        const trades = tradesSnap.docs.map(d => d.data())
        const uniqueTraderUids = new Set(trades.map(t => t.userId))

        setStats({
          totalUsers: usersSnap.size,
          totalPosts: postsSnap.size,
          totalTrades: tradesSnap.size,
          totalComments: 0,
          bannedUsers: users.filter(u => u.banned).length,
          adminUsers: users.filter(u => u.admin).length,
          premiumUsers: users.filter(u => u.premium).length,
          newUsersToday: users.filter(u => {
            const joined = u.joinedAt ? new Date(u.joinedAt).getTime() : 0
            return joined >= todayMs
          }).length,
          activeTraders: uniqueTraderUids.size,
        })
      } catch (err) {
        console.error('AdminStats error:', err)
      }
      if (!cancelled) setLoading(false)
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return { stats, loading }
}

export function useAnalyticsData() {
  const [data, setData] = useState<{ users: AdminUser[]; trades: Trade[]; posts: CommunityPost[] }>({ users: [], trades: [], posts: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [usersSnap, tradesSnap, postsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(query(collection(db, 'trades'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'))),
        ])
        if (cancelled) return
        setData({
          users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser)),
          trades: tradesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Trade)),
          posts: postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost)),
        })
      } catch (err) { console.error('AnalyticsData error:', err) }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { ...data, loading }
}

/* ─── All Users Progress (Admin) ─── */
export function useAllUsersProgress(courses: Course[]) {
  const [usersProgress, setUsersProgress] = useState<UserProgressEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'))
        const results: UserProgressEntry[] = []

        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data()
          const progressSnap = await getDocs(collection(db, 'users', userDoc.id, 'progress'))
          const courseMap: Record<string, { completed: number; total: number; pct: number; lessons: string[] }> = {}

          for (const progDoc of progressSnap.docs) {
            const courseId = progDoc.id
            const completedLessons = progDoc.data().completedLessons || []
            const course = courses.find(c => c.id === courseId)
            const total = course ? course.modules.reduce((a, m) => a + m.lessons.length, 0) : 0
            const completed = completedLessons.length
            courseMap[courseId] = {
              completed,
              total,
              pct: total > 0 ? Math.round((completed / total) * 100) : 0,
              lessons: completedLessons,
            }
          }

          results.push({
            uid: userDoc.id,
            name: userData.name || '—',
            email: userData.email || '',
            courses: courseMap,
          })
        }

        if (!cancelled) {
          setUsersProgress(results)
          setLoading(false)
        }
      } catch (err) {
        console.error('AllUsersProgress error:', err)
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [courses])

  return { usersProgress, loading }
}
