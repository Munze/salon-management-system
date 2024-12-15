import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import authService from '../services/authService'

interface AuthState {
  accessToken: string | null
  user: {
    id: string
    email: string
    name: string
  } | null
  isAuthenticated: boolean
  login: (accessToken: string, user: any) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      login: (accessToken, user) => set({ accessToken, user, isAuthenticated: true }),
      logout: () => {
        authService.clearTokens();
        set({ accessToken: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
