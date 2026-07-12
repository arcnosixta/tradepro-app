import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useIsMobile } from '../../hooks/useMediaQuery'
import NotificationBell from '../notifications/NotificationBell'
import BottomNav from './BottomNav'
import './DashboardLayout.css'

const baseLinks = [
  { to: '/app', icon: '📊', label: 'Дашборд', end: true },
  { to: '/app/courses', icon: '📚', label: 'Курсы' },
  { to: '/app/journal', icon: '📒', label: 'Дневник сделок' },
  { to: '/app/community', icon: '💬', label: 'Сообщество' },
  { to: '/app/news', icon: '📰', label: 'Новости' },
  { to: '/app/profile', icon: '👤', label: 'Профиль' },
]

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { profile, logout } = useAuth()
  const location = useLocation()
  const isMobile = useIsMobile()

  const links = profile?.admin
    ? [...baseLinks, { to: '/app/admin', icon: '⚙️', label: 'Админ' }]
    : baseLinks

  return (
    <div className={`dash ${collapsed ? 'dash-collapsed' : ''}`}>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="dash-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {!isMobile && (
        <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} style={{ width: collapsed ? 72 : 260 }}>
          <div className="sidebar-header">
            <motion.div
              className="sidebar-logo"
              animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
              transition={{ duration: 0.2 }}
            >
              <span className="logo-icon">◆</span>
              {!collapsed && <span>TradePro</span>}
            </motion.div>
            <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
              <motion.span
                style={{ display: 'inline-block' }}
                animate={{ rotate: collapsed ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >◀</motion.span>
            </button>
          </div>

          <nav className="sidebar-nav">
            {links.map(link => (
              <NavLink key={link.to} to={link.to} end={link.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                onClick={() => setMobileOpen(false)}>
                <span className="sidebar-link-icon">{link.icon}</span>
                {!collapsed && (
                  <motion.span
                    className="sidebar-link-label"
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {link.label}
                  </motion.span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <motion.div
                className="sidebar-avatar"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {profile?.name?.[0]?.toUpperCase() || 'U'}
              </motion.div>
              {!collapsed && (
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{profile?.name}</div>
                  <div className="sidebar-user-email">{profile?.email}</div>
                </div>
              )}
            </div>
            <button className="sidebar-logout" onClick={logout}>
              🚪{!collapsed && <span>Выйти</span>}
            </button>
          </div>
        </aside>
      )}

      <div className="dash-main">
        <header className="dash-topbar safe-area-top">
          {!isMobile && (
            <button className="dash-burger" onClick={() => setMobileOpen(!mobileOpen)}><span /><span /><span /></button>
          )}
          <div className="dash-topbar-title">{links.find(l => l.end ? location.pathname === l.to : location.pathname.startsWith(l.to))?.label || 'TradePro'}</div>
          <div className="dash-topbar-right">
            <NotificationBell />
          </div>
        </header>
        <main className="dash-content">
          <Outlet />
        </main>
      </div>

      {isMobile && <BottomNav />}
    </div>
  )
}
