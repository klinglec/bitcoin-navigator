'use client'

import { useState, useEffect, useRef } from 'react'

export type Currency = 'EUR' | 'USD'

export function useBtcPrice(currency: Currency = 'EUR') {
  const [price, setPrice] = useState<number | null>(null)
  const [change24h, setChange24h] = useState<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    setPrice(null)
    setChange24h(null)

    const pair = currency === 'USD' ? 'btcusdt' : 'btceur'
    let cleaned = false

    function connect() {
      if (cleaned) return
      const ws = new WebSocket(`wss://stream.binance.com/ws/${pair}@ticker`)
      wsRef.current = ws

      ws.onmessage = (msg) => {
        if (cleaned) return
        try {
          const data = JSON.parse(msg.data)
          setPrice(parseFloat(data.c))
          setChange24h(parseFloat(data.P))
        } catch {}
      }

      ws.onerror = () => ws.close()
      ws.onclose = () => { if (!cleaned) setTimeout(connect, 3000) }
    }

    connect()
    return () => {
      cleaned = true
      wsRef.current?.close()
    }
  }, [currency])

  return { price, change24h }
}

export function formatPrice(price: number, currency: Currency): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}
