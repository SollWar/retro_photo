import { useEffect, useState } from 'react'

import type { BatteryManagerLike, NavigatorWithBattery } from '@/lib/types'

export function useBattery() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isCharging, setIsCharging] = useState(false)

  useEffect(() => {
    let battery: BatteryManagerLike | null = null

    const syncBattery = () => {
      if (!battery) {
        return
      }

      setBatteryLevel(Math.round(battery.level * 100))
      setIsCharging(battery.charging)
    }

    const initBattery = async () => {
      const batteryApi = navigator as NavigatorWithBattery
      if (!batteryApi.getBattery) {
        return
      }

      try {
        battery = await batteryApi.getBattery()
        syncBattery()
        battery.addEventListener('levelchange', syncBattery)
        battery.addEventListener('chargingchange', syncBattery)
      } catch {
        // Ignore Battery API failures.
      }
    }

    void initBattery()

    return () => {
      if (!battery) {
        return
      }

      battery.removeEventListener('levelchange', syncBattery)
      battery.removeEventListener('chargingchange', syncBattery)
    }
  }, [])

  return { batteryLevel, isCharging }
}
