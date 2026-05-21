import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Zap, AlertTriangle, X, Plus, QrCode, Bluetooth, RefreshCw, Bell, LayoutGrid, List } from 'lucide-react'
import ToggleSwitch from '../components/ToggleSwitch'
import { usePowerStationStore } from '../stores/powerStationStore'
import { useDeviceStore } from '../stores/deviceStore'
import { useConnectionStore } from '../stores/connectionStore'
import { getBleManager } from '../protocols/bleManager'
import type { ConnectionInfo, BlePowerPacket } from '../types/protocol'

// BLE device type
interface BleDevice {
  id: string
  name: string
  rssi?: number
}

// Device display icon mapping
const deviceIcons: Record<string, string> = {
  cpap: '😴',
  fridge: '🧊',
  fish_tank: '🐟',
  nas: '💾',
  wifi_router: '📶',
  powerstation: '⚡',
  default: '🔌',
}

// Device model names
const modelNames: Record<string, string> = {
  sierro1000: 'Sierro 1000',
  sierro2000: 'Sierro 2000',
}

export default function DevicePage() {
  const navigate = useNavigate()
  const { devices, toggleDevice, selectDevice } = usePowerStationStore()
  const deviceStore = useDeviceStore()
  const { setBleConnection } = useConnectionStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showManualAdd, setShowManualAdd] = useState(false)
  const [showQrScan, setShowQrScan] = useState(false)
  const [showBleScan, setShowBleScan] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // BLE scan state
  const [isScanning, setIsScanning] = useState(false)
  const [scannedDevices, setScannedDevices] = useState<BleDevice[]>([])
  const [scanError, setScanError] = useState<string | null>(null)
  const bleManagerRef = useRef<ReturnType<typeof getBleManager> | null>(null)

  // QR scan state
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrScanning, setQrScanning] = useState(false)
  const [qrResult, setQrResult] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Load devices
  useEffect(() => {
    deviceStore.loadDevices()
    deviceStore.loadStations()
  }, [])

  // Check for low battery alert
  const hasLowBatteryAlert = devices.some(d => d.batteryLevel < 30 && d.isOn)

  const getBatteryColor = (level: number) => {
    if (level === 0) return 'text-[#48484A]'
    if (level < 20) return 'text-[#FF3B30]'
    if (level < 60) return 'text-[#FF9500]'
    return 'text-[#34C759]'
  }

  const getBatteryBg = (level: number) => {
    if (level === 0) return 'bg-[rgba(72,72,74,0.08)]'
    if (level < 20) return 'bg-[rgba(255,59,48,0.06)]'
    if (level < 60) return 'bg-[rgba(255,149,0,0.06)]'
    return 'bg-[rgba(52,199,89,0.06)]'
  }

  const getDeviceIcon = (type: string) => deviceIcons[type] || deviceIcons.default
  const getModelName = (type: string) => modelNames[type.toLowerCase()] || 'Sierro 1000'

  const handleDeviceClick = (deviceId: string) => {
    selectDevice(deviceId)
    navigate(`/device/${deviceId}`)
  }

  // ---- BLE Scan ----
  const handleBluetoothScan = async () => {
    setShowAddModal(false)
    setShowBleScan(true)
    setIsScanning(true)
    setScanError(null)
    setScannedDevices([])

    try {
      if (!navigator.bluetooth) {
        setScanError('Current browser does not support Web Bluetooth')
        setIsScanning(false)
        return
      }

      const bleManager = getBleManager({
        onStatusChange: (info: ConnectionInfo) => {
          setBleConnection(info)
          if (info.status === 'connected' && info.deviceName) {
            setScannedDevices(prev => {
              const exists = prev.find(d => d.id === info.deviceId)
              if (exists) return prev
              return [...prev, { id: info.deviceId || '', name: info.deviceName || 'Unknown', rssi: info.rssi }]
            })
            setIsScanning(false)
          } else if (info.status === 'error') {
            setScanError(info.errorMessage || 'Scan failed')
            setIsScanning(false)
          }
        },
        onPowerData: (_packet: BlePowerPacket) => {},
        onBatteryLevel: (_level: number) => {},
        onPortStatus: (_bitmap: number) => {},
        onModeChange: (_mode: string) => {},
      })

      bleManagerRef.current = bleManager
      await bleManager.connect()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('User cancelled')) setScanError(msg)
      setIsScanning(false)
    }
  }

  const handleCloseBleScan = () => {
    setShowBleScan(false)
    setIsScanning(false)
    setScanError(null)
    setScannedDevices([])
  }

  // ---- QR Scan ----
  useEffect(() => {
    if (showQrScan && !qrResult) startQrScan()
    return () => stopQrScan()
  }, [showQrScan])

  const startQrScan = async () => {
    setQrScanning(true)
    setQrError(null)
    setQrResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      setQrError(`Camera error: ${err instanceof Error ? err.message : String(err)}`)
      setQrScanning(false)
    }
  }

  const stopQrScan = () => {
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setQrScanning(false)
  }

  const handleCloseQrScan = () => { stopQrScan(); setShowQrScan(false); setQrResult(null); setQrError(null) }
  const simulateQrScan = () => { stopQrScan(); setQrResult('DEVICE_ID:SIERRA_1000_ABC123\nMODEL:SIERRA 1000\nSN:SN202403001') }

  return (
    <div className="h-full flex flex-col bg-[#000000] overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="px-5 pt-4 pb-3 safe-area-top"
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-[#FFFFFF]">Devices</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="w-9 h-9 rounded-full bg-[#1C1C1E] flex items-center justify-center text-[#FFFFFF] hover:bg-[#2C2C2E] transition-colors"
            >
              <Bell size={18} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-9 h-9 rounded-full bg-[#1C1C1E] flex items-center justify-center text-[#FFFFFF] hover:bg-[#2C2C2E] transition-colors"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="w-9 h-9 rounded-full bg-[#1C1C1E] flex items-center justify-center text-[#FFFFFF] hover:bg-[#2C2C2E] transition-colors"
            >
              {viewMode === 'grid' ? <LayoutGrid size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>

        {/* Low Battery Alert Banner */}
        <AnimatePresence>
          {hasLowBatteryAlert && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[rgba(255,59,48,0.08)] border border-[rgba(255,59,48,0.15)] rounded-[14px] px-4 py-2.5 flex items-center gap-2 mb-1"
            >
              <AlertTriangle size={14} className="text-[#FF3B30] flex-shrink-0" />
              <span className="text-[12px] text-[#FF3B30]">
                The battery for <strong>{devices.find(d => d.batteryLevel < 30 && d.isOn)?.name}</strong> is below 30%
              </span>
              <button onClick={() => navigate('/notifications')} className="ml-auto text-[#FF3B30]">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {viewMode === 'grid' ? (
          /* Bento Box Grid Layout */
          <div className="grid grid-cols-2 gap-2.5">
            {devices.map((device, index) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={() => handleDeviceClick(device.id)}
                className={`${getBatteryBg(device.batteryLevel)} rounded-[20px] p-4 cursor-pointer active:scale-[0.97] transition-transform relative`}
              >
                {/* Battery Percentage */}
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[32px] font-extrabold ${getBatteryColor(device.batteryLevel)} leading-none`}>
                    {device.batteryLevel}
                    <span className="text-[16px] font-bold">%</span>
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ToggleSwitch
                      isOn={device.isOn}
                      onToggle={() => toggleDevice(device.id)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Device Icon + Name */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[14px]">{getDeviceIcon(device.type)}</span>
                  <span className="text-[13px] font-semibold text-[#FFFFFF] truncate">
                    {device.name}
                  </span>
                </div>

                {/* Model Name */}
                <div className="text-[11px] text-[#8E8E93]">
                  {getModelName(device.type)}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* List Layout */
          <div className="flex flex-col gap-2.5">
            {devices.map((device, index) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={() => handleDeviceClick(device.id)}
                className={`flex items-center gap-3.5 p-4 bg-[#1C1C1E] rounded-[18px] cursor-pointer active:bg-[#2C2C2E] transition-all duration-200`}
              >
                <div className="w-11 h-11 rounded-[14px] bg-[rgba(1,214,190,0.12)] flex items-center justify-center flex-shrink-0 text-lg">
                  {getDeviceIcon(device.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#FFFFFF] truncate">{device.name}</span>
                    {device.batteryLevel < 30 && <AlertTriangle size={12} className="text-[#FF3B30] flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#8E8E93]">{getModelName(device.type)}</span>
                    <span className={`flex items-center gap-1 text-xs font-semibold ${getBatteryColor(device.batteryLevel)}`}>
                      {device.batteryLevel}%
                    </span>
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch isOn={device.isOn} onToggle={() => toggleDevice(device.id)} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {devices.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Zap size={48} className="mx-auto mb-3 text-[#48484A] opacity-30" />
            <p className="text-sm font-medium text-[#8E8E93] mb-1">No devices yet</p>
            <p className="text-xs text-[#48484A]">Tap + to add your first device</p>
          </motion.div>
        )}
      </div>

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[rgba(0,0,0,0.7)] z-50 flex items-end"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#1C1C1E] rounded-t-[28px] p-6 pb-10">
              <div className="w-10 h-1 bg-[rgba(255,255,255,0.15)] rounded-full mx-auto mb-5" />
              <h3 className="text-base font-bold text-[#FFFFFF] mb-5">Add New Device</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Bluetooth Scan', desc: 'Find nearby BLE devices', color: '#01D6BE', icon: '📡', action: handleBluetoothScan },
                  { label: 'Wi-Fi Setup', desc: 'Connect via local network', color: '#34C759', icon: '📶' },
                  { label: 'Manual Entry', desc: 'Enter device code manually', color: '#FF9500', icon: '⌨️', action: () => { setShowAddModal(false); setShowManualAdd(true) } },
                  { label: 'Scan QR Code', desc: 'Scan device QR code', color: '#01D6BE', icon: '📷', action: () => { setShowAddModal(false); setShowQrScan(true) } },
                ].map((opt) => (
                  <button key={opt.label}
                    onClick={() => { if ('action' in opt && opt.action) opt.action(); else setShowAddModal(false) }}
                    className="flex items-center gap-4 p-4 bg-[#2C2C2E] rounded-[16px] text-left transition-all">
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold" style={{ color: opt.color }}>{opt.label}</div>
                      <div className="text-[11px] text-[#8E8E93] mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddModal(false)}
                className="w-full mt-4 h-11 rounded-[14px] bg-[rgba(255,255,255,0.06)] text-[#8E8E93] text-sm font-medium">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BLE Scan Modal */}
      <AnimatePresence>
        {showBleScan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[rgba(0,0,0,0.8)] z-50 flex items-center justify-center p-5"
            onClick={handleCloseBleScan}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1C1C1E] rounded-[24px] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[#FFFFFF]">Bluetooth Devices</h3>
                <button onClick={handleCloseBleScan} className="w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93]">
                  <X size={18} />
                </button>
              </div>
              {isScanning && scannedDevices.length === 0 && !scanError && (
                <div className="flex flex-col items-center justify-center py-10">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 rounded-full border-2 border-[#01D6BE] border-t-transparent mb-4" />
                  <p className="text-[14px] text-[#8E8E93]">Scanning for devices...</p>
                </div>
              )}
              {scanError && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[rgba(255,59,48,0.15)] flex items-center justify-center mb-3">
                    <Bluetooth size={24} className="text-[#FF3B30]" />
                  </div>
                  <p className="text-[14px] text-[#FF3B30] text-center mb-1">Scan Failed</p>
                  <p className="text-[12px] text-[#8E8E93] text-center px-4">{scanError}</p>
                  <button onClick={handleBluetoothScan} className="mt-4 px-5 py-2 bg-[#01D6BE] rounded-full text-[#000000] text-[13px] font-semibold flex items-center gap-2">
                    <RefreshCw size={14} /> Retry
                  </button>
                </div>
              )}
              {scannedDevices.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[12px] text-[#8E8E93] mb-3">Found {scannedDevices.length} device(s)</p>
                  {scannedDevices.map((device) => (
                    <motion.div key={device.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 bg-[#2C2C2E] rounded-[16px]">
                      <div className="w-10 h-10 rounded-full bg-[rgba(1,214,190,0.15)] flex items-center justify-center">
                        <Bluetooth size={20} className="text-[#01D6BE]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[#FFFFFF]">{device.name}</p>
                        <p className="text-[11px] text-[#8E8E93]">{device.rssi ? `Signal: ${device.rssi} dBm` : ''}</p>
                      </div>
                      <button onClick={() => handleCloseBleScan()} className="px-4 py-2 bg-[#01D6BE] rounded-full text-[#000000] text-[12px] font-semibold">Connect</button>
                    </motion.div>
                  ))}
                </div>
              )}
              {!isScanning && !scanError && scannedDevices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#2C2C2E] flex items-center justify-center mb-3">
                    <Bluetooth size={24} className="text-[#8E8E93]" />
                  </div>
                  <p className="text-[14px] text-[#8E8E93]">No devices found</p>
                  <button onClick={handleBluetoothScan} className="mt-4 px-5 py-2 bg-[#01D6BE] rounded-full text-[#000000] text-[13px] font-semibold flex items-center gap-2">
                    <RefreshCw size={14} /> Scan Again
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Scan Modal */}
      <AnimatePresence>
        {showQrScan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[rgba(0,0,0,0.9)] z-50 flex flex-col">
            <div className="flex items-center justify-between p-5 safe-area-top">
              <h3 className="text-lg font-bold text-[#FFFFFF]">Scan QR Code</h3>
              <button onClick={handleCloseQrScan} className="w-9 h-9 rounded-full bg-[#2C2C2E] flex items-center justify-center text-[#FFFFFF]">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-5">
              {!qrResult ? (
                <>
                  <div className="relative w-64 h-64 mb-6">
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover rounded-[20px]" playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-2 border-[#01D6BE] rounded-[20px]">
                      {([['top-0 left-0', 'border-t-4 border-l-4'], ['top-0 right-0', 'border-t-4 border-r-4'], ['bottom-0 left-0', 'border-b-4 border-l-4'], ['bottom-0 right-0', 'border-b-4 border-r-4']] as const).map(([pos, border], i) => (
                        <div key={i} className={`absolute w-8 h-8 ${pos} ${border} border-[#01D6BE] rounded-sm`} />
                      ))}
                      {qrScanning && (
                        <motion.div className="absolute left-2 right-2 h-0.5 bg-[#01D6BE] shadow-[0_0_10px_#01D6BE]"
                          animate={{ top: ['5%', '95%', '5%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
                      )}
                    </div>
                    {!qrScanning && !qrError && (
                      <div className="absolute inset-0 bg-[#1C1C1E] rounded-[20px] flex items-center justify-center">
                        <QrCode size={64} className="text-[#48484A]" />
                      </div>
                    )}
                  </div>
                  {qrError ? (
                    <div className="text-center">
                      <p className="text-[14px] text-[#FF3B30] mb-2">{qrError}</p>
                      <button onClick={startQrScan} className="px-5 py-2 bg-[#01D6BE] rounded-full text-[#000000] text-[13px] font-semibold">Retry</button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[15px] font-semibold text-[#FFFFFF] mb-1">Point camera at QR code</p>
                      <p className="text-[12px] text-[#8E8E93]">The code will be scanned automatically</p>
                      <button onClick={simulateQrScan} className="mt-6 px-4 py-2 bg-[#2C2C2E] rounded-full text-[#8E8E93] text-[12px]">Simulate Scan (Test)</button>
                    </>
                  )}
                </>
              ) : (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#1C1C1E] rounded-[24px] p-6">
                  <div className="w-16 h-16 rounded-full bg-[rgba(52,199,89,0.15)] flex items-center justify-center mx-auto mb-4">
                    <QrCode size={32} className="text-[#34C759]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#FFFFFF] text-center mb-2">QR Code Scanned!</h4>
                  <div className="bg-[#2C2C2E] rounded-[12px] p-4 mb-5">
                    <pre className="text-[12px] text-[#8E8E93] whitespace-pre-wrap break-all">{qrResult}</pre>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setQrResult(null); startQrScan() }} className="flex-1 h-11 rounded-[14px] bg-[#2C2C2E] text-[#FFFFFF] text-[14px] font-medium">Scan Again</button>
                    <button onClick={handleCloseQrScan} className="flex-1 h-11 rounded-[14px] bg-[#01D6BE] text-[#000000] text-[14px] font-semibold">Add Device</button>
                  </div>
                </motion.div>
              )}
            </div>
            <div className="p-5 safe-area-bottom text-center">
              <p className="text-[11px] text-[#48484A]">Make sure the QR code is well-lit and in focus</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Add Device Modal */}
      <AnimatePresence>
        {showManualAdd && (
          <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-50 bg-[#1C1C1E] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4">
              <button onClick={() => setShowManualAdd(false)} className="w-9 h-9 rounded-full bg-[#2C2C2E] flex items-center justify-center text-[#FFFFFF]">
                <X size={20} />
              </button>
              <h3 className="text-base font-bold text-[#FFFFFF]">Add Device Manually</h3>
              <div className="w-9" />
            </div>
            <div className="flex-1 p-5">
              <p className="text-[13px] text-[#8E8E93] mb-6">Manual device entry is under development. Please use Bluetooth Scan or QR Code to add devices.</p>
              <button onClick={() => setShowManualAdd(false)} className="w-full py-3 rounded-xl bg-[rgba(1,214,190,0.12)] text-[#01D6BE] font-semibold text-[13px]">OK</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
