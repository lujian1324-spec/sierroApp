import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Share2, BarChart3, WifiOff, Leaf, AlertTriangle, RefreshCw } from 'lucide-react'
import BatteryRing from '../components/BatteryRing'
import { useDeviceStore } from '../stores/deviceStore'
import { fetchHistoryData, mapFieldsToRealtime, type HistoryDataResponse } from '../api/deviceApi'

const periods = ['Day', 'Week', 'Month', 'Range'] as const
type Period = typeof periods[number]

// ─── 图表数据结构（从 API 数据转换而来） ───

interface ChartFrame {
  input: number[]
  output: number[]
  soc: number[]
  labels: string[]
  co2Kg: number
  totalInputKwh: number
  totalOutputKwh: number
  insight: string
  ecoInsight: string
}

// ─── 按时间段采样/聚合历史数据 ───

function aggregateHistory(
  raw: HistoryDataResponse,
  period: Period
): ChartFrame | null {
  const solar = raw['solarPower'] ?? []
  const output = raw['outputPower'] ?? []
  const socArr = raw['soc'] ?? []

  if (solar.length === 0 && output.length === 0) return null

  // 将原始数据点按时间排序
  const byTime = new Map<string, { solar: number[]; output: number[]; soc: number[] }>()

  const timeToBucket = (ts: string): string => {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ts.slice(0, 10)
    switch (period) {
      case 'Day':
        return `${String(d.getHours()).padStart(2, '0')}:00`
      case 'Week': {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        return days[d.getDay()]
      }
      case 'Month':
        return `${d.getMonth() + 1}/${d.getDate()}`
      case 'Range':
        return `${d.getMonth() + 1}/${d.getDate()}`
    }
  }

  for (const pt of solar) {
    const bucket = timeToBucket(pt.time)
    const entry = byTime.get(bucket) ?? { solar: [], output: [], soc: [] }
    entry.solar.push(Number(pt.value) || 0)
    byTime.set(bucket, entry)
  }
  for (const pt of output) {
    const bucket = timeToBucket(pt.time)
    const entry = byTime.get(bucket) ?? { solar: [], output: [], soc: [] }
    entry.output.push(Number(pt.value) || 0)
    byTime.set(bucket, entry)
  }
  for (const pt of socArr) {
    const bucket = timeToBucket(pt.time)
    const entry = byTime.get(bucket) ?? { solar: [], output: [], soc: [] }
    entry.soc.push(Number(pt.value) || 0)
    byTime.set(bucket, entry)
  }

  // 按时间排序并生成数组
  let entries: [string, { solar: number[]; output: number[]; soc: number[] }][]
  if (period === 'Week') {
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    entries = [...byTime.entries()].sort(
      ([a], [b]) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
    )
  } else {
    entries = [...byTime.entries()].sort()
  }

  // 限制点数
  const maxPoints = period === 'Day' ? 24 : period === 'Week' ? 7 : period === 'Month' ? 30 : 12
  const step = Math.max(1, Math.ceil(entries.length / maxPoints))
  const sampled: typeof entries = []
  for (let i = 0; i < entries.length; i += step) {
    sampled.push(entries[i])
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0)

  const inputData = sampled.map(([, v]) => avg(v.solar))
  const outputData = sampled.map(([, v]) => avg(v.output))
  const socData = sampled.map(([, v]) => avg(v.soc))
  const labels = sampled.map(([k]) => {
    if (period === 'Day') return k // "HH:00"
    if (period === 'Week') return k // "Mon"-"Sun"
    return k // "M/D"
  })

  // 估算总电量 (kWh): 假设每小时采样 → 功率(W) * 1h / 1000
  const hoursPerBucket = period === 'Day' ? 1 : period === 'Week' ? 24 : period === 'Month' ? 24 : 72
  const totalInputKwh = inputData.reduce((s, v) => s + (v * hoursPerBucket) / 1000, 0)
  const totalOutputKwh = outputData.reduce((s, v) => s + (v * hoursPerBucket) / 1000, 0)
  // CO2 估算: ~0.5 kg CO2 per kWh (grid average)
  const co2Kg = (totalInputKwh * 0.5).toFixed(1)

  // 生成 insight
  const maxOutput = Math.max(...outputData, 0)
  const maxOutputIdx = outputData.indexOf(maxOutput)
  let insight = 'Power usage data from device'
  if (period === 'Week' && maxOutputIdx >= 0) {
    insight = `Highest output on ${labels[maxOutputIdx]}`
  } else if (period === 'Day' && maxOutputIdx >= 0) {
    insight = `Peak output around ${labels[maxOutputIdx]}`
  } else if (period === 'Month' && maxOutputIdx >= 0) {
    insight = `Output peaked on ${labels[maxOutputIdx]}`
  }

  const ecoInsight = totalOutputKwh > 0
    ? `Equivalent to driving ${Math.round(totalOutputKwh * 3.5)} fewer miles`
    : 'Connect solar to reduce carbon footprint'

  return {
    input: inputData,
    output: outputData,
    soc: socData,
    labels,
    co2Kg: parseFloat(co2Kg),
    totalInputKwh,
    totalOutputKwh,
    insight,
    ecoInsight,
  }
}

