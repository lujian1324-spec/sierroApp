/**
 * Sierro Inc. - 设备 API
 * T13: 设备列表 /device/list
 * T14: 实时状态 /remote/device/state/latest（轮询）
 * T15: 端口控制 /remote/device/config/write
 * T16: 历史数据 /device/attribute/history
 * T18: Smart Schedule /peak/valley 削峰填谷接口
 */

import { api } from '../utils/apiClient'
import type { ApiResponse } from '../utils/apiClient'

// ═══════════════════════════════════════════════════════
// T13: 设备列表
// ═══════════════════════════════════════════════════════

export interface DeviceListItem {
  deviceId: string
  deviceName: string
  deviceType: string
  status: 'online' | 'offline'
  firmwareVersion?: string
  lastOnlineTime?: number
}

export interface DeviceListRequest {
  pageNumber?: number
  pageSize?: number
}

export interface DeviceListResponse {
  list: DeviceListItem[]
  total: number
  pageNumber: number
  pageSize: number
}

/** 获取设备列表（分页） */
export async function fetchDeviceList(
  page = 1,
  size = 20
): Promise<ApiResponse<DeviceListResponse>> {
  return api.post<DeviceListResponse>('/device/list', {
    pageNumber: page,
    pageSize: size,
  })
}

/** 获取设备详情 */
export async function fetchDeviceDetails(
  deviceId: string
): Promise<ApiResponse<DeviceListItem>> {
  return api.get<DeviceListItem>(`/device/details?deviceId=${deviceId}`)
}

// ═══════════════════════════════════════════════════════
// T14: 实时状态
// ═══════════════════════════════════════════════════════

/** 设备实时状态字段（常见 key） */
export interface DeviceRealtimeState {
  soc?: number            // 电量 %
  batteryPower?: number   // 电池功率 W（正=充，负=放）
  acPower?: number        // AC 输入功率 W
  solarPower?: number     // 光伏功率 W
  outputPower?: number    // 输出功率 W
  batteryTemp?: number    // 电池温度 °C
  acOut1Enable?: boolean  // AC Output 1 开关
  acOut2Enable?: boolean  // AC Output 2 开关
  usbOut1Enable?: boolean // USB 输出 1 开关
  sleepMode?: boolean     // 睡眠模式
  workMode?: 0 | 1 | 2   // 0=正常 1=备份 2=节能
  [key: string]: unknown  // 其他自定义字段
}

export interface DeviceStateResponse {
  fields: Record<string, unknown>
  firingAlarms: Array<{
    alarmId: string
    alarmCode: string
    alarmMessage: string
    severity: 'info' | 'warning' | 'critical'
    timestamp: number
  }>
}

/** 获取设备最新实时状态 */
export async function fetchDeviceState(
  deviceId: string
): Promise<ApiResponse<DeviceStateResponse>> {
  return api.get<DeviceStateResponse>(
    `/remote/device/state/latest?deviceId=${deviceId}`
  )
}

/** 启动设备速报（近实时推送，需持续调用） */
export async function startFastReport(deviceId: string): Promise<ApiResponse<unknown>> {
  return api.post<unknown>(
    `/remote/device/state/report/fast/start?deviceId=${deviceId}`
  )
}

// ═══════════════════════════════════════════════════════
// T15: 端口控制
// ═══════════════════════════════════════════════════════

export interface DeviceControlRequest {
  key: string
  value: string | number | boolean
}

/**
 * 远程写入设备配置
 * @param deviceId 设备 ID
 * @param key 控制 key（如 acOut1Enable、workMode、sleepMode 等）
 * @param value 目标值
 */
export async function writeDeviceConfig(
  deviceId: string,
  key: string,
  value: string | number | boolean
): Promise<ApiResponse<unknown>> {
  return api.post<unknown>(
    `/remote/device/config/write?deviceId=${deviceId}`,
    { key, value }
  )
}

/** 便捷方法：切换 AC 输出 1 */
export const toggleAcOut1 = (deviceId: string, enable: boolean) =>
  writeDeviceConfig(deviceId, 'acOut1Enable', enable)

/** 便捷方法：切换 AC 输出 2 */
export const toggleAcOut2 = (deviceId: string, enable: boolean) =>
  writeDeviceConfig(deviceId, 'acOut2Enable', enable)

