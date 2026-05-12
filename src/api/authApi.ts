/**
 * Sierro Inc. - 认证 API
 * 登录接口: POST /login/account
 * 登录接口受签名拦截（/login/** 除 /login/logout 均拦截）
 *
 * 重要：密码需 MD5 加密后传输（平台要求，明文密码会返回 code 7）
 */

import CryptoJS from 'crypto-js'
import { api, tokenStore, ApiResponse } from '../utils/apiClient'

// ─── 请求/响应类型 ───

export interface LoginRequest {
  /** 账号（用户名/手机/邮箱） */
  account: string
  /** 密码（MD5 加密后的 32 位小写十六进制字符串） */
  password: string
}

export interface LoginData {
  token?: string
  accessToken?: string
  refreshToken?: string
  accessTokenWillExpiredAt?: string
  refreshTokenWillExpiredAt?: string
  account?: string
  userId?: string
  authId?: string
  userType?: number
  isAdmin?: boolean
  isStationOwner?: boolean
  isIntegrator?: boolean
  isDealer?: boolean
  [key: string]: unknown
}

/** 将明文密码转为 MD5 十六进制小写（平台要求） */
function md5Password(plainPassword: string): string {
  return CryptoJS.MD5(plainPassword).toString(CryptoJS.enc.Hex).toLowerCase()
}

// ─── 登录 ───
export async function loginByAccount(
  username: string,
  plainPassword: string
): Promise<ApiResponse<LoginData>> {
  const payload: LoginRequest = {
    account: username,
    password: md5Password(plainPassword),
  }
  // 登录接口带签名但不带 Authorization
  const result = await api.postSkipAuth<LoginData>('/login/account', payload)

  // 自动保存 token 和 refreshToken
  const accessToken = result.data?.accessToken ?? result.data?.token
  if (accessToken) {
    tokenStore.set(accessToken)
  }
  const refreshToken = result.data?.refreshToken
  if (refreshToken) {
    localStorage.setItem('iot_refresh_token', refreshToken)
  }

  return result
}

// ─── 退出登录 ───
export async function logout(): Promise<void> {
  try {
    await api.post('/login/logout')
  } catch {
    // 忽略退出错误
  } finally {
    tokenStore.clear()
  }
}

// ─── 是否已登录 ───
export function isLoggedIn(): boolean {
  return !!tokenStore.get()
}
