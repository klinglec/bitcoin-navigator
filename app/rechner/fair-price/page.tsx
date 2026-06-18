'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import SiteHeader from '@/components/SiteHeader'
import BoersenCTA from '@/components/BoersenCTA'
import {
  powerLawPrice, powerLawFloor, powerLawUpperBand, cyclicPrice,
  toLocalCurrency, fromLocalCurrency, daysSinceGenesis, dateForTargetPrice,
  UPPER_BAND_MULT,
} from '@/lib/powerLaw'
import { useBtcPrice, formatPrice, Currency } from '@/lib/useBtcPrice'

// ── Konstanten ────────────────────────────────────────────────────
const FLOOR_MULT = 0.35
const HIST_PRICES: Record<number, number> = {
  2010: 0.30, 2011: 4.72, 2012: 13.45, 2013: 731,
  2014: 320,  2015: 430,  2016: 963,   2017: 13800,
  2018: 3742, 2019: 7240, 2020: 28990, 2021: 46306,
  2022: 16547, 2023: 42258, 2024: 93429,
}
const CURRENCY_SYMBOL: Record<Currency, string> = { EUR: '€', USD: '$', CHF: 'CHF' }
type ProjYear = 2035 | 2040 | 2045
type ChartMode = 'log-lin' | 'log-log'

// ── Formatierung ──────────────────────────────────────────────────
function fmtC(v: number, curr: Currency): string {
  const sym = CURRENCY_SYMBOL[curr]
  if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mio.`
  if (v >= 100_000)   return new Intl.NumberFormat('de-DE', { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(v)
  if (v >= 1_000)     return new Intl.NumberFormat('de-DE', { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(v)
  if (v >= 1)         return new Intl.NumberFormat('de-DE', { style: 'currency', currency: curr, maximumFractionDigits: 2 }).format(v)
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: curr, maximumFractionDigits: 4 }).format(v)
}

function fmtDateDE(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtChartLabel(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)}M`
  if (price >= 1_000)     return `${(price / 1_000).toFixed(0)}K`
  if (price >= 1)         return price.toFixed(0)
  return price.toFixed(2)
}

function fmtMultiple(m: number): string {
  return `${m.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`
}

function todayISODate(): string {
  return new Date().toISOString().split('T')[0]
}

// ── SVG Power Law Chart ──────────────────────────────────────────
interface ChartSeries {
  median: boolean
  floor: boolean
  upper: boolean
  cycle: boolean
  hist: boolean
}

interface ChartPt {
  date: Date
  year: number
  month: number
  median: number
  floor: number
  upper: number
  cycle: number
}

