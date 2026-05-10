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

        try {
          const result = await loginByAccount(username, password)

          if (isSuccess(result.code) && result.data) {
            set({ isAuthenticated: true, user: result.data, loading: false, error: null })
            return true
          }

          // 业务失败：展示后端返回的错误信息
          const msg = result.localMessage ?? result.message ?? result.msg ?? 'Login failed'
          set({ loading: false, error: msg, isAuthenticated: false })
          return false
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Network error — please try again'
          set({ loading: false, error: msg, isAuthenticated: false })
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
