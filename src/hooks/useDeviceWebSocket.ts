/**
 * T19: WebSocket 实时推送 hook
 * - 自动重连（指数退避，最大 30s）
 * - 心跳（ping/pong，30s 间隔）
 * - 连接状态 UI 反馈
 *
 * 服务器协议（Sierro Open API WebSocket）：
 * ws://solar.siseli.com/openapis/ws?token=<accessToken>
 * 推送消息格式：{ type: 'state', deviceId: string, fields: Record<string,unknown>, firingAlarms: [] }
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { tokenStore } from '../utils/apiClient'
import { usePowerStationStore } from '../stores/powerStationStore'

const WS_BASE = 'wss://solar.siseli.com/openapis/ws'
const HEARTBEAT_INTERVAL = 30_000  // 30s
const MAX_RECONNECT_DELAY = 30_000 // 最大重连间隔
const BASE_RECONNECT_DELAY = 1_000 // 初始重连间隔

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface WsMessage {
  type: string
  deviceId?: string
  fields?: Record<string, unknown>
  firingAlarms?: Array<{ alarmId: string; alarmCode: string; severity: string; timestamp: number }>
}

export interface UseDeviceWsOptions {
  deviceId?: string
  enabled?: boolean
  onMessage?: (msg: WsMessage) => void
}

export function useDeviceWebSocket(opts: UseDeviceWsOptions = {}) {
  const { deviceId, enabled = true, onMessage } = opts
  const [status, setStatus] = useState<WsStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectCountRef = useRef(0)
  const mountedRef = useRef(true)
  const { powerStation } = usePowerStationStore()

  const clearTimers = () => {
    if (pingTimerRef.current) { clearInterval(pingTimerRef.current); pingTimerRef.current = null }
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null }
  }

  const connect = useCallback(() => {
    const token = tokenStore.get()
    if (!token || !enabled) return

    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setStatus('connecting')
    const url = `${WS_BASE}?token=${encodeURIComponent(token)}${deviceId ? `&deviceId=${deviceId}` : ''}`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setStatus('connected')
        reconnectCountRef.current = 0

        // 心跳
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, HEARTBEAT_INTERVAL)
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const msg = JSON.parse(event.data as string) as WsMessage
          if (msg.type === 'pong') return
          onMessage?.(msg)
        } catch {/* ignore malformed */}
      }

      ws.onerror = () => {
        if (!mountedRef.current) return
        setStatus('error')
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setStatus('disconnected')
        clearTimers()

        if (!enabled) return

        // 指数退避重连
        const delay = Math.min(
          BASE_RECONNECT_DELAY * Math.pow(2, reconnectCountRef.current),
          MAX_RECONNECT_DELAY
        )
        reconnectCountRef.current++
        reconnectTimerRef.current = setTimeout(connect, delay)
      }
    } catch {
      setStatus('error')
    }
  }, [deviceId, enabled, onMessage])

  const disconnect = useCallback(() => {
    clearTimers()
    wsRef.current?.close()
    wsRef.current = null
    setStatus('disconnected')
  }, [])

  useEffect(() => {
    mountedRef.current = true
    // 仅当有真实 Token（非 dev 模式）且 enabled 时连接
    const token = tokenStore.get()
    if (token && enabled) {
      connect()
    }
    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [connect, disconnect, enabled])

  return { status, connect, disconnect }
}
