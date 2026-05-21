import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, AlertTriangle, Battery, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface NotificationItem {
  id: number
  type: 'low_battery' | 'power_outage'
  deviceName: string
  description: string
  time: string
  date: string
}

const notifications: NotificationItem[] = [
  { id: 1, type: 'low_battery', deviceName: 'Fish Tank', description: 'Estimated remaining time 1h 24m', time: '5 mins ago', date: 'Today' },
  { id: 2, type: 'power_outage', deviceName: 'Fridge', description: 'Switched to backup power automatically.', time: '3:42 PM', date: 'Today' },
  { id: 3, type: 'power_outage', deviceName: 'CPAP', description: 'Switched to backup power automatically.', time: '2:15 PM', date: 'Today' },
  { id: 4, type: 'low_battery', deviceName: 'NAS', description: 'Estimated remaining time 34m', time: 'April 28', date: 'April' },
  { id: 5, type: 'low_battery', deviceName: 'Fish Tank', description: 'Estimated remaining time 24m', time: 'April 15', date: 'April' },
  { id: 6, type: 'power_outage', deviceName: 'Fish Tank', description: 'Switched to backup power automatically.', time: 'March 23', date: 'March' },
  { id: 7, type: 'power_outage', deviceName: 'Fridge', description: 'Switched to backup power automatically.', time: 'March 10', date: 'March' },
]

export default function NotificationsPage() {
  const navigate = useNavigate()

  // Group by date
  const grouped = notifications.reduce<Record<string, NotificationItem[]>>((acc, n) => {
    if (!acc[n.date]) acc[n.date] = []
    acc[n.date].push(n)
    return acc
  }, {})

  const dateOrder = ['Today', 'April', 'March', 'May']

  const getIcon = (type: string) => {
    if (type === 'low_battery') return <Battery size={18} className="text-[#FF9500]" />
    return <WifiOff size={18} className="text-[#FF3B30]" />
  }

  const getTitle = (type: string) => {
    if (type === 'low_battery') return 'Low Battery'
    return 'Power Outage Detected'
  }

  return (
    <div className="h-full flex flex-col bg-[#000000] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 safe-area-top flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-[#1C1C1E] flex items-center justify-center text-[#FFFFFF]"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-[#FFFFFF]">Notifications</h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {dateOrder.filter(d => grouped[d]).map(date => (
          <div key={date} className="mb-5">
            <div className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-2 px-1">
              {date}
            </div>
            <div className="flex flex-col gap-2">
              {grouped[date].map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-[#1C1C1E] rounded-[18px] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[rgba(255,255,255,0.06)] flex items-center justify-center flex-shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[13px] font-semibold text-[#FFFFFF]">
                          {getTitle(item.type)}
                        </span>
                        <span className="text-[10px] text-[#8E8E93] flex-shrink-0 ml-2">{item.time}</span>
                      </div>
                      <div className="text-[11px] text-[#8E8E93]">{item.deviceName}</div>
                      <div className="text-[12px] text-[#48484A] mt-1">{item.description}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