// ─── Demo/Mock 数据（API 失败时的 fallback） ───

function getDemoChartFrame(period: Period): ChartFrame {
  const rng = (min: number, max: number) =>
    Math.round((min + Math.random() * (max - min)) * 10) / 10

  if (period === 'Day') {
    // 24 个点（0:00-23:00），模拟日间太阳能 + 早晚用电高峰
    const labels: string[] = []
    const input: number[] = []
    const output: number[] = []
    const soc: number[] = []
    for (let h = 0; h < 24; h++) {
      labels.push(`${String(h).padStart(2, '0')}:00`)
      // 太阳能：6:00-18:00 有值，正午峰值 ~1200W
      input.push(h >= 6 && h <= 18 ? Math.round(1200 * Math.sin((h - 6) * Math.PI / 12)) : 0)
      // 用电：早晨 6-9 和傍晚 17-22 有峰值
      const isPeak = (h >= 6 && h <= 9) || (h >= 17 && h <= 22)
      output.push(isPeak ? rng(400, 900) : rng(50, 200))
      // SOC：白天充电上升，晚上放电下降，20%-95% 之间
      const socBase = 60 + 30 * Math.sin((h - 8) * Math.PI / 16)
      soc.push(Math.round(Math.max(20, Math.min(95, socBase + rng(-5, 5)))))
    }
    const totalInputKwh = input.reduce((s, v) => s + (v * 1) / 1000, 0)
    const totalOutputKwh = output.reduce((s, v) => s + (v * 1) / 1000, 0)
    const maxOutputIdx = output.indexOf(Math.max(...output))
    return {
      input, output, soc, labels,
      co2Kg: parseFloat((totalInputKwh * 0.5).toFixed(1)),
      totalInputKwh, totalOutputKwh,
      insight: `Peak output around ${labels[maxOutputIdx]}`,
      ecoInsight: `Equivalent to driving ${Math.round(totalOutputKwh * 3.5)} fewer miles`,
    }
  }

  if (period === 'Week') {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const input = labels.map(() => rng(800, 3500))
    const output = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(() => rng(2500, 5000))
      .concat(['Sat', 'Sun'].map(() => rng(1200, 3000)))
    const soc = labels.map(() => rng(30, 90))
    const totalInputKwh = input.reduce((s, v) => s + (v * 24) / 1000, 0)
    const totalOutputKwh = output.reduce((s, v) => s + (v * 24) / 1000, 0)
    const maxOutputIdx = output.indexOf(Math.max(...output))
    return {
      input, output, soc, labels,
      co2Kg: parseFloat((totalInputKwh * 0.5).toFixed(1)),
      totalInputKwh, totalOutputKwh,
      insight: `Highest output on ${labels[maxOutputIdx]}`,
      ecoInsight: `Equivalent to driving ${Math.round(totalOutputKwh * 3.5)} fewer miles`,
    }
  }

  // Month / Range：生成合理的多天数据
  const days = period === 'Month' ? 30 : 90
  const labels: string[] = []
  const input: number[] = []
  const output: number[] = []
  const soc: number[] = []
  for (let i = 0; i < days; i++) {
    const m = Math.floor(i / 30) + 1
    const d = (i % 30) + 1
    labels.push(`${m}/${d}`)
    input.push(rng(1200, 6000))
    output.push(rng(800, 4500))
    soc.push(rng(25, 92))
  }
  // 采样到 maxPoints
  const maxPoints = period === 'Month' ? 30 : 12
  const step = Math.max(1, Math.ceil(labels.length / maxPoints))
  const sLabels = labels.filter((_, i) => i % step === 0)
  const sInput = input.filter((_, i) => i % step === 0)
  const sOutput = output.filter((_, i) => i % step === 0)
  const sSoc = soc.filter((_, i) => i % step === 0)

  const hoursPerBucket = period === 'Month' ? 24 : 72
  const totalInputKwh = sInput.reduce((s, v) => s + (v * hoursPerBucket) / 1000, 0)
  const totalOutputKwh = sOutput.reduce((s, v) => s + (v * hoursPerBucket) / 1000, 0)
  const maxOutputIdx = sOutput.indexOf(Math.max(...sOutput))
  return {
    input: sInput, output: sOutput, soc: sSoc, labels: sLabels,
    co2Kg: parseFloat((totalInputKwh * 0.5).toFixed(1)),
    totalInputKwh, totalOutputKwh,
    insight: `Output peaked on ${sLabels[maxOutputIdx]}`,
    ecoInsight: `Equivalent to driving ${Math.round(totalOutputKwh * 3.5)} fewer miles`,
  }
}

