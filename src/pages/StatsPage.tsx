import { useState } from 'react'
import { motion } from 'framer-motion'
import { Share2, BarChart3, WifiOff, Leaf } from 'lucide-react'
import BatteryRing from '../components/BatteryRing'
import { usePowerStationStore } from '../stores/powerStationStore'

const periods = ['Day', 'Week', 'Month', 'Range'] as const
type Period = typeof periods[number]

// Mock data
const allData = {
  Day: {
    input: [0, 5, 12, 30, 55, 70, 48, 60, 45, 30, 20, 15],
    output: [0, 3, 8, 20, 38, 52, 30, 42, 35, 25, 18, 10],
    labels: ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
    co2: '6.4',
    days: 128,
    insight: 'Input remained consistent today',
    ecoInsight: 'Saved enough energy to power a laptop for 32 hrs',
  },
  Week: {
    input: [55, 70, 48, 78, 62, 40, 28],
    output: [38, 52, 60, 42, 56, 72, 30],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    co2: '14.2',
    days: 128,
    insight: 'Highest usage recorded on Wednesday',
    ecoInsight: 'Equal to planting 2 trees',
  },
  Month: {
    input: [60, 50, 75, 65, 80, 55, 45, 70, 58, 62, 48, 72],
    output: [45, 40, 65, 55, 70, 48, 35, 58, 42, 50, 38, 60],
    labels: ['Mar', 'Apr 1', 'Apr 8', 'Apr 15', 'Apr 22', 'May', 'May 8', 'May 15', 'May 22', 'May 28', 'Jun 4', 'Jun 11'],
    co2: '32.5',
    days: 128,
    insight: 'Output peaked during the first week',
    ecoInsight: 'Equivalent to driving 180 fewer miles',
  },
  Range: {
    input: [60, 50, 75, 65, 80, 55, 45, 70, 58, 62, 48, 72],
    output: [45, 40, 65, 55, 70, 48, 35, 58, 42, 50, 38, 60],
    labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    co2: '102.6',
    days: 128,
    insight: 'Sustained energy performance across the selected period',
    ecoInsight: 'Equivalent to driving 560 fewer miles',
  },
}

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('Day')
  const { powerStation } = usePowerStationStore()

  const currentData = allData[period]
  const hasData = powerStation.batteryLevel > 0 || powerStation.cycleCount > 0
  const isWeek = period === 'Week'

  // Generate SVG path for area chart
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

  const emptyState = !hasData ? (
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
  ) : null

  return (
    <div className="h-full flex flex-col bg-[#000000] overflow-hidden pt-6">
      {/* Header */}
      <div className="px-5 pt-8 pb-2 safe-area-top flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-[#FFFFFF]">Energy Stats</h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            {currentData.days} Days · Reliable backup power since Jan 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] text-[#8E8E93] hover:text-[#01D6BE] transition-colors"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Sierro Energy Stats', text: `CO2 Reduced: ${currentData.co2} kg`, url: window.location.href })
              }
            }}>
            <Share2 size={18} />
          </button>
          <div className="flex bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-full p-1">
            {periods.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all duration-200
                  ${period === p ? 'bg-[#01D6BE] text-[#000000]' : 'text-[#8E8E93] hover:text-[#FFFFFF]'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {emptyState}

        {hasData && (<>
          {/* CO2 Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-5 mb-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-[rgba(1,214,190,0.15)]" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(52,199,89,0.1)] flex items-center justify-center">
                <Leaf size={16} className="text-[#34C759]" />
              </div>
              <span className="text-[13px] font-semibold text-[#FFFFFF]">CO2 Reduced</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[36px] font-extrabold text-[#34C759] leading-none">{currentData.co2}</span>
              <span className="text-[14px] text-[#8E8E93]">Kg</span>
            </div>
            <p className="text-[12px] text-[#8E8E93]">{currentData.ecoInsight}</p>
          </motion.div>

          {/* Input vs Output Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold text-[#FFFFFF]">Input vs Output</div>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
                  <div className="w-2 h-2 rounded-full bg-[#01D6BE]" /><span>Input</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
                  <div className="w-2 h-2 rounded-full bg-[#01A88F]" /><span>Output</span>
                </div>
              </div>
            </div>

            {isWeek ? (
              /* Week: Dual Bar Chart */
              <div>
                <div className="flex items-end gap-2 h-[140px]">
                  {currentData.input.map((input, i) => {
                    const maxVal = Math.max(...currentData.input, ...currentData.output, 1)
                    return (
                      <div key={i} className="flex-1 flex items-end gap-0.5 h-full">
                        <div className="flex-1 rounded-t bg-[#01D6BE] min-h-[2px] transition-all duration-500"
                          style={{ height: `${(input / maxVal) * 100}%` }} />
                        <div className="flex-1 rounded-t bg-[#01A88F] min-h-[2px] transition-all duration-500"
                          style={{ height: `${(currentData.output[i] / maxVal) * 100}%` }} />
                      </div>
                    )
                  })}
                </div>
                <div className="h-px bg-[rgba(1,214,190,0.08)] my-1.5" />
                <div className="flex gap-2">
                  {currentData.labels.map((day) => (
                    <div key={day} className="flex-1 text-center text-[9px] text-[#48484A]">{day}</div>
                  ))}
                </div>
              </div>
            ) : (
              /* Day/Month/Range: Line + Area Chart */
              <div>
                <svg viewBox="0 0 340 160" className="w-full h-[140px]">
                  {/* Input Area */}
                  {(() => {
                    const { linePath, areaPath } = generateAreaPath(currentData.input, 340, 140)
                    return (
                      <g>
                        <path d={areaPath} fill="rgba(1,214,190,0.1)" />
                        <path d={linePath} fill="none" stroke="#01D6BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    )
                  })()}
                  {/* Output Area */}
                  {(() => {
                    const { linePath, areaPath } = generateAreaPath(currentData.output, 340, 140)
                    return (
                      <g>
                        <path d={areaPath} fill="rgba(1,168,143,0.08)" />
                        <path d={linePath} fill="none" stroke="#01A88F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    )
                  })()}
                </svg>
                <div className="flex justify-between px-1">
                  {currentData.labels.filter((_, i) => i % Math.max(1, Math.floor(currentData.labels.length / 6)) === 0).map((label) => (
                    <span key={label} className="text-[9px] text-[#48484A]">{label}</span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insight */}
            <div className="mt-4 pt-3 border-t border-[rgba(1,214,190,0.06)]">
              <p className="text-[11px] text-[#8E8E93]">
                <span className="text-[#01D6BE] font-semibold">Insight: </span>
                {currentData.insight}
              </p>
            </div>
          </motion.div>

          {/* Battery Health Card */}
          {hasData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#1C1C1E] border border-[rgba(1,214,190,0.08)] rounded-[20px] p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-bold text-[#FFFFFF]">Battery Health</div>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[rgba(52,199,89,0.12)] text-[#34C759] border border-[rgba(52,199,89,0.25)] text-[10px] font-semibold">
                  Good
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <BatteryRing percentage={powerStation.batteryLevel} size={160} strokeWidth={18} isCharging={powerStation.isCharging} uid="stats-page" />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                    <div className="text-[14px] font-bold text-[#FFFFFF]">{powerStation.batteryHealth}%</div>
                    <div className="text-[9px] text-[#8E8E93] mt-0.5">Health</div>
                  </div>
                  <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                    <div className="text-[14px] font-bold text-[#34C759]">{powerStation.temperature}°C</div>
                    <div className="text-[9px] text-[#8E8E93] mt-0.5">Temp</div>
                  </div>
                  <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                    <div className="text-[14px] font-bold text-[#01D6BE]">{powerStation.cycleCount}</div>
                    <div className="text-[9px] text-[#8E8E93] mt-0.5">Cycles</div>
                  </div>
                  <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2.5">
                    <div className="text-[14px] font-bold text-[#FF9500]">1000Wh</div>
                    <div className="text-[9px] text-[#8E8E93] mt-0.5">Capacity</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>)}
      </div>
    </div>
  )
}
