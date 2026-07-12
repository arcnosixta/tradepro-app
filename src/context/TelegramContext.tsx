import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  init,
  miniApp,
  themeParams,
  viewport,
  type ThemeParams as TgThemeParams,
} from '@telegram-apps/sdk-react'

interface TelegramContextType {
  ready: boolean
  isDark: boolean
  theme: TgThemeParams | null
  platform: string
  safeArea: { top: number; bottom: number; left: number; right: number }
  contentSafeArea: { top: number; bottom: number; left: number; right: number }
  viewportHeight: number
  viewportStableHeight: number
}

const TelegramContext = createContext<TelegramContextType>({
  ready: false,
  isDark: true,
  theme: null,
  platform: 'unknown',
  safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  contentSafeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  viewportHeight: 0,
  viewportStableHeight: 0,
})

function readSafeArea() {
  const s = viewport.safeAreaInsets()
  return { top: s?.top ?? 0, bottom: s?.bottom ?? 0, left: s?.left ?? 0, right: s?.right ?? 0 }
}

function readContentSafeArea() {
  const s = viewport.contentSafeAreaInsets()
  return { top: s?.top ?? 0, bottom: s?.bottom ?? 0, left: s?.left ?? 0, right: s?.right ?? 0 }
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [theme, setTheme] = useState<TgThemeParams | null>(null)
  const [platform, setPlatform] = useState('unknown')
  const [safeArea, setSafeArea] = useState({ top: 0, bottom: 0, left: 0, right: 0 })
  const [contentSafeArea, setContentSafeArea] = useState({ top: 0, bottom: 0, left: 0, right: 0 })
  const [viewportHeight, setViewportHeight] = useState(0)
  const [viewportStableHeight, setViewportStableHeight] = useState(0)

  useEffect(() => {
    try {
      init()
      miniApp.mountSync()
      themeParams.mountSync()
      viewport.expand()
      miniApp.ready()

      setPlatform(navigator.userAgent.includes('Telegram') ? 'telegram' : 'browser')
      setIsDark(miniApp.isDark() ?? true)
      setTheme(themeParams.state())
      setSafeArea(readSafeArea())
      setContentSafeArea(readContentSafeArea())
      setViewportHeight(viewport.height())
      setViewportStableHeight(viewport.stableHeight())

      const unbindMiniApp = miniApp.bindCssVars()
      const unbindTheme = themeParams.bindCssVars()
      const unbindViewport = viewport.bindCssVars()

      const unsubDark = miniApp.isDark.sub(() => setIsDark(miniApp.isDark() ?? true))
      const unsubTheme = themeParams.state.sub(() => setTheme(themeParams.state()))
      const unsubHeight = viewport.height.sub(() => setViewportHeight(viewport.height()))
      const unsubStable = viewport.stableHeight.sub(() => setViewportStableHeight(viewport.stableHeight()))
      const unsubSafe = viewport.safeAreaInsets.sub(() => setSafeArea(readSafeArea()))
      const unsubContent = viewport.contentSafeAreaInsets.sub(() => setContentSafeArea(readContentSafeArea()))

      setReady(true)

      return () => {
        unbindMiniApp()
        unbindTheme()
        unbindViewport()
        unsubDark()
        unsubTheme()
        unsubHeight()
        unsubStable()
        unsubSafe()
        unsubContent()
        miniApp.unmount()
        themeParams.unmount()
        viewport.unmount()
      }
    } catch (err) {
      console.warn('Telegram SDK init failed, running in browser mode:', err)
      setPlatform('browser')
      setViewportHeight(window.innerHeight)
      setViewportStableHeight(window.innerHeight)
      setReady(true)
    }
  }, [])

  return (
    <TelegramContext.Provider value={{ ready, isDark, theme, platform, safeArea, contentSafeArea, viewportHeight, viewportStableHeight }}>
      {children}
    </TelegramContext.Provider>
  )
}

export const useTelegram = () => useContext(TelegramContext)
