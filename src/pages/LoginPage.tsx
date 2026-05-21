import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  // Social login handlers (placeholder)
  const handleGoogleLogin = async () => {
    // Placeholder: navigate to email login for now
    // In production, this would use Google OAuth
    navigate('/register')
  }

  const handleAppleLogin = async () => {
    // Placeholder: navigate to email login for now
    navigate('/register')
  }

  const handleEmailLogin = () => {
    // Navigate to existing email login form
    navigate('/register')
  }

  const handleGuestContinue = () => {
    // Allow guest access without login
    // For now, use the existing auth mechanism
    login('guest', 'guest')
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
          className="mb-12 flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 rounded-[22px] bg-[rgba(1,214,190,0.12)] border border-[rgba(1,214,190,0.3)]
            flex items-center justify-center">
            <Zap size={32} className="text-[#01D6BE]" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#FFFFFF]">Sierro</h1>
          </div>
        </motion.div>

        {/* Sign up or log in heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-center mb-8"
        >
          <h2 className="text-[20px] font-bold text-[#FFFFFF] mb-1">Sign up or log in</h2>
        </motion.div>

        {/* Social Login Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full max-w-sm mx-auto space-y-3"
        >
          {/* Continue with Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-[14px] bg-[#FFFFFF] text-[#000000] text-[14px] font-semibold
              flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Continue with Apple */}
          <button
            onClick={handleAppleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-[14px] bg-[#FFFFFF] text-[#000000] text-[14px] font-semibold
              flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </button>

          {/* OR Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)]" />
            <span className="text-[12px] text-[#8E8E93] font-medium">OR</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)]" />
          </div>

          {/* Continue with Email */}
          <button
            onClick={handleEmailLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-[14px] bg-[#1C1C1E] border border-[rgba(1,214,190,0.15)] text-[#FFFFFF] text-[14px] font-semibold
              flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <Mail size={18} className="text-[#01D6BE]" />
            Continue with Email
          </button>

          {/* Error display */}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-[12px] text-[#FF3B30] text-center">
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Bottom section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="pb-10 pt-4 text-center space-y-4"
      >
        {/* Continue as Guest */}
        <button
          onClick={handleGuestContinue}
          className="text-[13px] text-[#8E8E93] hover:text-[#01D6BE] transition-colors"
        >
          Continue as Guest
        </button>

        {/* Terms & Privacy */}
        <p className="text-[11px] text-[#48484A] leading-relaxed">
          By continuing, you agree to our{' '}
          <button className="text-[#8E8E93] hover:text-[#01D6BE] transition-colors">Terms of Use</button>
          {' '}and{' '}
          <button className="text-[#8E8E93] hover:text-[#01D6BE] transition-colors">Privacy Policy</button>
        </p>
      </motion.div>
    </div>
  )
}
