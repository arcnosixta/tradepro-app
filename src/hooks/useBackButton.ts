import { useEffect, useCallback } from 'react'
import { backButton, miniApp } from '@telegram-apps/sdk-react'
import { useLocation, useNavigate } from 'react-router-dom'

export function useBackButton() {
  const nav = useNavigate()
  const location = useLocation()

  const isRoot = location.pathname === '/app' || location.pathname === '/login' || location.pathname === '/register'

  useEffect(() => {
    if (isRoot) {
      try { backButton.hide() } catch {}
      return
    }
    try { backButton.show() } catch {}

    const handler = () => {
      if (window.history.length > 1) {
        nav(-1)
      } else {
        try { miniApp.close() } catch {}
      }
    }

    try { backButton.onClick(handler) } catch {}
    return () => {
      try { backButton.offClick(handler) } catch {}
      try { backButton.hide() } catch {}
    }
  }, [nav, isRoot])

  const hide = useCallback(() => {
    try { backButton.hide() } catch {}
  }, [])

  const show = useCallback(() => {
    try { backButton.show() } catch {}
  }, [])

  return { hide, show }
}
