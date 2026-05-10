/**
 * 认证状态管理
 * T17: 真实 API 优先登录，失败时降级 admin/admin（Dev 模式）
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loginByAccount, logout, isLoggedIn, LoginData } from '../api/authApi'

interface AuthState {
  isAuthenticated: boolean
  user: LoginData | null
  loading: boolean
  error: string | null

  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

/** 判断业务响应码是否成功 */
function isSuccess(code: number | string): boolean {
  return (
    code === 200 || code === '200' ||
    code === 0   || code === '0'   ||
    code === 'success'
  )
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: isLoggedIn(),
      user: null,
      loading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ loading: true, error: null })

        // ── 1. 尝试真实 API 登录 ──
        try {
          const result = await loginByAccount(username, password)

          if (isSuccess(result.code) && result.data) {
            set({ isAuthenticated: true, user: result.data, loading: false, error: null })
            return true
          }

          // 真实 API 返回业务失败（如密码错误）
          // 若用户名/密码是 admin/admin → 允许 Dev 降级登录
          if (username === 'admin' && password === 'admin') {
            set({ isAuthenticated: true, user: { username: 'admin', isDev: true }, loading: false, error: null })
            return true
          }

          const msg = result.message ?? result.msg ?? 'Invalid credentials'
          set({ loading: false, error: msg, isAuthenticated: false })
          return false
        } catch {
          // ── 2. 网络不可达 → Dev 降级（admin/admin 通行）──
          if (username === 'admin' && password === 'admin') {
            set({ isAuthenticated: true, user: { username: 'admin', isDev: true }, loading: false, error: null })
            return true
          }

          set({ loading: false, error: 'Network error — please try again', isAuthenticated: false })
          return false
        }
      },

      logout: async () => {
        await logout()
        set({ isAuthenticated: false, user: null, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'iot-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
)
