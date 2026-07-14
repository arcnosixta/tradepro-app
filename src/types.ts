export interface Course {
  id: string
  title: string
  description: string
  image: string
  level: 'Начинающий' | 'Средний' | 'Продвинутый'
  lessonsCount: number
  duration: string
  modules: Module[]
  order: number
  premium?: boolean
}

export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  duration: string
  type: 'video' | 'text' | 'quiz'
}

export interface QuizQuestion {
  type: 'choice' | 'input'
  question: string
  options?: string[]
  correctAnswer: string
}

export interface Quiz {
  id: string
  courseId: string
  lessonId: string
  questions: QuizQuestion[]
  passScore: number
  order: number
}

export interface QuizResult {
  id: string
  score: number
  passed: boolean
  answers: Record<number, string>
  completedAt: string
}

export interface Trade {
  id: string
  userId: string
  symbol: string
  type: 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  pnlPercent: number
  status: 'open' | 'closed'
  openedAt: string
  closedAt?: string
  notes: string
  tags: string[]
  createdAt: any
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  image: string
  category: string
  date: string
  source: string
  impact: 'high' | 'medium' | 'low'
}

export interface CommunityPost {
  id: string
  authorUid: string
  authorName: string
  authorAvatar: string
  authorBadge?: string
  content: string
  image?: string
  likes: number
  comments: number
  likedBy: string[]
  savedBy?: string[]
  views?: number
  createdAt: any
  tags: string[]
}

export interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'follow'
  fromUid: string
  fromName: string
  postId?: string
  message: string
  read: boolean
  createdAt: any
}

export interface Comment {
  id: string
  postId: string
  authorUid: string
  authorName: string
  content: string
  createdAt: any
}

export interface AdminUser {
  id: string
  uid: string
  name: string
  email: string
  avatar: string
  bio: string
  joinedAt: string
  admin?: boolean
  banned?: boolean
  premium?: boolean
}

export interface UserProgressEntry {
  uid: string
  name: string
  email: string
  courses: Record<string, { completed: number; total: number; pct: number; lessons: string[] }>
}