// ─── 加载骨架屏 ───

function ChartSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] animate-pulse" />
        <div className="h-4 w-24 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" />
      </div>
      <div className="h-10 w-32 bg-[rgba(255,255,255,0.03)] rounded animate-pulse mb-2" />
      <div className="h-3 w-48 bg-[rgba(255,255,255,0.03)] rounded animate-pulse" />
    </motion.div>
  )
}

function ChartAreaSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-4 mb-4">
      <div className="h-4 w-28 bg-[rgba(255,255,255,0.05)] rounded animate-pulse mb-4" />
      <div className="h-[140px] bg-[rgba(255,255,255,0.02)] rounded-[14px] animate-pulse" />
    </motion.div>
  )
}

// ─── 空状态（无历史数据） ───

function ChartEmptyState({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-6 bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] mb-4">
      <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
        <BarChart3 size={28} className="text-[#48484A]" />
      </div>
      <p className="text-[14px] font-semibold text-[#FFFFFF] mb-1">No history data yet</p>
      <p className="text-[12px] text-[#8E8E93] text-center leading-relaxed">{message}</p>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════
// StatsPage
// ═══════════════════════════════════════════════════════

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('Day')
  const [historyData, setHistoryData] = useState<HistoryDataResponse | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [useDemo, setUseDemo] = useState(false)

  const {
    devices,
    selectedDeviceId,
    selectedDeviceState,
    loadDevices,
  } = useDeviceStore()

  // 确定当前设备 ID
  const deviceId = useMemo(() => {
    if (selectedDeviceId) return Number(selectedDeviceId)
    return devices[0]?.id ?? null
  }, [selectedDeviceId, devices])

  // 组件挂载时加载设备列表
  useEffect(() => {
    if (devices.length === 0) {
      loadDevices()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 获取实时设备状态（用于 Battery Health）
  const deviceRealtime = useMemo(() => {
    if (!selectedDeviceState?.fields) return null
    return mapFieldsToRealtime(selectedDeviceState.fields)
  }, [selectedDeviceState])

  // 加载历史数据
  const loadHistory = useCallback(async () => {
    if (!deviceId) return
    setHistoryLoading(true)
    setHistoryError(null)

    const now = new Date()
    let fromTime: Date
    let count: number
    switch (period) {
      case 'Day':
        fromTime = new Date(now.getTime() - 24 * 3600 * 1000)
        count = 288
        break
      case 'Week':
        fromTime = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
        count = 336
        break
      case 'Month':
        fromTime = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
        count = 720
        break
      case 'Range':
        fromTime = new Date(now.getTime() - 90 * 24 * 3600 * 1000)
        count = 720
        break
    }

    try {
      const result = await fetchHistoryData({
        deviceId,
        keys: ['solarPower', 'outputPower', 'soc', 'batteryTemp'],
        fromTime: fromTime.toISOString(),
        toTime: now.toISOString(),
        page: 1,
        count,
        orderByTimeAsc: true,
      })

      if ((result.code === 0 || result.code === '0') && result.data) {
        setHistoryData(result.data)
        setUseDemo(false) // 成功时切回真实数据
      } else {
        setHistoryError(result.message || 'Failed to load history data')
        setUseDemo(true)
      }
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : 'Unknown error'
      )
      setUseDemo(true)
    } finally {
      setHistoryLoading(false)
    }
  }, [deviceId, period, retryCount])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // 解析图表数据
  const chartFrame = useMemo(() => {
    if (historyData) return aggregateHistory(historyData, period)
    if (useDemo) return getDemoChartFrame(period)
    return null
  }, [historyData, period, useDemo])

  // 生成 SVG path
  const generateAreaPath = (data: number[], width: number, height: number) => {
    const max = Math.max(...data, 1)
    const padding = 4
    const usableWidth = width - padding * 2
    const usableHeight = height - padding * 2

    const points = data.map((val, i) => ({
      x: padding + (i / (data.length - 1)) * usableWidth,
      y: padding + usableHeight - (val / max) * usableHeight,
    }))

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

    return { linePath, areaPath }
  }

  // ═══════════════════════════════════════════════════
  // 设备相关数据
  // ═══════════════════════════════════════════════════
  const hasDevice = deviceId !== null
  const soc = deviceRealtime?.soc ?? 0
  const batteryTemp = deviceRealtime?.batteryTemp ?? 0
  const batteryHealth = 95 // 默认值，API 不直接返回
  const isWeek = period === 'Week'
  const isDataLoaded = chartFrame !== null

  // 设备名称
  const deviceName = useMemo(() => {
    if (!deviceId) return null
    const dev = devices.find(d => d.id === deviceId)
    return dev?.name ?? dev?.serialNumber ?? `Device #${deviceId}`
  }, [deviceId, devices])

  // 总运行天数（从设备安装日期估算）
  const deviceDays = useMemo(() => {
    if (!deviceId) return 0
    const dev = devices.find(d => d.id === deviceId)
    if (!dev?.installedAt) return 0
    const installed = new Date(dev.installedAt)
    if (isNaN(installed.getTime())) return 0
    return Math.max(1, Math.floor((Date.now() - installed.getTime()) / (24 * 3600 * 1000)))
  }, [deviceId, devices])

  // ═══════════════════════════════════════════════════
  // 渲染
  // ═══════════════════════════════════════════════════

  // 无设备
  const noDevice = (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8">
      <div className="w-16 h-16 rounded-2xl bg-[#1C1C1E] flex items-center justify-center mb-4">
        <BarChart3 size={32} className="text-[#48484A]" />
      </div>
      <h3 className="text-[16px] font-bold text-[#FFFFFF] mb-2">No Data Yet</h3>
      <p className="text-[13px] text-[#8E8E93] text-center leading-relaxed mb-6">
        Connect a device to start tracking energy usage and statistics.
      </p>
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1C1C1E] border border-[rgba(255,255,255,0.06)]">
        <WifiOff size={14} className="text-[#48484A]" />
        <span className="text-[12px] text-[#48484A]">No device connected</span>
      </div>
    </motion.div>
  )

  // 错误状态
  const errorState = (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-6 bg-[#1C1C1E] border border-[rgba(255,59,48,0.15)] rounded-[20px] mb-4">
      <div className="w-12 h-12 rounded-xl bg-[rgba(255,59,48,0.1)] flex items-center justify-center mb-3">
        <AlertTriangle size={24} className="text-[#FF3B30]" />
      </div>
      <p className="text-[14px] font-semibold text-[#FFFFFF] mb-1">Failed to load data</p>
      <p className="text-[12px] text-[#8E8E93] text-center mb-4 max-w-[240px]">{historyError}</p>
      <button
        onClick={() => setRetryCount(c => c + 1)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#01D6BE] text-[#000000] text-[13px] font-semibold hover:opacity-90 transition-opacity"
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </motion.div>
  )

  // 空历史：仅在无数据且非 demo 模式时显示
  const emptyHistory = !historyLoading && !isDataLoaded && !useDemo
    ? (
      <ChartEmptyState
        message={
          hasDevice
            ? `Historical power data will appear here after your device has been running for a while.`
            : `Select a device to view its energy statistics.`
        }
      />
    ) : null

  return (
    <div className="h-full flex flex-col bg-[#000000] overflow-hidden pt-6">
      {/* Header */}
      <div className="px-5 pt-8 pb-2 safe-area-top flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-[#FFFFFF]">Energy Stats</h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            {deviceDays > 0
              ? `${deviceDays} Days · ${deviceName ?? 'Device'}`
              : (deviceName ? `${deviceName}` : 'Select a device')
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] text-[#8E8E93] hover:text-[#01D6BE] transition-colors"
            onClick={() => {
              if (navigator.share && chartFrame) {
                navigator.share({
                  title: 'Sierro Energy Stats',
                  text: `CO2 Reduced: ${chartFrame.co2Kg} kg`,
                  url: window.location.href,
                }).catch(() => {})
              }
            }}
          >
            <Share2 size={18} />
          </button>
          <div className="flex bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-full p-1">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all duration-200
                  ${period === p ? 'bg-[#01D6BE] text-[#000000]' : 'text-[#8E8E93] hover:text-[#FFFFFF]'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {!hasDevice && noDevice}

        {hasDevice && (
          <>
            {/* Demo Mode Banner */}
            {useDemo && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-2.5 mb-3 rounded-[14px] bg-[rgba(255,204,0,0.08)] border border-[rgba(255,204,0,0.18)]"
              >
                <AlertTriangle size={14} className="text-[#FFCC00] flex-shrink-0" />
                <span className="text-[11px] text-[#FFCC00] flex-1 leading-snug">
                  Demo mode — connect device for real data
                </span>
                <button
                  onClick={() => { setUseDemo(false); setRetryCount(c => c + 1); }}
                  className="text-[11px] text-[#01D6BE] font-semibold hover:opacity-80 transition-opacity ml-1"
                >
                  Retry
                </button>
              </motion.div>
            )}

            {/* Loading skeleton */}
            {historyLoading && (
              <>
                <ChartSkeleton />
                <ChartAreaSkeleton />
              </>
            )}

            {/* Error or empty */}
            {!historyLoading && !isDataLoaded && emptyHistory}

            {/* Data loaded */}
            {!historyLoading && isDataLoaded && chartFrame && (
              <>
                {/* CO2 Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-5 mb-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-[rgba(1,214,190,0.15)]" />
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(52,199,89,0.1)] flex items-center justify-center">
                      <Leaf size={16} className="text-[#34C759]" />
                    </div>
                    <span className="text-[13px] font-semibold text-[#FFFFFF]">CO2 Reduced</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-[36px] font-extrabold text-[#34C759] leading-none">
                      {chartFrame.co2Kg}
                    </span>
                    <span className="text-[14px] text-[#8E8E93]">Kg</span>
                  </div>
                  <p className="text-[12px] text-[#8E8E93]">{chartFrame.ecoInsight}</p>
                </motion.div>

                {/* Input vs Output Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-4 mb-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm font-bold text-[#FFFFFF]">Input vs Output</div>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
                        <div className="w-2 h-2 rounded-full bg-[#01D6BE]" />
                        <span>Solar (W)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
                        <div className="w-2 h-2 rounded-full bg-[#01A88F]" />
                        <span>Output (W)</span>
                      </div>
                    </div>
                  </div>

                  {isWeek ? (
                    /* Week: Dual Bar Chart */
                    <div>
                      <div className="flex items-end gap-2 h-[140px]">
                        {chartFrame.input.map((input, i) => {
                          const maxVal = Math.max(...chartFrame.input, ...chartFrame.output, 1)
                          return (
                            <div key={i} className="flex-1 flex items-end gap-0.5 h-full">
                              <div
                                className="flex-1 rounded-t bg-[#01D6BE] min-h-[2px] transition-all duration-500"
                                style={{ height: `${(input / maxVal) * 100}%` }}
                              />
                              <div
                                className="flex-1 rounded-t bg-[#01A88F] min-h-[2px] transition-all duration-500"
                                style={{ height: `${(chartFrame.output[i] / maxVal) * 100}%` }}
                              />
                            </div>
                          )
                        })}
                      </div>
                      <div className="h-px bg-[rgba(1,214,190,0.08)] my-1.5" />
                      <div className="flex gap-2">
                        {chartFrame.labels.map((day) => (
                          <div key={day} className="flex-1 text-center text-[9px] text-[#48484A]">{day}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Day/Month/Range: Line + Area Chart */
                    <div>
                      <svg viewBox="0 0 340 160" className="w-full h-[140px]">
                        {(() => {
                          const { linePath, areaPath } = generateAreaPath(chartFrame.input, 340, 140)
                          return (
                            <g>
                              <path d={areaPath} fill="rgba(1,214,190,0.1)" />
                              <path d={linePath} fill="none" stroke="#01D6BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                          )
                        })()}
                        {(() => {
                          const { linePath, areaPath } = generateAreaPath(chartFrame.output, 340, 140)
                          return (
                            <g>
                              <path d={areaPath} fill="rgba(1,168,143,0.08)" />
                              <path d={linePath} fill="none" stroke="#01A88F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                          )
                        })()}
                      </svg>
                      <div className="flex justify-between px-1">
                        {chartFrame.labels.filter((_, i) => i % Math.max(1, Math.floor(chartFrame.labels.length / 6)) === 0).map((label) => (
                          <span key={label} className="text-[9px] text-[#48484A]">{label}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Insight */}
                  <div className="mt-4 pt-3 border-t border-[rgba(1,214,190,0.06)]">
                    <p className="text-[11px] text-[#8E8E93]">
                      <span className="text-[#01D6BE] font-semibold">Insight: </span>
                      {chartFrame.insight}
                    </p>
                  </div>
                </motion.div>
              </>
            )}

            {/* Battery Health Card (使用真实设备状态) */}
            {hasDevice && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-bold text-[#FFFFFF]">Battery Health</div>
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[rgba(52,199,89,0.12)] text-[#34C759] border border-[rgba(52,199,89,0.25)] text-[10px] font-semibold">
                    Good
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <BatteryRing
                      percentage={soc}
                      size={160}
                      strokeWidth={18}
                      isCharging={false}
                      uid="stats-page"
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                      <div className="text-[14px] font-bold text-[#FFFFFF]">{soc}%</div>
                      <div className="text-[9px] text-[#8E8E93] mt-0.5">Charge</div>
                    </div>
                    <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                      <div className="text-[14px] font-bold text-[#34C759]">
                        {batteryTemp > 0 ? `${batteryTemp}°C` : '--'}
                      </div>
                      <div className="text-[9px] text-[#8E8E93] mt-0.5">Temp</div>
                    </div>
                    <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                      <div className="text-[14px] font-bold text-[#01D6BE]">{deviceDays}</div>
                      <div className="text-[9px] text-[#8E8E93] mt-0.5">Days</div>
                    </div>
                    <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                      <div className="text-[14px] font-bold text-[#FF9500]">{batteryHealth}%</div>
                      <div className="text-[9px] text-[#8E8E93] mt-0.5">Health</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
