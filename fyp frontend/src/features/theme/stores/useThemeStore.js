import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
    persist(
        (set) => ({
            theme: 'dark', // Default theme
            toggleTheme: () => set((state) => {
                const newTheme = state.theme === 'dark' ? 'light' : 'dark'
                // Directly side-effect to ensure immediate update, though useEffect in component is cleaner, this works for global
                if (newTheme === 'light') {
                    document.body.classList.add('light-theme')
                } else {
                    document.body.classList.remove('light-theme')
                }
                return { theme: newTheme }
            }),
            setTheme: (theme) => {
                if (theme === 'light') {
                    document.body.classList.add('light-theme')
                } else {
                    document.body.classList.remove('light-theme')
                }
                set({ theme })
            }
        }),
        {
            name: 'brickchain-theme-storage',
            getStorage: () => localStorage,
            onRehydrateStorage: () => (state) => {
                // Ensure class is applied on load
                if (state && state.theme === 'light') {
                    document.body.classList.add('light-theme')
                } else {
                    document.body.classList.remove('light-theme')
                }
            }
        }
    )
)
