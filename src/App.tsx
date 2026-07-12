import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from './context/AuthContext'
import { useAdmin } from './hooks/useAdmin'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
import ErrorBoundary from './components/ui/ErrorBoundary'
import DashboardLayout from './components/layout/DashboardLayout'

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const DashboardPage = lazy(() => import('./pages/app/DashboardPage'))
const CoursesPage = lazy(() => import('./pages/app/CoursesPage'))
const JournalPage = lazy(() => import('./pages/app/JournalPage'))
const CommunityPage = lazy(() => import('./pages/app/CommunityPage'))
const NewsPage = lazy(() => import('./pages/app/NewsPage'))
const ProfilePage = lazy(() => import('./pages/app/ProfilePage'))
const UserPage = lazy(() => import('./pages/app/UserPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const CommunityMod = lazy(() => import('./pages/admin/CommunityMod'))
const Analytics = lazy(() => import('./pages/admin/Analytics'))
const CourseProgress = lazy(() => import('./pages/admin/CourseProgress'))
const NotificationsAdmin = lazy(() => import('./pages/admin/NotificationsAdmin'))

const Load = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
    <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
  </div>
)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: 0.3, ease }}
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Load />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Guest({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Load />
  if (isAuthenticated) return <Navigate to="/app" replace />
  return <>{children}</>
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const { isAdmin } = useAdmin()
  if (loading) return <Load />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return (
    <div className="admin-guard">
      <div className="admin-guard-icon">🔒</div>
      <div>Доступ запрещён</div>
      <div style={{ fontSize: 'var(--text-xs)' }}>Только для администраторов</div>
    </div>
  )
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<Load />}>
        <Routes>
          <Route path="login" element={<Guest><Login /></Guest>} />
          <Route path="register" element={<Guest><Register /></Guest>} />
          <Route path="app" element={<Protected><DashboardLayout /></Protected>}>
            <Route index element={<PageWrap><DashboardPage /></PageWrap>} />
            <Route path="courses" element={<PageWrap><CoursesPage /></PageWrap>} />
            <Route path="journal" element={<PageWrap><JournalPage /></PageWrap>} />
            <Route path="community" element={<PageWrap><CommunityPage /></PageWrap>} />
            <Route path="news" element={<PageWrap><NewsPage /></PageWrap>} />
            <Route path="profile" element={<PageWrap><ProfilePage /></PageWrap>} />
            <Route path="user/:uid" element={<PageWrap><UserPage /></PageWrap>} />
            <Route path="admin" element={<AdminOnly><PageWrap><AdminDashboard /></PageWrap></AdminOnly>} />
            <Route path="admin/users" element={<AdminOnly><PageWrap><UsersPage /></PageWrap></AdminOnly>} />
            <Route path="admin/community" element={<AdminOnly><PageWrap><CommunityMod /></PageWrap></AdminOnly>} />
            <Route path="admin/analytics" element={<AdminOnly><PageWrap><Analytics /></PageWrap></AdminOnly>} />
            <Route path="admin/courses" element={<AdminOnly><PageWrap><CourseProgress /></PageWrap></AdminOnly>} />
            <Route path="admin/notifications" element={<AdminOnly><PageWrap><NotificationsAdmin /></PageWrap></AdminOnly>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
