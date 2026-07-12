import { useCallback } from 'react'
import { hapticFeedback } from '@telegram-apps/sdk-react'

type HapticType = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
type NotificationType = 'success' | 'error' | 'warning'

function isTelegramEnv(): boolean {
  try {
    return typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp
  } catch {
    return false
  }
}

export function useHaptic() {
  const impact = useCallback((style: HapticType = 'light') => {
    if (!isTelegramEnv()) return
    try { hapticFeedback.impactOccurred(style) } catch {}
  }, [])

  const notify = useCallback((type: NotificationType) => {
    if (!isTelegramEnv()) return
    try { hapticFeedback.notificationOccurred(type) } catch {}
  }, [])

  const selection = useCallback(() => {
    if (!isTelegramEnv()) return
    try { hapticFeedback.selectionChanged() } catch {}
  }, [])

  return { impact, notify, selection }
}
