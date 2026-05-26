import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  initTheme: () => void
}

// ─── Resolve the actual light/dark value from a theme setting ─────────────
function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

// ─── Apply theme to <html> with a short CSS transition injected
//     once so the class flip is always animated, then cleaned up ────────────
function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement

  // Inject a one-shot transition style so every property animates
  // when the class changes — this is what makes the switch seamless.
  // We remove the <style> tag right after the transition ends so it
  // doesn't interfere with component-level transitions.
  const existing = document.getElementById('theme-transition-style')
  if (!existing) {
    const style = document.createElement('style')
    style.id = 'theme-transition-style'
    style.textContent = `
      *, *::before, *::after {
        transition:
          background-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
          border-color     300ms cubic-bezier(0.4, 0, 0.2, 1),
          color            200ms cubic-bezier(0.4, 0, 0.2, 1),
          fill             200ms cubic-bezier(0.4, 0, 0.2, 1),
          stroke           200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
    `
    document.head.appendChild(style)
    // Remove after the longest transition finishes
    window.setTimeout(() => style.remove(), 350)
  }

  root.classList.toggle('dark', resolved === 'dark')
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme:         'system',
      resolvedTheme: 'light',

      setTheme: (theme) => {
        const resolved = resolve(theme)
        applyTheme(resolved)
        set({ theme, resolvedTheme: resolved })
      },

      initTheme: () => {
        const { theme, setTheme } = get()

        // Apply immediately (no transition on first load to avoid flash)
        const resolved = resolve(theme)
        document.documentElement.classList.toggle('dark', resolved === 'dark')
        set({ resolvedTheme: resolved })

        // Watch for system preference changes
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        mq.addEventListener('change', () => {
          if (get().theme === 'system') setTheme('system')
        })
      },
    }),
    {
      name:        'shoppintrest-theme',
      partialize:  (s) => ({ theme: s.theme }),
    }
  )
)