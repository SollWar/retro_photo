import { useEffect, useState } from 'react'

export function useClock() {
  const [clockText, setClockText] = useState('')

  useEffect(() => {
    const updateClock = () => {
      setClockText(
        new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      )
    }

    updateClock()
    const timer = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return clockText
}