function PowerLawChart({
  currency, projYear, mode, series,
}: {
  currency: Currency
  projYear: ProjYear
  mode: ChartMode
  series: ChartSeries
}) {
  const { price: livePriceRaw } = useBtcPrice('USD')  // immer USD für hist-Linie
  const W = 680, H = 360
  const ML = 68, MR = 20, MT = 18, MB = 44
  const CW = W - ML - MR
  const CH = H - MT - MB

  // Log Y: $0.01 (log=-2) to $200M (log≈8.3)
  const LOG_Y_MIN = -2
  const LOG_Y_MAX = 8.3

  const xStart = useMemo(() => new Date('2010-01-01'), [])
  const xEnd   = useMemo(() => new Date(`${projYear}-12-31`), [projYear])

  // Log-log X range
  const logXMin = useMemo(() => Math.log10(daysSinceGenesis(xStart)), [xStart])
  const logXMax = useMemo(() => Math.log10(daysSinceGenesis(xEnd)), [xEnd])

  // Monthly data points
  const data = useMemo<ChartPt[]>(() => {
    const pts: ChartPt[] = []
    for (let year = 2010; year <= projYear; year++) {
      for (let month = 0; month < 12; month++) {
        const d = new Date(year, month, 15)
        const med = powerLawPrice(d)
        pts.push({
          date: d, year, month,
          median: toLocalCurrency(med, currency),
          floor:  toLocalCurrency(med * FLOOR_MULT, currency),
          upper:  toLocalCurrency(med * UPPER_BAND_MULT, currency),
          cycle:  toLocalCurrency(cyclicPrice(d), currency),
        })
      }
    }
    return pts
  }, [projYear, currency])

  function xCoord(date: Date): number {
    if (mode === 'log-lin') {
      const t = (date.getTime() - xStart.getTime()) / (xEnd.getTime() - xStart.getTime())
      return ML + Math.max(0, Math.min(1, t)) * CW
    }
    const dsg = Math.log10(Math.max(daysSinceGenesis(date), 1))
    const t = (dsg - logXMin) / (logXMax - logXMin)
    return ML + Math.max(0, Math.min(1, t)) * CW
  }

  function yCoord(price: number): number {
    const log = Math.log10(Math.max(price, 1e-10))
    const t = (log - LOG_Y_MIN) / (LOG_Y_MAX - LOG_Y_MIN)
    return MT + CH * (1 - Math.max(0, Math.min(1, t)))
  }

  function buildPath(vals: number[]): string {
    let d = ''
    for (let i = 0; i < data.length; i++) {
      const x = xCoord(data[i].date)
      const y = yCoord(vals[i])
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `
    }
    return d.trim()
  }

  const medianPath = useMemo(() => series.median ? buildPath(data.map(p => p.median)) : '', [data, series.median, mode])
  const floorPath  = useMemo(() => series.floor  ? buildPath(data.map(p => p.floor))  : '', [data, series.floor,  mode])
  const upperPath  = useMemo(() => series.upper  ? buildPath(data.map(p => p.upper))  : '', [data, series.upper,  mode])
  const cyclePath  = useMemo(() => series.cycle  ? buildPath(data.map(p => p.cycle))  : '', [data, series.cycle,  mode])

  // Gefüllte Fläche zwischen Boden und oberem Band
  const bandAreaPath = useMemo(() => {
    if (data.length === 0) return ''
    const fwd = data.map(p => `${xCoord(p.date).toFixed(1)},${yCoord(p.floor).toFixed(1)}`).join(' L')
    const rev = [...data].reverse().map(p => `${xCoord(p.date).toFixed(1)},${yCoord(p.upper).toFixed(1)}`).join(' L')
    return `M${fwd} L${rev} Z`
  }, [data, mode])

  // Y axis ticks (powers of 10)
  const yTicks = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8].filter(t => t >= LOG_Y_MIN && t <= LOG_Y_MAX)

  // X axis ticks
  const xTicks = useMemo(() => {
    const ticks: { year: number; x: number }[] = []
    for (let y = 2010; y <= projYear; y += 5) {
      ticks.push({ year: y, x: xCoord(new Date(y, 0, 1)) })
    }
    return ticks
  }, [projYear, mode, xStart, xEnd, logXMin, logXMax])

  // Historische Preislinie – log-lineare Interpolation + Live-Verlängerung bis heute
  const histPath = useMemo(() => {
    if (!series.hist) return ''
    const years = Object.keys(HIST_PRICES).map(Number).sort((a, b) => a - b)
    const pts: string[] = []
    let first = true
    for (let i = 0; i < years.length; i++) {
      const yr = years[i]
      if (yr > projYear) break
      const priceEnd = HIST_PRICES[yr]
      const priceStart = i > 0 ? HIST_PRICES[years[i - 1]] : priceEnd
      for (let m = 0; m < 12; m++) {
        const t = (m + 1) / 12
        const logP = Math.log10(priceStart) + t * (Math.log10(priceEnd) - Math.log10(priceStart))
        const price = toLocalCurrency(Math.pow(10, logP), currency)
        const date = new Date(yr, m, 28)
        pts.push(`${first ? 'M' : 'L'}${xCoord(date).toFixed(1)} ${yCoord(price).toFixed(1)}`)
        first = false
      }
    }
    // Verlängerung: letztes bekanntes Jahresende → heute (via Live-Preis)
    if (livePriceRaw && livePriceRaw > 0) {
      const lastYear = years[years.length - 1]
      const lastPriceUsd = HIST_PRICES[lastYear]
      const now = new Date()
      const lastEnd = new Date(lastYear, 11, 31)
      const totalMs = now.getTime() - lastEnd.getTime()
      // Monatliche Punkte von Jan des Folgejahres bis heute
      let m = 0
      while (true) {
        const date = new Date(lastYear + 1, m, 15)
        if (date > now) break
        const t = (date.getTime() - lastEnd.getTime()) / totalMs
        const logP = Math.log10(lastPriceUsd) + t * (Math.log10(livePriceRaw) - Math.log10(lastPriceUsd))
        const price = toLocalCurrency(Math.pow(10, logP), currency)
        pts.push(`L${xCoord(date).toFixed(1)} ${yCoord(price).toFixed(1)}`)
        m++
        if (m > 36) break // max. 3 Jahre vorwärts
      }
      // Endpunkt exakt auf heute
      const price = toLocalCurrency(livePriceRaw, currency)
      pts.push(`L${xCoord(now).toFixed(1)} ${yCoord(price).toFixed(1)}`)
    }
    return pts.join(' ')
  }, [projYear, currency, series.hist, mode, livePriceRaw])

  // Today
  const today = new Date()
  const todayX = xCoord(today)
  const showToday = today >= xStart && today <= xEnd

  // Hover
  const [hoverX, setHoverX] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const rawX = (e.clientX - rect.left) * (W / rect.width)
    setHoverX(Math.max(ML, Math.min(ML + CW, rawX)))
  }, [])

  const hoverPt = useMemo(() => {
    if (hoverX === null || data.length === 0) return null
    let best = data[0]
    let bestDist = Infinity
    for (const p of data) {
      const dist = Math.abs(xCoord(p.date) - hoverX)
      if (dist < bestDist) { bestDist = dist; best = p }
    }
    return best
  }, [hoverX, data, mode])

  // Historischer Preis am gehov erten Punkt (interpoliert)
  const hoverHistPrice = useMemo(() => {
    if (!hoverPt || !series.hist) return null
    const date = hoverPt.date
    const now = new Date()
    if (date > now) return null
    const years = Object.keys(HIST_PRICES).map(Number).sort((a, b) => a - b)
    const lastYear = years[years.length - 1]
    let usd: number | null = null
    if (date.getFullYear() <= lastYear) {
      const yr = date.getFullYear()
      const priceEnd = HIST_PRICES[yr]
      if (!priceEnd) return null
      const priceStart = HIST_PRICES[yr - 1] ?? priceEnd
      const t = (date.getMonth() + 1) / 12
      usd = Math.pow(10, Math.log10(priceStart) + t * (Math.log10(priceEnd) - Math.log10(priceStart)))
    } else if (livePriceRaw && livePriceRaw > 0) {
      const lastPriceUsd = HIST_PRICES[lastYear]
      const lastEnd = new Date(lastYear, 11, 31)
      const t = Math.min(1, (date.getTime() - lastEnd.getTime()) / (now.getTime() - lastEnd.getTime()))
      usd = Math.pow(10, Math.log10(lastPriceUsd) + t * (Math.log10(livePriceRaw) - Math.log10(lastPriceUsd)))
    }
    return usd !== null ? toLocalCurrency(usd, currency) : null
  }, [hoverPt, series.hist, livePriceRaw, currency])

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {series.median && <span className="flex items-center gap-1.5"><span style={{ display: 'inline-block', width: 20, height: 2, background: '#f97316', borderRadius: 1 }} />Median</span>}
        {series.floor  && <span className="flex items-center gap-1.5"><span style={{ display: 'inline-block', width: 20, height: 2, background: 'repeating-linear-gradient(90deg, #60a5fa 0 5px, transparent 5px 8px)' }} />Unteres Band</span>}
        {series.upper  && <span className="flex items-center gap-1.5"><span style={{ display: 'inline-block', width: 20, height: 2, background: 'repeating-linear-gradient(90deg, #4ade80 0 5px, transparent 5px 8px)' }} />Oberes Band</span>}
        {series.cycle  && <span className="flex items-center gap-1.5"><span style={{ display: 'inline-block', width: 20, height: 2, background: '#fbbf24' }} />4-Jahres-Zyklus</span>}
        {series.hist   && <span className="flex items-center gap-1.5"><span style={{ display: 'inline-block', width: 20, height: 2, background: '#64748b' }} />Histor. Preis <span style={{ color: 'var(--text-tertiary)' }}>(Monatspreise, interpoliert)</span></span>}
        <span className="flex items-center gap-1.5"><span style={{ display: 'inline-block', width: 20, height: 2, background: 'repeating-linear-gradient(90deg, #a78bfa 0 3px, transparent 3px 5px)' }} />Heute</span>
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ cursor: 'crosshair', overflow: 'visible', display: 'block' }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverX(null)}
      >
        {/* Clip path */}
        <defs>
          <clipPath id="chart-clip">
            <rect x={ML} y={MT} width={CW} height={CH} />
          </clipPath>
        </defs>

        {/* Y grid */}
        {yTicks.map(t => {
          const y = yCoord(Math.pow(10, t))
          const sym = CURRENCY_SYMBOL[currency]
          const label = t >= 6 ? `${sym}${Math.pow(10, t - 6).toFixed(0)}M` :
                        t >= 3 ? `${sym}${Math.pow(10, t - 3).toFixed(0)}K` :
                        t >= 0 ? `${sym}${Math.pow(10, t).toFixed(0)}` :
                                 `${sym}${Math.pow(10, t).toFixed(2)}`
          return (
            <g key={t}>
              <line x1={ML} y1={y} x2={ML + CW} y2={y} stroke="var(--border)" strokeWidth={0.5} />
              <text x={ML - 5} y={y + 3.5} textAnchor="end" fontSize={9} fill="var(--text-tertiary)" fontFamily="monospace">{label}</text>
            </g>
          )
        })}

        {/* X axis ticks */}
        {xTicks.map(({ year, x }) => (
          <g key={year}>
            <line x1={x} y1={MT + CH} x2={x} y2={MT + CH + 4} stroke="var(--text-tertiary)" strokeWidth={0.5} />
            <text x={x} y={MT + CH + 14} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">{year}</text>
          </g>
        ))}

        {/* Chart area background */}
        <rect x={ML} y={MT} width={CW} height={CH} fill="var(--surface-alt)" opacity={0.4} />

        {/* Series paths (clipped) */}
        <g clipPath="url(#chart-clip)">
          {/* Band fill area */}
          {(series.floor || series.upper) && (
            <path d={bandAreaPath} fill="#f97316" fillOpacity={0.06} />
          )}

          {series.cycle  && <path d={cyclePath}  fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeOpacity={0.65} />}
          {series.floor  && <path d={floorPath}  fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="6 4" />}
          {series.upper  && <path d={upperPath}  fill="none" stroke="#4ade80" strokeWidth={1.5} strokeDasharray="6 4" />}
          {series.median && <path d={medianPath} fill="none" stroke="#f97316" strokeWidth={2.5} />}
          {series.hist   && <path d={histPath}   fill="none" stroke="#64748b" strokeWidth={1.5} />}

          {/* Today marker */}
          {showToday && (
            <line x1={todayX} y1={MT} x2={todayX} y2={MT + CH}
              stroke="#a78bfa" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.8} />
          )}
          {showToday && (
            <text x={Math.min(todayX + 4, ML + CW - 28)} y={MT + 11} fontSize={8} fill="#a78bfa" fontWeight={600}>Heute</text>
          )}

          {/* Hover crosshair */}
          {hoverX !== null && hoverPt && (
            <line
              x1={xCoord(hoverPt.date)} y1={MT}
              x2={xCoord(hoverPt.date)} y2={MT + CH}
              stroke="var(--text-tertiary)" strokeWidth={1} strokeDasharray="3 2" opacity={0.5}
            />
          )}
        </g>

        {/* Chart border */}
        <rect x={ML} y={MT} width={CW} height={CH} fill="none" stroke="var(--border)" strokeWidth={1} />
      </svg>

      {/* Hover tooltip */}
      {hoverPt && (
        <div className="mt-2 text-xs rounded-lg p-3 flex flex-wrap gap-x-5 gap-y-1"
          style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {hoverPt.date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}
          </span>
          {hoverHistPrice != null && <span><span style={{ color: '#64748b' }}>■</span> Preis: <b style={{ color: 'var(--text-primary)' }}>{fmtC(hoverHistPrice, currency)}</b></span>}
          {series.median && <span><span style={{ color: '#f97316' }}>■</span> Median: <b style={{ color: 'var(--text-primary)' }}>{fmtC(hoverPt.median, currency)}</b></span>}
          {series.floor  && <span><span style={{ color: '#60a5fa' }}>■</span> Boden: <b style={{ color: 'var(--text-primary)' }}>{fmtC(hoverPt.floor, currency)}</b></span>}
          {series.upper  && <span><span style={{ color: '#4ade80' }}>■</span> Oberes Band: <b style={{ color: 'var(--text-primary)' }}>{fmtC(hoverPt.upper, currency)}</b></span>}
          {series.cycle  && <span><span style={{ color: '#fbbf24' }}>■</span> Zyklus: <b style={{ color: 'var(--text-primary)' }}>{fmtC(hoverPt.cycle, currency)}</b></span>}
        </div>
      )}
    </div>
  )
}

// ── Datumsrechner ─────────────────────────────────────────────────
function DateCalculator({ currency }: { currency: Currency }) {
  const [dateStr, setDateStr] = useState(todayISODate())
  const { price: livePrice } = useBtcPrice(currency)

  const result = useMemo(() => {
    if (!dateStr) return null
    const date = new Date(dateStr + 'T12:00:00')
    if (isNaN(date.getTime())) return null
    if (date.getTime() < new Date('2009-01-04').getTime()) return null
    const med = powerLawPrice(date)
    return {
      median: toLocalCurrency(med, currency),
      floor:  toLocalCurrency(med * FLOOR_MULT, currency),
      upper:  toLocalCurrency(med * UPPER_BAND_MULT, currency),
      isPast:  date <= new Date(),
    }
  }, [dateStr, currency])

  const isToday = dateStr === todayISODate()
  const multiple = (result && livePrice && isToday) ? livePrice / result.median : null

  const zoneColor = multiple
    ? multiple < 0.5 ? '#60a5fa'
    : multiple < 1.5 ? '#4ade80'
    : multiple < 2.5 ? '#fbbf24'
    : '#f87171'
    : 'var(--text-secondary)'

  const zoneLabel = multiple
    ? multiple < 0.5 ? 'Unterbewertet'
    : multiple < 1.5 ? 'Fair bewertet'
    : multiple < 2.5 ? 'Erhöht'
    : 'Extrem'
    : null

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 className="font-bold text-base mb-1" style={{ letterSpacing: '-0.02em' }}>Datumsrechner</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
        Beliebiges Datum → Fair Value, Bodenpreis, Oberes Band
      </p>
      <div className="flex flex-wrap gap-3 items-end mb-5">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Datum</label>
          <input
            type="date"
            value={dateStr}
            min="2009-01-04"
            max="2060-12-31"
            onChange={e => setDateStr(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: 'var(--surface-alt)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>
      </div>

      {result ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Median (Fair Value)"
            value={fmtC(result.median, currency)}
            accent="#f97316"
          />
          <MetricCard
            label="Unteres Band (Boden)"
            value={fmtC(result.floor, currency)}
            accent="#60a5fa"
          />
          <MetricCard
            label="Oberes Band"
            value={fmtC(result.upper, currency)}
            accent="#4ade80"
          />
          {isToday && livePrice ? (
            <div className="rounded-lg p-3 flex flex-col justify-between"
              style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Live-Kurs</span>
              <div>
                <div className="font-bold text-base mt-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {fmtC(livePrice, currency)}
                </div>
                {multiple !== null && (
                  <div className="text-xs mt-1 font-semibold" style={{ color: zoneColor }}>
                    {fmtMultiple(multiple)} — {zoneLabel}
                  </div>
                )}
              </div>
            </div>
          ) : result.isPast ? (
            <MetricCard label="Live-Kurs" value="—" accent="var(--text-tertiary)" sub="vergangenes Datum" />
          ) : (
            <MetricCard label="Live-Kurs" value="—" accent="var(--text-tertiary)" sub="Zukunft" />
          )}
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Datum zu früh oder ungültig.</p>
      )}
    </div>
  )
}

// ── Zielpreis-Rechner ─────────────────────────────────────────────
function TargetPriceCalculator({ currency }: { currency: Currency }) {
  const [rawInput, setRawInput] = useState('200000')

  const result = useMemo(() => {
    const localPrice = parseFloat(rawInput.replace(',', '.'))
    if (!localPrice || localPrice <= 0) return null
    const usd = fromLocalCurrency(localPrice, currency)
    const medDate = dateForTargetPrice(usd)
    if (!medDate) return null
    // Floor date: floor reaches target → median needs to be target/FLOOR_MULT
    const floorDate = dateForTargetPrice(usd / FLOOR_MULT)
    // Upper band date: upper reaches target → median needs to be target/UPPER_BAND_MULT
    const upperDate = dateForTargetPrice(usd / UPPER_BAND_MULT)
    return { medDate, floorDate, upperDate, localPrice }
  }, [rawInput, currency])

  const sym = CURRENCY_SYMBOL[currency]

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 className="font-bold text-base mb-1" style={{ letterSpacing: '-0.02em' }}>Zielpreis-Rechner</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
        Zielpreis eingeben → wann laut Power Law erreichbar?
      </p>
      <div className="flex flex-wrap gap-3 items-end mb-5">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            Zielpreis ({sym})
          </label>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{sym}</span>
            <input
              type="number"
              value={rawInput}
              min="1"
              step="1000"
              onChange={e => setRawInput(e.target.value)}
              className="text-sm w-36"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {result ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DateResultCard
              label="Median erreicht Zielpreis"
              date={result.medDate}
              accent="#f97316"
              description="Power Law Median"
            />
            <DateResultCard
              label="Unteres Band erreicht Zielpreis"
              date={result.floorDate}
              accent="#60a5fa"
              description="Konservativster Fall (Crashkurs)"
            />
            <DateResultCard
              label="Oberes Band erreicht Zielpreis"
              date={result.upperDate}
              accent="#4ade80"
              description="Bull-Run-Übertreibung"
            />
          </div>
          <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Basiert auf dem Power Law Modell (Santostasi). Zielpreis in {currency}: {fmtC(result.localPrice, currency)}.
            Keine Anlageberatung.
          </p>
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Gib einen Zielpreis größer als 0 ein.</p>
      )}
    </div>
  )
}

// ── Hilfs-Komponenten ─────────────────────────────────────────────
function MetricCard({ label, value, accent, sub }: { label: string; value: string; accent: string; sub?: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <div className="font-bold text-base mt-1" style={{ color: accent, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sub}</div>}
    </div>
  )
}

function DateResultCard({ label, date, accent, description }: { label: string; date: Date | null; accent: string; description: string }) {
  if (!date) return <MetricCard label={label} value="—" accent={accent} />
  const isPast = date < new Date()
  const dateStr = fmtDateDE(date)
  const yearsFromNow = ((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365.25))
  const deltaStr = isPast
    ? `vor ${Math.abs(Math.round(yearsFromNow))} Jahren`
    : `in ~${Math.round(yearsFromNow)} Jahren`
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <div className="font-bold text-sm mt-1" style={{ color: accent, letterSpacing: '-0.01em' }}>{dateStr}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{deltaStr}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</div>
    </div>
  )
}

// ── Serien-Toggle ─────────────────────────────────────────────────
function SeriesToggle({
  series, onChange,
}: {
  series: ChartSeries
  onChange: (key: keyof ChartSeries) => void
}) {
  const items: { key: keyof ChartSeries; label: string; color: string }[] = [
    { key: 'median', label: 'Median',         color: '#f97316' },
    { key: 'floor',  label: 'Unteres Band',   color: '#60a5fa' },
    { key: 'upper',  label: 'Oberes Band',    color: '#4ade80' },
    { key: 'cycle',  label: '4-Jahres-Zyklus',color: '#fbbf24' },
    { key: 'hist',   label: 'Histor. Preise', color: '#aaa' },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="text-xs rounded-lg px-3 py-1.5 font-medium transition-opacity"
          style={{
            background: series[key] ? 'var(--surface-alt)' : 'transparent',
            border: `1px solid ${series[key] ? color : 'var(--border)'}`,
            color: series[key] ? color : 'var(--text-tertiary)',
            opacity: series[key] ? 1 : 0.6,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────────
export default function FairPricePage() {
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [projYear, setProjYear]  = useState<ProjYear>(2035)
  const [chartMode, setChartMode] = useState<ChartMode>('log-lin')
  const [series, setSeries] = useState<ChartSeries>({
    median: true, floor: true, upper: true, cycle: false, hist: true,
  })

  function toggleSeries(key: keyof ChartSeries) {
    setSeries(s => ({ ...s, [key]: !s[key] }))
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader />
      <main className="px-4 md:px-10 py-10 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Bitcoin Rechner
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ letterSpacing: '-0.03em' }}>
            Fair Price & Power Law
          </h1>
          <p className="text-sm max-w-xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Das Power Law Modell beschreibt Bitcoins Preisanstieg als Potenzgesetz seit dem Genesis Block (Januar 2009).
            Drei Tools: Datumsrechner, Zielpreis-Rechner und historischer Chart mit Projektion bis {projYear}.
          </p>
        </div>

        {/* Globale Steuerung: Währung */}
        <div className="flex gap-2 mb-8">
          {(['EUR', 'USD', 'CHF'] as Currency[]).map(c => (
            <button key={c} onClick={() => setCurrency(c)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: currency === c ? 'var(--text-primary)' : 'var(--surface)',
                color: currency === c ? 'var(--bg)' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Tool 1: Datumsrechner */}
        <DateCalculator currency={currency} />

        {/* Spacer */}
        <div className="my-6" />

        {/* Tool 2: Zielpreis-Rechner */}
        <TargetPriceCalculator currency={currency} />

        {/* Spacer */}
        <div className="my-6" />

        {/* Tool 3: Power Law Chart */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-bold text-base mb-1" style={{ letterSpacing: '-0.02em' }}>Power Law Chart</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Historischer Preis + Power Law Modell + Projektion bis {projYear}. Y-Achse: logarithmisch.
          </p>

          {/* Chart controls */}
          <div className="flex flex-wrap gap-4 items-start mb-4">
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Serien</p>
              <SeriesToggle series={series} onChange={toggleSeries} />
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Skalierung X-Achse</p>
              <div className="flex gap-2">
                {(['log-lin', 'log-log'] as ChartMode[]).map(m => (
                  <button key={m} onClick={() => setChartMode(m)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{
                      background: chartMode === m ? 'var(--surface-alt)' : 'transparent',
                      border: `1px solid ${chartMode === m ? 'var(--text-secondary)' : 'var(--border)'}`,
                      color: chartMode === m ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    }}>
                    {m === 'log-lin' ? 'Linear' : 'Logarithmisch'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Projektion bis</p>
              <div className="flex gap-2">
                {([2035, 2040, 2045] as ProjYear[]).map(y => (
                  <button key={y} onClick={() => setProjYear(y)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{
                      background: projYear === y ? 'var(--surface-alt)' : 'transparent',
                      border: `1px solid ${projYear === y ? 'var(--text-secondary)' : 'var(--border)'}`,
                      color: projYear === y ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    }}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <PowerLawChart
            currency={currency}
            projYear={projYear}
            mode={chartMode}
            series={series}
          />
        </div>

        {/* Modell-Erklärung */}
        <div className="mt-6 rounded-xl p-5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <h3 className="font-semibold mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>Über das Power Law Modell</h3>
          <p>
            Das Power Law Modell wurde von Physiker Giovanni Santostasi entwickelt. Es beschreibt Bitcoins
            Preisanstieg mit der Formel <code style={{ fontSize: 11, background: 'var(--surface-alt)', padding: '1px 5px', borderRadius: 4 }}>log₁₀(P) = −17,016 + 5,845 · log₁₀(d)</code>,
            wobei <em>d</em> die Tage seit dem Genesis Block (3. Januar 2009) sind.
            Auf einer doppelt-logarithmischen Skala (Log-Log) erscheint der Median als gerade Linie.
          </p>
          <p className="mt-2">
            Das <strong>untere Band</strong> entspricht 35 % des Medians (historisches Tief-Niveau),
            das <strong>obere Band</strong> ~286 % des Medians (symmetrisch im Log-Raum, entspricht historischen Blasen-Hochs).
            Kein Modell garantiert zukünftige Kursentwicklungen. Keine Anlageberatung.
          </p>
        </div>

        <div className="mt-8">
          <BoersenCTA />
        </div>

      </main>
    </div>
  )
}
