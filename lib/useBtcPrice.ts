'use client'

import { useState, useEffect, useRef } from 'react'

export type Currency = 'EUR' | 'USD' | 'CHF'

// EUR/CHF Näherungskurs (wird per REST aktualisiert)
const EUR_USD_APPROX = 1.08
const CHF_USD_APPROX = 1.10

export function useBtcPrice(currency: Currency = 'EUR') {
  const [price, setPrice] = useState<number | null>(null)
  const [change24h, setChange24h] = useState<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const pair = currency === 'USD' ? 'btcusdt' : currency === 'EUR' ? 'btceur' : 'btcusdt'

    function connect() {
      const ws = new WebSocket(`wss://stream.binance.com/ws/${pair}@ticker`)
      wsRef.current = ws

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          let p = parseFloat(data.c) // current price
          let ch = parseFloat(data.P) // 24h change %

          // CHF: Binance hat kein BTC/CHF → USD * Näherungskurs
          if (currency === 'CHF') {
            p = p / EUR_USD_APPROX * CHF_USD_APPROX
          }

          setPrice(p)
          setChange24h(ch)
        } catch {}
      }

      ws.onerror = () => ws.close()
      ws.onclose = () => {
        // Reconnect nach 3s
        setTimeout(connect, 3000)
      }
    }

    connect()
    return () => {
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
