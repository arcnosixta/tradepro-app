import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useHaptic } from '../../hooks/useHaptic'
import './BottomNav.css'

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const BookIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const PenIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
)

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const NewsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M10 6h8v4h-8V6z" />
  </svg>
)

const UserIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const icons = [HomeIcon, BookIcon, PenIcon, ChatIcon, NewsIcon, UserIcon]

const tabs = [
  { to: '/app', label: 'Главная', end: true },
  { to: '/app/courses', label: 'Курсы' },
  { to: '/app/journal', label: 'Дневник' },
  { to: '/app/community', label: 'Чат' },
  { to: '/app/news', label: 'Новости' },
  { to: '/app/profile', label: 'Профиль' },
]

export default function BottomNav() {
  const location = useLocation()
  const haptic = useHaptic()

  return (
    <nav className="bottom-nav safe-area-bottom">
      <div className="bottom-nav-inner">
        {tabs.map((tab, i) => {
          const active = tab.end
            ? location.pathname === tab.to
            : location.pathname.startsWith(tab.to)
          const Icon = icons[i]
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={`bottom-nav-item ${active ? 'bottom-nav-active' : ''}`}
              onClick={() => haptic.selection()}
            >
              {active && (
                <motion.span
                  className="bottom-nav-active-bg"
                  layoutId="bottomNavIndicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="bottom-nav-icon">
                <Icon active={active} />
              </span>
              <span className="bottom-nav-label">{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