/** 便捷方法：切换睡眠模式 */
export const toggleSleepMode = (deviceId: string, enable: boolean) =>
  writeDeviceConfig(deviceId, 'sleepMode', enable)

/** 便捷方法：切换工作模式 */
export const setWorkMode = (deviceId: string, mode: 0 | 1 | 2) =>
  writeDeviceConfig(deviceId, 'workMode', mode)

// ═══════════════════════════════════════════════════════
// T16: 历史数据
// ═══════════════════════════════════════════════════════

export interface HistoryDataRequest {
  deviceId: string
  attributeKeys: string[]
  startTime: number   // Unix ms
  endTime: number     // Unix ms
  interval?: number   // 采样间隔秒（可选，后端自适应）
}

export interface HistoryDataPoint {
  timestamp: number
  value: number | string
}

export interface HistoryDataResponse {
  [key: string]: HistoryDataPoint[]
}

/** 获取设备历史数据 */
export async function fetchHistoryData(
  req: HistoryDataRequest
): Promise<ApiResponse<HistoryDataResponse>> {
  return api.post<HistoryDataResponse>('/device/attribute/history', req)
}

/** 便捷：获取最近 N 小时的指定属性历史 */
export function fetchRecentHistory(
  deviceId: string,
  keys: string[],
  hoursAgo = 24
) {
  const endTime = Date.now()
  const startTime = endTime - hoursAgo * 3600 * 1000
  return fetchHistoryData({ deviceId, attributeKeys: keys, startTime, endTime })
}

// ═══════════════════════════════════════════════════════
// T17: 登录鉴权（真实 API，已在 authApi.ts，此处补充 token 刷新）
// ═══════════════════════════════════════════════════════

/** 刷新 Access Token */
export async function refreshAccessToken(
  refreshToken: string
): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
  return api.postNoSign('/login/refresh/access/token', { refreshToken })
}

// ═══════════════════════════════════════════════════════
// T18: Smart Schedule / 削峰填谷接口
// ═══════════════════════════════════════════════════════

export interface PeakValleyBundle {
  enabled: boolean
  general?: {
    chargeStartTime: string   // HH:mm
    chargeEndTime: string
    dischargeStartTime: string
    dischargeEndTime: string
    chargePower: number
    dischargePower: number
    minSoc: number
    maxSoc: number
  }
  customized?: Array<{
    id: string
    name: string
    type: 'charge' | 'discharge'
    startTime: string
    endTime: string
    enabled: boolean
  }>
}

/** 获取削峰填谷完整配置 */
export async function fetchPeakValleyBundle(
  deviceId: string
): Promise<ApiResponse<PeakValleyBundle>> {
  return api.get<PeakValleyBundle>(`/peak/valley/bundle?deviceId=${deviceId}`)
}

/** 设置常规削峰填谷配置 */
export async function setPeakValleyGeneral(
  deviceId: string,
  config: PeakValleyBundle['general']
): Promise<ApiResponse<unknown>> {
  return api.post<unknown>('/peak/valley/general', {
    deviceId,
    ...config,
  })
}

/** 设置自定义削峰填谷时段 */
export async function setPeakValleyCustomized(
  deviceId: string,
  schedules: PeakValleyBundle['customized']
): Promise<ApiResponse<unknown>> {
  return api.post<unknown>('/peak/valley/customized', {
    deviceId,
    schedules,
  })
}

/** 启用/禁用削峰填谷 */
export async function setPeakValleyEnabled(
  deviceId: string,
  enabled: boolean
): Promise<ApiResponse<unknown>> {
  return api.post<unknown>('/peak/valley/enable', {
    deviceId,
    enabled,
  })
}

// ═══════════════════════════════════════════════════════
// 告警 API（T11 补充）
// ═══════════════════════════════════════════════════════

export interface AlarmSearchRequest {
  deviceId?: string
  resolved?: boolean
  pageNumber?: number
  pageSize?: number
}

export interface AlarmItem {
  alarmId: string
  alarmCode: string
  alarmMessage: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: number
  resolved: boolean
  deviceId: string
}

/** 查询告警列表 */
export async function fetchAlarms(
  req: AlarmSearchRequest = {}
): Promise<ApiResponse<{ list: AlarmItem[]; total: number }>> {
  return api.post('/alarm/search', req)
}

/** 忽略告警 */
export async function ignoreAlarm(alarmId: string): Promise<ApiResponse<unknown>> {
  return api.post('/alarm/ignore', { alarmId })
}
