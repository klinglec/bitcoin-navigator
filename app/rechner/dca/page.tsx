'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { modelPrice, toLocalCurrency, PriceModel } from '@/lib/powerLaw'
import { useBtcPrice, formatPrice, Currency } from '@/lib/useBtcPrice'

const HISTORICAL_PRICES: Record<number, number> = {
  2014: 320, 2015: 430, 2016: 963, 2017: 13800, 2018: 3742, 2019: 7240,
  2020: 28990, 2021: 46306, 2022: 16547, 2023: 42258, 2024: 93429,
}

// ── Kauffrequenz ──────────────────────────────────────────────
type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'bimonthly'

const FREQ_LABELS: Record<Frequency, string> = {
  weekly:    'Wöchentlich',
  biweekly:  'Alle 2 Wochen',
  monthly:   'Monatlich',
  bimonthly: 'Zweimonatlich',
}

// Käufe pro Monat (als Dezimalzahl)
const FREQ_PER_MONTH: Record<Frequency, number> = {
  weekly:    52 / 12,   // ~4,33
  biweekly:  26 / 12,   // ~2,17
  monthly:   1,
  bimonthly: 0.5,
}

// Interpolierter historischer Preis für Jahr + Monat (0–11), in USD
function historicalMonthPrice(year: number, month: number): number | null {
  const curr = HISTORICAL_PRICES[year]
  if (!curr) return null
  const prev = HISTORICAL_PRICES[year - 1] ?? curr
  // Lineare Interpolation: Jan=prev, Dez=curr
  return prev + (curr - prev) * ((month + 1) / 12)
}

const MODEL_LABELS: Record<PriceModel, string> = {
  power_law:  'Power Law Median',
  cycle_4yr:  '4-Jahres-Zyklus',
  lower_band: 'Unteres Band',
}

const MODEL_DESCRIPTIONS: Record<PriceModel, string> = {
  power_law:  'Der Bitcoin-Preis folgt auf doppelt-logarithmischer Skala seit 2009 einer Geraden. Formel: log₁₀(P) = −17,016 + 5,845 · log₁₀(d), wobei d = Tage seit Genesis Block. Entwickelt von Physiker Giovanni Santostasi.',
  cycle_4yr:  'Überlagert den Power Law Median mit einem Sinus-Zyklus (~1.460 Tage), der historische Halving-Zyklen abbildet. Zeigt Hoch- und Tiefphasen realitätsnäher als der glatte Median.',
  lower_band: 'Entspricht ca. 35 % des Power Law Medians. Historisch haben große Bärenmärkte in diesem Bereich ihren Tiefpunkt gefunden – ein konservativer Worst-Case.',
}

const CURRENCY_SYMBOL: Record<Currency, string> = { EUR: '€', USD: '$', CHF: 'CHF' }

function fmtCurrency(v: number, currency: Currency) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
}
function fmtBtc(v: number) {
  if (v >= 1) return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' BTC'
  return (v * 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' Sats'
}
function fmtK(v: number, currency: Currency) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.', ',') + ' Mio. ' + CURRENCY_SYMBOL[currency]
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k ' + CURRENCY_SYMBOL[currency]
  return v.toFixed(0) + ' ' + CURRENCY_SYMBOL[currency]
}

// ── Info Tooltip ──────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block ml-1.5">
      <button onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
        style={{ background: 'var(--border)', color: 'var(--text-secondary)', fontSize: '10px' }}>
        i
      </button>
      {open && (
        <span className="absolute left-6 top-0 z-50 w-64 rounded-xl border p-3 text-xs shadow-lg"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {text}
        </span>
      )}
    </span>
  )
}

// ── Datenmodell ───────────────────────────────────────────────
interface MonthRow {
  year: number; month: number          // month 0–11
  btcPrice: number                     // Monatspreis in Lokalwährung
  btcBought: number; totalBtc: number
  totalInvested: number; portfolioValue: number
  sp500Value: number; gain: number
  isProjection: boolean
}

interface YearRow {
  year: number; btcPrice: number; btcBought: number; totalBtc: number
  totalInvested: number; portfolioValue: number; sp500Value: number; gain: number
  isProjection: boolean
}

const NOW_YEAR  = new Date().getFullYear()
const NOW_MONTH = new Date().getMonth()   // 0–11

function isAfterToday(year: number, month: number): boolean {
  return year > NOW_YEAR || (year === NOW_YEAR && month > NOW_MONTH)
}

