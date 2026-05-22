import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Mail, User, Lock, Eye, EyeOff, Loader2, ChevronRight, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const { login, loading, error, clearError, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // 登录表单状态
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  // 登录成功后自动跳转
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 账号密码登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!account.trim() || !password.trim()) return

    const ok = await login(account.trim(), password)
    if (ok) {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col px-6">
      {/* Top spacing */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 rounded-[22px] bg-[rgba(1,214,190,0.12)] border border-[rgba(1,214,190,0.3)]
            flex items-center justify-center">
            <Zap size={32} className="text-[#01D6BE]" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#FFFFFF]">Sierro</h1>
            <p className="text-[12px] text-[#8E8E93] mt-1">Smart Energy Management</p>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="text-[20px] font-bold text-[#FFFFFF] mb-1">Welcome</h2>
          <p className="text-[13px] text-[#8E8E93]">Sign in to manage your devices</p>
        </motion.div>

        {/* Account Login Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          onSubmit={handleLogin}
          className="w-full max-w-sm mx-auto space-y-3"
        >
          {/* Account input */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1.5 flex items-center gap-1.5">
              <User size={12} />
              Account
            </label>
            <input
              type="text"
              value={account}
              onChange={e => { setAccount(e.target.value); clearError() }}
              placeholder="Username or email"
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl bg-[#1C1C1E] border border-[rgba(1,214,190,0.15)]
                text-[#FFFFFF] text-[14px] placeholder:text-[#48484A]
                focus:outline-none focus:border-[rgba(1,214,190,0.5)] transition-colors"
            />
          </div>

          {/* Password input */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1.5 flex items-center gap-1.5">
              <Lock size={12} />
              Password
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); clearError() }}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-[#1C1C1E] border border-[rgba(1,214,190,0.15)]
                  text-[#FFFFFF] text-[14px] placeholder:text-[#48484A]
                  focus:outline-none focus:border-[rgba(1,214,190,0.5)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#48484A] hover:text-[#8E8E93]"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error display */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[12px] text-[#FF3B30] text-center py-1"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Sign In button */}
          <button
            type="submit"
            disabled={loading || !account.trim() || !password.trim()}
            className="w-full py-3.5 rounded-xl font-semibold text-[14px]
              bg-[#01D6BE] text-[#000000]
              disabled:opacity-40 disabled:cursor-not-allowed
              active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.form>

        {/* Divider - OR */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="w-full max-w-sm mx-auto my-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
            <span className="text-[11px] text-[#48484A] font-medium">OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
          </div>
        </motion.div>

        {/* Social Login Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-full max-w-sm mx-auto space-y-3"
        >
          {/* Continue with Google */}
          <button
            onClick={() => navigate('/register')}
            disabled={loading}
            className="w-full py-3.5 rounded-[14px] bg-[#1C1C1E] border border-[rgba(255,255,255,0.06)] text-[#FFFFFF] text-[14px] font-medium
              flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          {/* Continue with Apple */}
          <button
            onClick={() => navigate('/register')}
            disabled={loading}
            className="w-full py-3.5 rounded-[14px] bg-[#1C1C1E] border border-[rgba(255,255,255,0.06)] text-[#FFFFFF] text-[14px] font-medium
              flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Apple
          </button>

          {/* Continue with Email */}
          <button
            onClick={() => navigate('/register')}
            disabled={loading}
            className="w-full py-3.5 rounded-[14px] bg-[#1C1C1E] border border-[rgba(1,214,190,0.12)] text-[#FFFFFF] text-[14px] font-medium
              flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <Mail size={18} className="text-[#01D6BE]" />
            Email
          </button>
        </motion.div>
      </div>

      {/* Bottom section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="pb-10 pt-4 text-center space-y-4"
      >
        {/* Sign Up link */}
        <button
          onClick={() => navigate('/register')}
          className="text-[14px] text-[#01D6BE] font-medium
            flex items-center justify-center gap-1 mx-auto hover:opacity-80 transition-opacity"
        >
          <span>Don&apos;t have an account?</span>
          <span className="underline">Sign Up</span>
          <ChevronRight size={14} />
        </button>

        {/* Continue as Guest */}
        <div>
          <button
            onClick={async () => {
              const ok = await login('guest', 'guest')
              if (ok) navigate('/', { replace: true })
            }}
            disabled={loading}
            className="text-[13px] text-[#8E8E93] hover:text-[#FFFFFF] transition-colors"
          >
            Continue as Guest
          </button>
        </div>

        {/* Terms & Privacy */}
        <p className="text-[11px] text-[#48484A] leading-relaxed">
          By continuing, you agree to our{' '}
          <span className="text-[#8E8E93]">Terms of Use</span>
          {' '}and{' '}
          <span className="text-[#8E8E93]">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  )
}
