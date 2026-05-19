import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Admin } from '@/types'

interface AuthState {
  admin: Admin | null
  accessToken: string | null
  setAuth: (admin: Admin, token: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      accessToken: null,
      setAuth: (admin, accessToken) => set({ admin, accessToken }),
      clearAuth: () => set({ admin: null, accessToken: null }),
      isAuthenticated: () => !!get().accessToken && !!get().admin,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ admin: state.admin, accessToken: state.accessToken }),
    }
  )
)