function calcMonthly(params: {
  purchaseAmount: number; frequency: Frequency; existingBtc: number
  projectionYears: number; model: PriceModel; currency: Currency
  inflation: boolean; inflationRate: number; lumpSum: number
  backtestStart: number | null
}): MonthRow[] {
  const { purchaseAmount, frequency, existingBtc, projectionYears, model, currency, inflation, inflationRate, lumpSum, backtestStart } = params
  const startYear  = backtestStart ?? NOW_YEAR
  const endYear    = NOW_YEAR + projectionYears
  const freqPM     = FREQ_PER_MONTH[frequency]

  let totalBtc = existingBtc, totalInvested = 0, sp500Value = 0
  let perPurchase = purchaseAmount
  const rows: MonthRow[] = []

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const isProjection = isAfterToday(year, month)

      // Kein Backtest? Starte ab aktuellem Monat
      if (!backtestStart && !isProjection) continue

      const histPrice = !isProjection ? historicalMonthPrice(year, month) : null
      const priceUsd  = histPrice ?? modelPrice(new Date(year, month, 15), model)
      const btcPrice  = toLocalCurrency(priceUsd, currency)

      const spent     = perPurchase * freqPM + (totalInvested === 0 ? lumpSum : 0)
      const btcBought = spent / btcPrice
      totalBtc      += btcBought
      totalInvested += spent
      if (totalInvested === spent) sp500Value = lumpSum
      sp500Value = sp500Value * Math.pow(1.08, 1 / 12) + perPurchase * freqPM

      rows.push({ year, month, btcPrice, btcBought, totalBtc, totalInvested, portfolioValue: totalBtc * btcPrice, sp500Value, gain: totalBtc * btcPrice - totalInvested, isProjection })
    }
    if (inflation) perPurchase *= (1 + inflationRate / 100)
  }
  return rows
}

// Jahres-Aggregierung für die Tabelle
function aggregateToYears(monthly: MonthRow[]): YearRow[] {
  const map = new Map<number, YearRow>()
  for (const m of monthly) {
    map.set(m.year, {
      year: m.year, btcPrice: m.btcPrice, btcBought: (map.get(m.year)?.btcBought ?? 0) + m.btcBought,
      totalBtc: m.totalBtc, totalInvested: m.totalInvested,
      portfolioValue: m.portfolioValue, sp500Value: m.sp500Value, gain: m.gain,
      isProjection: m.isProjection,
    })
  }
  return Array.from(map.values())
}

const MONTH_NAMES = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

