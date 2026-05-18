import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Zap, Globe, Share2, BarChart3, WifiOff, Clock } from 'lucide-react'
import BatteryRing from '../components/BatteryRing'
import { usePowerStationStore } from '../stores/powerStationStore'

const periods = ['Day', 'Week', 'Month'] as const
type Period = typeof periods[number]

const allData = {
  Day: { charge: [0, 0, 12, 30, 55, 70, 48], discharge: [0, 0, 8,  20, 38, 52, 30] },
  Week:  { charge: [55, 70, 48, 78, 62, 40, 28], discharge: [38, 52, 60, 42, 56, 72, 30] },
  Month: { charge: [60, 50, 75, 65, 80, 55, 45], discharge: [45, 40, 65, 55, 70, 48, 35] },
}

const dayLabels = {
  Day: ['0h', '4h', '8h', '12h', '16h', '20h', '24h'],
  Week:  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  Month: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
}

// 统一主题颜色
const themeColor = '#01D6BE'

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('Week')
  const { powerStation } = usePowerStationStore()

  const currentData = allData[period]
  const days = dayLabels[period]

  // 无设备/离线时显示 Empty State（整页）
  const hasData = powerStation.batteryLevel > 0 || powerStation.cycleCount > 0

  // 图表数据检测：所有值均为0时视为无历史数据
  const hasChartData = currentData.charge.some(v => v > 0) || currentData.discharge.some(v => v > 0)

  // ── 图表区域空状态组件 ────────────────────────────────────
  const ChartEmptyState = ({ title, hint }: { title: string; hint: string }) => (
    <div className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-4 mb-4">
      <div className="text-sm font-bold text-[#FFFFFF] mb-4">{title}</div>
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center mb-3">
          <Clock size={24} className="text-[#48484A]" />
        </div>
        <p className="text-[13px] text-[#8E8E93] text-center mb-1">No history data yet</p>
        <p className="text-[11px] text-[#48484A] text-center">{hint}</p>
      </div>
    </div>
  )

  // ── Empty State ──────────────────────────────────────────
  const emptyState = !hasData ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8"
    >
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
  ) : null

  return (
    <div className="h-full flex flex-col bg-[#000000] overflow-hidden pt-6">
      {/* Header */}
      <div className="px-5 pt-8 pb-2 safe-area-top flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-[#FFFFFF]">Energy Stats</h2>
          <p className="text-xs text-[#8E8E93] mt-1">This Week · March 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] text-[#8E8E93] hover:text-[#01D6BE] transition-colors"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'PowerFlow Energy Stats',
                  text: `Total Output: 9.4 kWh · CO₂ Reduced: 6.4 kg`,
                  url: window.location.href,
                })
              } else {
                alert('Share feature not available')
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
                className={`
                  text-[11px] font-semibold px-3 py-1 rounded-full transition-all duration-200
                  ${period === p 
                    ? 'bg-[#01D6BE] text-[#000000]' 
                    : 'text-[#8E8E93] hover:text-[#FFFFFF]'
                  }
                `}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 可滚动内容 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {/* Empty State（无设备） */}
        {emptyState}

        {/* 以下内容仅在有数据时显示 */}
        {hasData && (<>
          {/* 概览卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-2.5 mb-4"
          >
            {[
              { icon: Zap, value: '9.4', unit: 'kWh', label: 'Total Output', trend: '↓ 5%', trendUp: false },
              { icon: Globe, value: '6.4', unit: 'kg', label: 'CO₂ Reduced', trend: '↑ 18%', trendUp: true },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div
                  key={i}
                  className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-4 relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: themeColor }}
                  />
                  <Icon size={18} className="mb-2" style={{ color: themeColor }} />
                  <div className="text-[22px] font-extrabold text-[#FFFFFF] tracking-tight">
                    {stat.value}<small className="text-xs font-normal text-[#8E8E93]">{stat.unit}</small>
                  </div>
                  <div className="text-[11px] text-[#8E8E93] mt-1">{stat.label}</div>
                  <div className={`text-[10px] mt-1 ${stat.trendUp ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {stat.trend} vs Last Week
                  </div>
                </div>
              )
            })}
          </motion.div>

          {/* 柱状图（有数据时） */}
          {hasChartData ? (
            <div className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-bold text-[#FFFFFF]">Weekly Charge / Discharge</div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
                    <div className="w-2 h-2 rounded-full bg-[#01D6BE]" />
                    <span>Charge</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
                    <div className="w-2 h-2 rounded-full bg-[#01A88F]" />
                    <span>Usage</span>
                  </div>
                </div>
              </div>
              
              {/* 柱子 */}
              <div className="flex items-end gap-1.5 h-[140px]">
                {currentData.charge.map((charge, i) => (
                  <div key={i} className="flex-1 flex items-end gap-0.5 h-full relative">
                    <div 
                      className="flex-1 rounded-t bg-[#01D6BE] min-h-[4px]"
                      style={{ height: `${charge}%` }}
                    />
                    <div 
                      className="flex-1 rounded-t bg-[#01A88F] min-h-[4px]"
                      style={{ height: `${currentData.discharge[i]}%` }}
                    />
                  </div>
                ))}
              </div>
              {/* 分隔线 */}
              <div className="h-px bg-[rgba(1,214,190,0.08)] my-1.5" />
              {/* X 轴标签 */}
              <div className="flex gap-1.5">
                {days.map((day) => (
                  <div key={day} className="flex-1 text-center text-[9px] text-[#48484A]">{day}</div>
                ))}
              </div>
            </div>
          ) : (
            <ChartEmptyState 
              title="Weekly Charge / Discharge" 
              hint="Data will appear after 24 hours of usage" 
            />
          )}

          {/* 电池容量（有数据时） */}
          {hasData && (
            <div className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-bold text-[#FFFFFF]">Battery Capacity</div>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full 
                  bg-[rgba(52,199,89,0.12)] text-[#34C759] border border-[rgba(52,199,89,0.25)]
                  text-[10px] font-semibold">
                  Good
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* 储能容量环形 */}
                <div className="flex-shrink-0">
                  <BatteryRing 
                    percentage={powerStation.batteryLevel} 
                    size={180} 
                    strokeWidth={20}
                    isCharging={powerStation.isCharging}
                    uid="stats-page"
                  />
                </div>

                {/* 右侧统计 */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                    <div className="text-[14px] font-bold text-[#FFFFFF]">
                      {powerStation.batteryHealth}%
                    </div>
                    <div className="text-[9px] text-[#8E8E93] mt-0.5">Health</div>
                  </div>
                  <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                    <div className="text-[14px] font-bold text-[#34C759]">
                      {powerStation.temperature}°C
                    </div>
                    <div className="text-[9px] text-[#8E8E93] mt-0.5">Temp</div>
                  </div>
                  <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                    <div className="text-[14px] font-bold text-[#01D6BE]">
                      {powerStation.cycleCount}
                    </div>
                    <div className="text-[9px] text-[#8E8E93] mt-0.5">Cycles</div>
                  </div>
                  <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                    <div className="text-[14px] font-bold text-[#FF9500]">
                      1000Wh
                    </div>
                    <div className="text-[9px] text-[#8E8E93] mt-0.5">Capacity</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>)}
      </div>
    </div>
  )
}