// ── Kombinierter SVG Chart (monatliche Datenpunkte) ──────────
function DcaChart({ rows, currency, showSp500 }: {
  rows: MonthRow[]; currency: Currency; showSp500: boolean
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 640, H = 280, PAD = { top: 20, right: 20, bottom: 36, left: 68 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...rows.map(r => Math.max(r.portfolioValue, showSp500 ? r.sp500Value : 0, 1)))
  const scaleX = (i: number) => PAD.left + (i / Math.max(rows.length - 1, 1)) * innerW
  const scaleY = (v: number) => PAD.top + innerH - Math.min((v / maxVal) * innerH, innerH)

  const todayIdx = rows.findIndex(r => r.isProjection)
  const histRows = todayIdx > 0 ? rows.slice(0, todayIdx) : []
  const projRows = todayIdx >= 0 ? rows.slice(todayIdx) : rows

  const pts = (subset: MonthRow[], offset: number) =>
    subset.map((r, i) => `${scaleX(i + offset)},${scaleY(r.portfolioValue)}`).join(' ')

  const ptHistPortfolio = pts(histRows, 0)
  const ptProjPortfolio = pts(projRows, histRows.length)
  const ptInvested = rows.map((r, i) => `${scaleX(i)},${scaleY(r.totalInvested)}`).join(' ')
  const ptSp500    = rows.map((r, i) => `${scaleX(i)},${scaleY(r.sp500Value)}`).join(' ')

  const histAreaPts = histRows.length > 0
    ? `${PAD.left},${PAD.top + innerH} ${ptHistPortfolio} ${scaleX(histRows.length - 1)},${PAD.top + innerH}` : ''
  const projStartX = scaleX(histRows.length)
  const projAreaPts = projRows.length > 0
    ? `${projStartX},${PAD.top + innerH} ${ptProjPortfolio} ${scaleX(rows.length - 1)},${PAD.top + innerH}` : ''

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: f * maxVal, y: scaleY(f * maxVal) }))

  // X-Labels: ein Label pro Jahr (nur Januar)
  const xLabels = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.month === 0 || r === rows[0])

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) * (W / rect.width) - PAD.left
    const idx = Math.round((x / innerW) * (rows.length - 1))
    setHoverIdx(Math.max(0, Math.min(rows.length - 1, idx)))
  }, [rows.length, innerW])

  const hov = hoverIdx !== null ? rows[hoverIdx] : null
  const todayX = todayIdx > 0 ? scaleX(todayIdx) : null

  return (
    <div>
      {/* Legende */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {histRows.length > 0 && <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-2 rounded" style={{ background: '#22c55e' }} />Historisch</span>}
        <span className="flex items-center gap-1.5">
          <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" /></svg>
          Projektion
        </span>
        <span className="flex items-center gap-1.5"><svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#f59e0b" strokeWidth="1.5" /></svg>Eingezahlt</span>
        {showSp500 && <span className="flex items-center gap-1.5"><svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 2" /></svg>S&P 500</span>}
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%"
        style={{ cursor: 'crosshair', overflow: 'visible' }}
        onMouseMove={onMouseMove} onMouseLeave={() => setHoverIdx(null)}>

        {/* Y-Raster */}
        {yTicks.map(({ v, y }) => (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--border)" strokeWidth={0.5} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-tertiary)">{fmtK(v, currency)}</text>
          </g>
        ))}

        {/* X-Labels: nur Jahreswechsel */}
        {xLabels.map(({ r, i }) => (
          <text key={`${r.year}-${r.month}`} x={scaleX(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">{r.year}</text>
        ))}

        {/* Historische Fläche (opak) */}
        {histAreaPts && <polygon points={histAreaPts} fill="#22c55e" fillOpacity={0.18} />}
        {/* Projektions-Fläche (heller) */}
        {projAreaPts && <polygon points={projAreaPts} fill="#22c55e" fillOpacity={0.07} />}

        {/* Historische Linie (durchgezogen) */}
        {ptHistPortfolio && <polyline points={ptHistPortfolio} fill="none" stroke="#22c55e" strokeWidth={2} />}
        {/* Projektions-Linie (gestrichelt) */}
        {ptProjPortfolio && <polyline points={ptProjPortfolio} fill="none" stroke="#22c55e" strokeWidth={2} strokeDasharray="6 3" />}

        {/* Investiertes Kapital */}
        <polyline points={ptInvested} fill="none" stroke="#f59e0b" strokeWidth={1.5} />

        {/* S&P 500 */}
        {showSp500 && <polyline points={ptSp500} fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 3" />}

        {/* "Heute"-Trennlinie */}
        {todayX !== null && (
          <g>
            <line x1={todayX} y1={PAD.top} x2={todayX} y2={PAD.top + innerH}
              stroke="var(--text-tertiary)" strokeWidth={1} strokeDasharray="3 2" />
            <rect x={todayX - 16} y={PAD.top - 1} width={32} height={12} rx={3}
              fill="var(--surface-alt)" />
            <text x={todayX} y={PAD.top + 8} textAnchor="middle" fontSize={8} fill="var(--text-secondary)" fontWeight={500}>
              Heute
            </text>
          </g>
        )}

        {/* Hover-Linie */}
        {hoverIdx !== null && (
          <line x1={scaleX(hoverIdx)} y1={PAD.top} x2={scaleX(hoverIdx)} y2={PAD.top + innerH}
            stroke="var(--text-tertiary)" strokeWidth={1} strokeDasharray="3 2" />
        )}
      </svg>

      {/* Hover-Tooltip */}
      {hov && (
        <div className="mt-3 rounded-xl border p-3 text-xs" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {MONTH_NAMES[hov.month]} {hov.year}
            </p>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{
              background: hov.isProjection ? 'var(--surface-alt)' : 'var(--green-bg)',
              color: hov.isProjection ? 'var(--text-tertiary)' : 'var(--green)',
              fontSize: '10px',
            }}>
              {hov.isProjection ? 'Projektion' : 'Historisch'}
            </span>
          </div>
          <div className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between gap-8"><span style={{ color: '#22c55e' }}>Portfoliowert</span><span className="font-medium">{fmtCurrency(hov.portfolioValue, currency)}</span></div>
            <div className="flex justify-between gap-8"><span>Eingezahlt</span><span>{fmtCurrency(hov.totalInvested, currency)}</span></div>
            {showSp500 && <div className="flex justify-between gap-8"><span style={{ color: '#60a5fa' }}>S&P 500</span><span>{fmtCurrency(hov.sp500Value, currency)}</span></div>}
            <div className="flex justify-between gap-8 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              <span>Wertzuwachs</span>
              <span style={{ color: '#22c55e' }}>+{(((hov.portfolioValue - hov.totalInvested) / Math.max(hov.totalInvested, 1)) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────
export default function DcaRechner() {
  const [purchaseAmount, setPurchaseAmount] = useState(300)
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [existingBtc, setExistingBtc] = useState(0)
  const [years, setYears] = useState(10)
  const [model, setModel] = useState<PriceModel>('power_law')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [inflation, setInflation] = useState(false)
  const [inflationRate, setInflationRate] = useState(4)
  const [lumpSum, setLumpSum] = useState(0)
  const [showSp500, setShowSp500] = useState(true)
  const [backtest, setBacktest] = useState<number | null>(null)

  const { price: livePrice } = useBtcPrice(currency)

  const annualSpend = purchaseAmount * FREQ_PER_MONTH[frequency] * 12

  const monthlyRows = useMemo(() => calcMonthly({
    purchaseAmount, frequency, existingBtc, projectionYears: years,
    model, currency, inflation, inflationRate, lumpSum, backtestStart: backtest,
  }), [purchaseAmount, frequency, existingBtc, years, model, currency, inflation, inflationRate, lumpSum, backtest])

  const rows = useMemo(() => aggregateToYears(monthlyRows), [monthlyRows])

  const last = rows[rows.length - 1]
  const totalInvested   = last?.totalInvested ?? 0
  const portfolioValue  = last?.portfolioValue ?? 0
  const totalBtc        = last?.totalBtc ?? 0
  const gainPct         = totalInvested > 0 ? ((portfolioValue - totalInvested) / totalInvested) * 100 : 0

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader />
      <main className="px-4 md:px-12 py-10 max-w-5xl mx-auto">

        <div className="mb-8">
          <Link href="/rechner" className="text-xs mb-3 block hover:underline" style={{ color: 'var(--text-tertiary)' }}>← Alle Rechner</Link>
          <h1 className="text-3xl font-bold mb-1" style={{ letterSpacing: '-0.03em' }}>Bitcoin Sparplan-Rechner</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Monatliche Käufe, Power Law Projektion, historische Szenarien
            {livePrice && <> · Aktuell: <strong>{formatPrice(livePrice, currency)}</strong></>}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

          {/* ── Inputs ── */}
          <div className="space-y-4">
            {/* Währung */}
            <div className="flex gap-2">
              {(['EUR','USD','CHF'] as Currency[]).map(c => (
                <button key={c} onClick={() => setCurrency(c)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    background: currency === c ? 'var(--text-primary)' : 'transparent',
                    color: currency === c ? 'var(--bg)' : 'var(--text-secondary)',
                    borderColor: currency === c ? 'var(--text-primary)' : 'var(--border)',
                  }}>{c}</button>
              ))}
            </div>

            {/* Preismodell */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Preismodell (Projektion)</label>
              <div className="space-y-1">
                {(Object.keys(MODEL_LABELS) as PriceModel[]).map(m => (
                  <button key={m} onClick={() => setModel(m)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center justify-between"
                    style={{
                      background: model === m ? 'var(--surface-alt)' : 'transparent',
                      borderColor: model === m ? 'var(--border-strong)' : 'var(--border)',
                      color: 'var(--text-primary)', fontWeight: model === m ? 500 : 400,
                    }}>
                    <span>{MODEL_LABELS[m]}</span>
                    <InfoTooltip text={MODEL_DESCRIPTIONS[m]} />
                  </button>
                ))}
              </div>
            </div>

            {/* Sparplan */}
            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Sparplan</p>

              {/* Frequenz */}
              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--text-secondary)' }}>Kauffrequenz</label>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.keys(FREQ_LABELS) as Frequency[]).map(f => (
                    <button key={f} onClick={() => setFrequency(f)}
                      className="py-1.5 rounded-lg text-xs border font-medium transition-all"
                      style={{
                        background: frequency === f ? 'var(--text-primary)' : 'transparent',
                        color: frequency === f ? 'var(--bg)' : 'var(--text-secondary)',
                        borderColor: frequency === f ? 'var(--text-primary)' : 'var(--border)',
                      }}>
                      {FREQ_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  Kaufbetrag pro {frequency === 'weekly' ? 'Woche' : frequency === 'biweekly' ? '2 Wochen' : frequency === 'monthly' ? 'Monat' : '2 Monate'} ({CURRENCY_SYMBOL[currency]})
                </label>
                <input type="number" value={purchaseAmount} min={1}
                  onChange={e => setPurchaseAmount(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  ≈ {fmtCurrency(annualSpend, currency)} pro Jahr
                </p>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Vorhandene BTC</label>
                <input type="number" value={existingBtc} min={0} step={0.001}
                  onChange={e => setExistingBtc(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  Projektionszeitraum ab heute
                </label>
                <input type="range" min={1} max={30} value={years}
                  onChange={e => setYears(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  <span>1 J.</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{years} Jahre</span>
                  <span>30 J.</span>
                </div>
              </div>
            </div>

            {/* Optionen */}
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Optionen</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={inflation} onChange={e => setInflation(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Inflationsanpassung</span>
              </label>
              {inflation && (
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Inflationsrate (% p.a.)</label>
                  <input type="number" value={inflationRate} min={0} max={20} step={0.5}
                    onChange={e => setInflationRate(Number(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
              )}
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Einmalinvestition ({CURRENCY_SYMBOL[currency]})</label>
                <input type="number" value={lumpSum} min={0}
                  onChange={e => setLumpSum(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={showSp500} onChange={e => setShowSp500(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>S&P 500-Vergleich (8% p.a.)</span>
              </label>
            </div>

            {/* Historische Szenarien */}
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>Historisches Szenario</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Reale Preise bis heute, dann Modellprojektion – alles in einem Chart.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[2015, 2017, 2020, 2022].map(yr => (
                  <button key={yr} onClick={() => setBacktest(backtest === yr ? null : yr)}
                    className="py-2 rounded-lg text-sm border font-medium transition-all"
                    style={{
                      background: backtest === yr ? 'var(--text-primary)' : 'transparent',
                      color: backtest === yr ? 'var(--bg)' : 'var(--text-secondary)',
                      borderColor: backtest === yr ? 'var(--text-primary)' : 'var(--border)',
                    }}>
                    Ab {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Ergebnisse ── */}
          <div className="space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'BTC-Stack', value: fmtBtc(totalBtc) },
                { label: 'Portfoliowert', value: fmtCurrency(portfolioValue, currency) },
                { label: 'Eingezahlt', value: fmtCurrency(totalInvested, currency) },
                { label: 'Wertzuwachs', value: `+${gainPct.toFixed(0)}%`, highlight: true },
              ].map(kpi => (
                <div key={kpi.label} className="rounded-xl border p-4"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{kpi.label}</p>
                  <p className="text-base font-bold" style={{ color: kpi.highlight ? '#22c55e' : 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Portfoliowert vs. Eingezahltes Kapital
                </h2>
                {backtest && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '0.5px solid var(--green-border)' }}>
                    {backtest} · Reale Preise + Projektion
                  </span>
                )}
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                {backtest
                  ? `Durchgezogen = historische Preise (${backtest}–heute) · Gestrichelt = ${model === 'power_law' ? 'Power Law' : model === 'cycle_4yr' ? '4-Jahres-Zyklus' : 'Unteres Band'} Projektion`
                  : `${FREQ_LABELS[frequency]}, ${fmtCurrency(purchaseAmount, currency)} pro Kauf · Maus für Jahreswerte`}
              </p>
              <DcaChart rows={monthlyRows} currency={currency} showSp500={showSp500} />
            </div>

            {/* Tabelle */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                      {['Jahr', 'BTC-Kurs', 'Gekauft', 'Stack', 'Eingezahlt', 'Wert', showSp500 ? 'S&P 500' : null, '+/−']
                        .filter(Boolean).map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap"
                            style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.year}
                        style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined, background: row.isProjection ? 'var(--bg)' : 'var(--surface)' }}>
                        <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: row.isProjection ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {row.year}{row.isProjection ? '' : ' ✓'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmtCurrency(row.btcPrice, currency)}</td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{(row.btcBought * 1e6).toFixed(0)} Sats</td>
                        <td className="px-3 py-2 whitespace-nowrap font-medium" style={{ color: 'var(--text-primary)' }}>{fmtBtc(row.totalBtc)}</td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmtCurrency(row.totalInvested, currency)}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-bold" style={{ color: '#22c55e' }}>{fmtCurrency(row.portfolioValue, currency)}</td>
                        {showSp500 && <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>{fmtCurrency(row.sp500Value, currency)}</td>}
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: row.gain >= 0 ? '#22c55e' : '#ef4444' }}>
                          {row.gain >= 0 ? '+' : ''}{((row.gain / Math.max(row.totalInvested, 1)) * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              ✓ = reale Jahresschlusspreise (Coinmarketcap). Projektionen basieren auf dem Power Law Modell (Giovanni Santostasi). Keine Anlageberatung.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
