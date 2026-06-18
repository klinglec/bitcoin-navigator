'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import BoersenCTA from '@/components/BoersenCTA'
import { modelPrice, toLocalCurrency, PriceModel } from '@/lib/powerLaw'
import { useBtcPrice, formatPrice, Currency } from '@/lib/useBtcPrice'
import { calcFreedomViaLoan, calcBorrowLive, MARKET_RATES, LoanTermMonths } from '@/lib/loanCalculations'
import {
  powerLawMultiple, getPowerLawZone, getLiqRisk,
  PowerLawZone, LiqRisk,
  powerLawPrice, powerLawFloor,
} from '@/lib/powerLaw'

// ── Formatierung ──────────────────────────────────────────────────
const CURRENCY_SYMBOL: Record<Currency, string> = { EUR: '€', USD: '$', CHF: 'CHF' }
const MODEL_LABELS: Record<PriceModel, string> = {
  power_law:  'Power Law Median',
  cycle_4yr:  '4-Jahres-Zyklus',
  lower_band: 'Unteres Band (konservativ)',
}
const MONTH_NAMES = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const NOW_Y = new Date().getFullYear()
const NOW_M = new Date().getMonth()

function fmtC(v: number, currency: Currency) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
}
function fmtBtc(v: number) {
  if (v <= 0) return '0 BTC'
  if (v >= 0.001) return v.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 4 }) + ' BTC'
  return (v * 1e6).toFixed(0) + ' Sats'
}
function fmtK(v: number, sym: string) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.', ',') + ' Mio. ' + sym
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k ' + sym
  return v.toFixed(0) + ' ' + sym
}

// ── Tooltip-Komponente ────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        style={{
          width: 15, height: 15, borderRadius: '50%',
          background: 'var(--surface-alt)', border: '1px solid var(--border)',
          color: 'var(--text-tertiary)', fontSize: 9, fontWeight: 600,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
          justifyContent: 'center', verticalAlign: 'middle', marginLeft: 4, flexShrink: 0,
        }}
        aria-label="Erklärung anzeigen"
      >?</button>
      {open && (
        <span style={{
          position: 'absolute', left: 20, top: -4, zIndex: 100,
          background: '#1a1a1a', color: '#fff', fontSize: 11, lineHeight: 1.5,
          padding: '8px 10px', borderRadius: 8, width: 220,
          pointerEvents: 'none', display: 'block',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

function FieldLabel({ children, tooltip }: { children: React.ReactNode; tooltip: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{children}</span>
      <Tooltip text={tooltip} />
    </div>
  )
}

// ── Power Law Zone Gauge ──────────────────────────────────────────

const ZONE_COLORS: Record<PowerLawZone, { bg: string; text: string; label: string }> = {
  undervalued: { bg: '#eef7ee',                   text: '#2a6a2a', label: 'Unterbewertet' },
  fair:        { bg: '#e8f2e8',                   text: '#2a6a2a', label: 'Fair Value'     },
  elevated:    { bg: 'rgba(245,158,11,0.12)',      text: '#854F0B', label: 'Erhöht'        },
  extreme:     { bg: '#e8e5e0',                   text: '#444444', label: 'Extrem'         },
}

function PowerLawZoneGauge({ multiple, currency }: { multiple: number; currency: Currency }) {
  const zone   = getPowerLawZone(multiple)
  const medianToday    = (powerLawPrice(new Date()) * (currency === 'USD' ? 1 : currency === 'EUR' ? 0.925 : 0.91))
  const lowerBandToday = medianToday * 0.35

  // Nadel-Position: logarithmisch auf [0..100] skaliert, clamp bei 5–95%
  const needlePct = Math.min(95, Math.max(5,
    multiple < 0.5  ? (multiple / 0.5) * 20 :
    multiple < 1.5  ? 20 + ((multiple - 0.5) / 1.0) * 35 :
    multiple < 2.5  ? 55 + ((multiple - 1.5) / 1.0) * 25 :
                      80 + Math.min(15, ((multiple - 2.5) / 1.5) * 15)
  ))

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Power Law Position
      </p>

      {/* Gauge Track */}
      <div style={{ position: 'relative', marginBottom: 28, paddingTop: 40 }}>
        <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden' }}>
          {(['undervalued','fair','elevated','extreme'] as PowerLawZone[]).map((z, i) => (
            <div key={z} style={{
              flex: z === 'fair' ? 1.75 : 1,
              background: ZONE_COLORS[z].bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700, color: ZONE_COLORS[z].text,
            }}>
              {ZONE_COLORS[z].label}
            </div>
          ))}
        </div>

        {/* Nadel */}
        <div style={{ position: 'absolute', left: `${needlePct}%`, top: 0, transform: 'translateX(-50%)' }}>
          <div style={{
            background: '#1a1a1a', color: '#fff',
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20,
            whiteSpace: 'nowrap', marginBottom: 2, textAlign: 'center',
          }}>
            {multiple.toFixed(2)}× Median
          </div>
          <div style={{ width: 2, height: 22, background: '#1a1a1a', margin: '0 auto', borderRadius: 1 }} />
          <div style={{
            width: 0, height: 0,
            borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
            borderTop: '5px solid #1a1a1a', margin: '0 auto',
          }} />
        </div>

        {/* Skala */}
        <div style={{ display: 'flex', marginTop: 3, fontSize: 9, color: 'var(--text-tertiary)' }}>
          <span style={{ flex: 1 }}>&lt; 0,5×</span>
          <span style={{ flex: 1.75, textAlign: 'center' }}>0,5–1,5×</span>
          <span style={{ flex: 1, textAlign: 'center' }}>1,5–2,5×</span>
          <span style={{ flex: 1, textAlign: 'right' }}>&gt; 2,5×</span>
        </div>
      </div>

      {/* Werte */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
        <div>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>Median heute</p>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(medianToday)}
          </p>
        </div>
        <div>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>Unteres Band heute</p>
          <p className="font-medium" style={{ color: '#2a6a2a' }}>
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(lowerBandToday)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Preis-Risiko-Banner (nur bei withLoan) ────────────────────────

function PriceRiskBanner({
  multiple, liqPrice, currency, ltv,
}: {
  multiple: number
  liqPrice: number
  currency: Currency
  ltv: number
}) {
  const zone    = getPowerLawZone(multiple)
  const liqRisk = getLiqRisk(liqPrice, currency)

  const fxRate  = currency === 'USD' ? 1 : currency === 'EUR' ? 0.925 : 0.91
  const median    = powerLawPrice(new Date()) * fxRate
  const lowerBand = median * 0.35
  const fmt = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)

  // Kein Banner wenn Preis unterbewertet/fair und Liq. sicher
  if (zone === 'undervalued') {
    return (
      <div className="rounded-xl border p-4"
        style={{ borderColor: 'var(--green-border)', background: 'var(--green-bg)' }}>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Preis nahe Power Law Boden
        </p>
        <p className="text-xs" style={{ color: 'var(--green)' }}>
          BTC steht aktuell nahe dem unteren Band — historisch ein günstiger Zeitpunkt für die Kredit-Strategie.
        </p>
      </div>
    )
  }

  if (zone === 'fair' && liqRisk === 'safe') return null

  // Warnstufe bestimmen
  const isCritical = liqRisk === 'critical' || zone === 'extreme'
  const isElevated = !isCritical && (zone === 'elevated' || liqRisk === 'moderate')

  const bannerStyle = isCritical
    ? { borderColor: 'var(--border-strong)', background: 'var(--surface-alt)' }
    : { borderColor: '#f59e0b', background: 'rgba(245,158,11,0.04)' }
  const titleColor  = isCritical ? 'var(--text-primary)' : '#854F0B'
  const bodyColor   = isCritical ? 'var(--text-secondary)' : '#92400e'

  // LTV bei Median und unterem Band berechnen (vereinfacht: Schulden ≈ liqPrice × ltv × stack ≈ konstant)
  // Einfacher: zeige den Median-Kurs und ob liqPrice darüber liegt
  const liqAboveMedian   = liqPrice >= median
  const liqAboveLower    = liqPrice >= lowerBand

  return (
    <div className="rounded-xl border p-4" style={bannerStyle}>
      <p className="text-xs font-medium mb-2" style={{ color: titleColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {isCritical ? '⚠ Korrekturrisiko bei aktuellem Preisniveau' : '⚠ Erhöhtes Preisniveau beachten'}
      </p>
      <p className="text-xs mb-3" style={{ color: bodyColor, lineHeight: 1.6 }}>
        BTC steht aktuell <strong>{multiple.toFixed(2)}× über dem Power Law Median</strong>{' '}
        ({fmt(median)}).{' '}
        {liqAboveMedian
          ? 'Dein Liquidationspreis liegt nahe dem Median — eine normale Zykluskorrektur könnte zur Liquidation führen.'
          : liqAboveLower
          ? 'Dein Liquidationspreis liegt über dem unteren Band — ein starker Korrekturfehler könnte kritisch werden.'
          : 'Dein Liquidationspreis liegt unter dem unteren Band — nur ein historischer Extremcrash wäre kritisch.'}
      </p>

      {/* Worst-Case-Tabelle */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1fr 0.9fr', background: 'var(--surface-alt)', padding: '6px 10px', fontSize: 9, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', gap: 6 }}>
          <span>Szenario</span><span>BTC-Kurs</span><span>Abstand zu Liq.</span><span>Status</span>
        </div>
        {[
          { label: 'Heute',         price: liqPrice / ltv / (1 / ltv),  scenario: 'live',  actualPrice: liqPrice / ltv * (1 / ltv) },
          { label: '→ Median',      price: median,      scenario: 'median'     },
          { label: '→ Unteres Band', price: lowerBand,  scenario: 'lower'      },
        ].map(({ label, price, scenario }) => {
          // Nutze die tatsächlichen Preise für die Szenario-Zeilen
          const rowPrice = scenario === 'live'
            ? (liqPrice / ltv * (1/ltv))  // Näherung: heutiger Preis
            : scenario === 'median' ? median : lowerBand
          const pricePct = rowPrice > 0 ? ((rowPrice - liqPrice) / rowPrice * 100) : 0
          const isSafe   = rowPrice > liqPrice * 1.3
          const isWarn   = rowPrice > liqPrice && !isSafe
          const isDanger = rowPrice <= liqPrice

          const tagStyle = isSafe
            ? { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' }
            : isWarn
            ? { background: 'rgba(245,158,11,0.10)', color: '#854F0B' }
            : { background: '#e8e5e0', color: '#444' }

          return (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1fr 0.9fr', padding: '7px 10px', borderTop: '1px solid var(--border)', fontSize: 11, gap: 6, alignItems: 'center', background: isDanger ? '#f5f3f0' : 'var(--surface)' }}>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
              <span style={{ color: scenario === 'median' ? 'var(--text-secondary)' : scenario === 'lower' ? '#2a6a2a' : '#854F0B', fontWeight: 500 }}>
                {fmt(rowPrice)}
              </span>
              <span style={{ color: isDanger ? '#444' : 'var(--text-secondary)' }}>
                {isDanger ? '—' : `+${pricePct.toFixed(0)} %`}
              </span>
              <span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={tagStyle}>
                  {isSafe ? 'Sicher' : isWarn ? 'Kritisch' : 'Liquidation'}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Freedom-Rechner Mathematik (identisch mit /rechner/freedom) ───
function monthPrice(year: number, month: number, model: PriceModel, currency: Currency, livePrice: number | null, isFirst: boolean) {
  if (isFirst && livePrice) return livePrice
  return toLocalCurrency(modelPrice(new Date(year, month, 15), model), currency)
}

function simulateAccumulation(monthlyAmount: number, startBtc: number, months: number, model: PriceModel, currency: Currency, livePrice: number | null) {
  let btc = startBtc
  for (let i = 0; i < months; i++) {
    const y = NOW_Y + Math.floor((NOW_M + i) / 12)
    const m = (NOW_M + i) % 12
    btc += monthlyAmount / monthPrice(y, m, model, currency, livePrice, i === 0)
  }
  return btc
}

function simulateWithdrawal(startBtc: number, monthlyNet: number, taxRate: number, freedomYear: number, freedomMonth: number, withdrawalMonths: number, model: PriceModel, currency: Currency, inflation: boolean, inflationRate: number) {
  let btc = startBtc, net = monthlyNet
  for (let i = 0; i < withdrawalMonths; i++) {
    if (btc <= 0) return 0
    const y = freedomYear + Math.floor((freedomMonth + i) / 12)
    const m = (freedomMonth + i) % 12
    const price = toLocalCurrency(modelPrice(new Date(y, m, 15), model), currency)
    const brutto = taxRate > 0 ? net / (1 - taxRate / 100) : net
    btc -= Math.min(brutto / price, btc)
    if ((freedomMonth + i) % 12 === 11 && inflation) net *= (1 + inflationRate / 100)
  }
  return btc
}

function findRequiredMonthly(targetBtc: number, startBtc: number, months: number, model: PriceModel, currency: Currency, livePrice: number | null) {
  if (simulateAccumulation(0, startBtc, months, model, currency, livePrice) >= targetBtc) return 0
  let lo = 0, hi = targetBtc * 5000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (simulateAccumulation(mid, startBtc, months, model, currency, livePrice) < targetBtc) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

function findRequiredBtc(monthlyNet: number, taxRate: number, freedomYear: number, freedomMonth: number, withdrawalMonths: number, buffer: number, model: PriceModel, currency: Currency, inflation: boolean, inflationRate: number) {
  let lo = 0, hi = 500
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (simulateWithdrawal(mid, monthlyNet, taxRate, freedomYear, freedomMonth, withdrawalMonths, model, currency, inflation, inflationRate) > 0) hi = mid
    else lo = mid
  }
  return hi * buffer
}

// ── Chart ─────────────────────────────────────────────────────────
interface ChartPoint {
  year: number; month: number
  btcPrice: number
  portfolioBase: number      // ohne Kredit
  portfolioLoan: number      // mit Kredit (Stack bleibt, Wert steigt)
  phase: 'accumulation' | 'withdrawal' | 'loan'
}

function buildDualChartData(
  monthlyAmountBase: number, monthlyAmountLoan: number,
  startBtc: number, accMonths: number, withdrawMonths: number,
  taxRate: number, netMonthly: number,
  model: PriceModel, currency: Currency, livePrice: number | null,
  inflation: boolean, inflationRate: number,
  withLoan: boolean, btcAtFreedomLoan: number
): ChartPoint[] {
  const pts: ChartPoint[] = []
  let btcBase = startBtc, btcLoan = startBtc
  let net = netMonthly

  // Aufbau
  for (let i = 0; i <= accMonths; i++) {
    const y = NOW_Y + Math.floor((NOW_M + i) / 12)
    const m = (NOW_M + i) % 12
    const price = monthPrice(y, m, model, currency, livePrice, i === 0)
    if (i > 0) {
      btcBase += monthlyAmountBase / price
      btcLoan += monthlyAmountLoan / price
    }
    pts.push({ year: y, month: m, btcPrice: price, portfolioBase: btcBase * price, portfolioLoan: btcLoan * price, phase: 'accumulation' })
  }

  // Entnahme/Kredit-Phase
  const freedomY = pts[pts.length - 1].year
  const freedomM = pts[pts.length - 1].month
  const finalBtcLoan = withLoan ? btcAtFreedomLoan : btcLoan

  for (let i = 1; i <= withdrawMonths; i++) {
    const y = freedomY + Math.floor((freedomM + i) / 12)
    const m = (freedomM + i) % 12
    const price = toLocalCurrency(modelPrice(new Date(y, m, 15), model), currency)

    // Basis: Verkauf (Stack sinkt)
    if (btcBase > 0) {
      const brutto = taxRate > 0 ? net / (1 - taxRate / 100) : net
      btcBase -= Math.min(brutto / price, btcBase)
    }

    // Mit Kredit: Stack bleibt (kein Verkauf)
    pts.push({
      year: y, month: m, btcPrice: price,
      portfolioBase: Math.max(0, btcBase * price),
      portfolioLoan: withLoan ? finalBtcLoan * price : Math.max(0, btcBase * price),
      phase: withLoan ? 'loan' : 'withdrawal',
    })
    if ((freedomM + i) % 12 === 11 && inflation) net *= (1 + inflationRate / 100)
  }
  return pts
}

function FreedomBoostChart({ pts, freedomIdx, currency, withLoan }: { pts: ChartPoint[]; freedomIdx: number; currency: Currency; withLoan: boolean }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 640, H = 280, PAD = { top: 24, right: 20, bottom: 36, left: 72 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...pts.map(p => Math.max(p.portfolioBase, p.portfolioLoan)), 1)
  const scaleX = (i: number) => PAD.left + (i / Math.max(pts.length - 1, 1)) * innerW
  const scaleY = (v: number) => PAD.top + innerH - Math.min((v / maxVal) * innerH, innerH)

  const accPts  = pts.slice(0, freedomIdx + 1)
  const postPts = pts.slice(freedomIdx)

  const baseAcc   = accPts.map((p, i) => `${scaleX(i)},${scaleY(p.portfolioBase)}`).join(' ')
  const basePost  = postPts.map((p, i) => `${scaleX(i + freedomIdx)},${scaleY(p.portfolioBase)}`).join(' ')
  const loanPost  = postPts.map((p, i) => `${scaleX(i + freedomIdx)},${scaleY(p.portfolioLoan)}`).join(' ')

  const areaAcc   = `${PAD.left},${PAD.top + innerH} ${baseAcc} ${scaleX(freedomIdx)},${PAD.top + innerH}`
  const areaBase  = `${scaleX(freedomIdx)},${PAD.top + innerH} ${basePost} ${scaleX(pts.length-1)},${PAD.top + innerH}`
  const areaLoan  = `${scaleX(freedomIdx)},${PAD.top + innerH} ${loanPost} ${scaleX(pts.length-1)},${PAD.top + innerH}`

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: f * maxVal, y: scaleY(f * maxVal) }))
  const freedomX = scaleX(freedomIdx)

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) * (W / rect.width) - PAD.left
    setHoverIdx(Math.max(0, Math.min(pts.length - 1, Math.round((x / innerW) * (pts.length - 1)))))
  }, [pts.length, innerW])

  const hov = hoverIdx !== null ? pts[hoverIdx] : null

  return (
    <div>
      <div className="flex gap-5 mb-3 text-xs flex-wrap" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-2 rounded" style={{ background: '#22c55e' }} />Aufbau (Sparplan)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-2 rounded" style={{ background: '#60a5fa', opacity: 0.7 }} />Ohne Kredit (Verkauf)</span>
        {withLoan && <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-2 rounded" style={{ background: '#22c55e', opacity: 0.5 }} />Mit Kredit (Stack bleibt)</span>}
        <span className="flex items-center gap-1.5"><svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#f59e0b" strokeWidth="2"/></svg>Freedom-Zeitpunkt</span>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%"
        style={{ cursor: 'crosshair', overflow: 'visible' }}
        onMouseMove={onMouseMove} onMouseLeave={() => setHoverIdx(null)}>

        {yTicks.map(({ v, y }) => (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--border)" strokeWidth={0.5} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-tertiary)">{fmtK(v, CURRENCY_SYMBOL[currency])}</text>
          </g>
        ))}

        {(() => {
          const totalYears = pts.length / 12
          const step = totalYears > 30 ? 10 : totalYears > 15 ? 5 : 2
          return pts
            .filter(p => p.month === 0 && p.year % step === 0)
            .map(p => {
              const i = pts.indexOf(p)
              return <text key={p.year} x={scaleX(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">{p.year}</text>
            })
        })()}

        {/* Aufbau */}
        {baseAcc && <polygon points={areaAcc} fill="#22c55e" fillOpacity={0.15} />}
        {baseAcc && <polyline points={baseAcc} fill="none" stroke="#22c55e" strokeWidth={2} />}

        {/* Ohne Kredit: Entnahme */}
        {basePost && <polygon points={areaBase} fill="#60a5fa" fillOpacity={0.1} />}
        {basePost && <polyline points={basePost} fill="none" stroke="#60a5fa" strokeWidth={2} />}

        {/* Mit Kredit: Stack bleibt */}
        {withLoan && loanPost && <polygon points={areaLoan} fill="#22c55e" fillOpacity={0.08} />}
        {withLoan && loanPost && <polyline points={loanPost} fill="none" stroke="#22c55e" strokeWidth={2} strokeDasharray="6 3" />}

        {/* Freedom-Linie */}
        <line x1={freedomX} y1={PAD.top} x2={freedomX} y2={PAD.top + innerH} stroke="#f59e0b" strokeWidth={1.5} />
        <rect x={freedomX - 26} y={PAD.top - 1} width={52} height={13} rx={3} fill="#f59e0b" fillOpacity={0.15} />
        <text x={freedomX} y={PAD.top + 9} textAnchor="middle" fontSize={8} fill="#f59e0b" fontWeight={600}>Freedom</text>

        {hoverIdx !== null && (
          <line x1={scaleX(hoverIdx)} y1={PAD.top} x2={scaleX(hoverIdx)} y2={PAD.top + innerH}
            stroke="var(--text-tertiary)" strokeWidth={1} strokeDasharray="3 2" />
        )}
      </svg>

      {hov && (
        <div className="mt-3 rounded-xl border p-3 text-xs" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{MONTH_NAMES[hov.month]} {hov.year}</p>
          <div className="flex gap-6">
            <div>
              <p style={{ color: 'var(--text-tertiary)' }}>Ohne Kredit</p>
              <p className="font-medium" style={{ color: '#60a5fa' }}>{fmtC(hov.portfolioBase, currency)}</p>
            </div>
            {withLoan && (
              <div>
                <p style={{ color: 'var(--text-tertiary)' }}>Mit Kredit</p>
                <p className="font-medium" style={{ color: '#22c55e' }}>{fmtC(hov.portfolioLoan, currency)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Jahrestabelle ─────────────────────────────────────────────────
interface YearRow {
  year: number
  btcPrice: number
  btcBase: number
  portfolioBase: number
  phase: string
  actionBase: number
  btcLoan?: number
  portfolioLoan?: number
  schulden?: number
  ltv?: number
}

// ── Rollover-Risiko ───────────────────────────────────────────────

function cyclePhase(year: number): { label: string; color: string; bg: string } {
  const phases = [
    { label: 'Bull',       color: '#22c55e', bg: 'rgba(34,197,94,0.13)' },
    { label: 'Peak',       color: '#f59e0b', bg: 'rgba(245,158,11,0.13)' },
    { label: 'Correction', color: '#ef4444', bg: 'rgba(239,68,68,0.13)' },
    { label: 'Recovery',   color: '#60a5fa', bg: 'rgba(96,165,250,0.13)' },
  ]
  return phases[((year - 2024) % 4 + 4) % 4]
}

interface RolloverEvent {
  index: number
  year: number
  month: number
  debtAtMaturity: number      // Schulden bei Fälligkeit
  newLoanAmount: number       // neuer Kredit: Schulden + nächste Periode Einkommen
  minBtcPrice: number         // Mindestpreis für Rollover (newLoan / btcAmount / ltv)
  projectedPrice: number      // Power Law Preis an diesem Datum
  lowerBandPrice: number      // Power Law Unteres Band
  safetyBuffer: number        // wie weit BTC fallen darf (%) ohne Rollover zu gefährden
  lowerBandBuffer: number     // Puffer gegenüber unterem Band
  phase: ReturnType<typeof cyclePhase>
  risk: 'low' | 'medium' | 'high'
  projectedMultiple: number   // Live-Preis ÷ proj. Median zum Fälligkeitszeitpunkt
}

function computeRolloverRisk(
  freedomYear: number, freedomMonth: number,
  btcAtFreedom: number,
  netMonthly: number, termMonths: number,
  annualRate: number, ltv: number, capitalized: boolean,
  model: PriceModel, currency: Currency,
  years: number
): RolloverEvent[] {
  const events: RolloverEvent[] = []
  let debt = 0
  const periodsPerYear = 12 / termMonths
  const totalPeriods = Math.floor(years * periodsPerYear)

  for (let i = 0; i < totalPeriods; i++) {
    const monthOffset = (i + 1) * termMonths
    const absMonth = freedomMonth + monthOffset
    const year  = freedomYear + Math.floor(absMonth / 12)
    const month = absMonth % 12
    const date  = new Date(year, month, 1)

    // Schulden bei Fälligkeit (laufendes Modell)
    const incomeThisPeriod = netMonthly * termMonths
    const kredit = debt + incomeThisPeriod
    const zinsen = kredit * annualRate * (termMonths / 12)
    debt = capitalized ? kredit + zinsen : kredit

    // Neuer Kredit = aktuelle Schulden + nächste Periode Einkommen
    const nextIncome = netMonthly * termMonths
    const newLoanAmount = debt + nextIncome

    // Mindestpreis: newLoan muss durch ltv × btcAmount gedeckt sein
    const minBtcPrice = btcAtFreedom > 0 ? newLoanAmount / (btcAtFreedom * ltv) : 0

    const projectedPrice = toLocalCurrency(modelPrice(date, model), currency)
    const lowerBandPrice = toLocalCurrency(modelPrice(date, 'lower_band'), currency)

    const safetyBuffer    = projectedPrice > 0 ? ((projectedPrice - minBtcPrice) / projectedPrice) * 100 : 0
    const lowerBandBuffer = lowerBandPrice > 0 ? ((lowerBandPrice - minBtcPrice) / lowerBandPrice) * 100 : 0

    const risk: RolloverEvent['risk'] =
      safetyBuffer > 50 ? 'low' :
      safetyBuffer > 20 ? 'medium' : 'high'

    // Projiziertes Multiple: wie weit steht der proj. Preis über dem Median?
    // (zeigt ob der Rollover in eine Hochphase oder Tiefphase fällt)
    const medianAtDate = toLocalCurrency(modelPrice(date, 'power_law'), currency)
    const projectedMultiple = medianAtDate > 0 ? projectedPrice / medianAtDate : 1

    events.push({
      index: i + 1, year, month,
      debtAtMaturity: debt,
      newLoanAmount,
      minBtcPrice,
      projectedPrice,
      lowerBandPrice,
      safetyBuffer,
      lowerBandBuffer,
      phase: cyclePhase(year),
      risk,
      projectedMultiple,
    })
  }
  return events
}

function RolloverRiskTable({ events, currency, termMonths }: {
  events: RolloverEvent[]
  currency: Currency
  termMonths: number
}) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? events : events.slice(0, 8)
  const highRisk = events.filter(e => e.risk === 'high').length
  const medRisk  = events.filter(e => e.risk === 'medium').length

  const riskColor = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }
  const riskLabel = { low: 'Sicher', medium: 'Erhöht', high: 'Kritisch' }
  const riskBg    = { low: 'rgba(34,197,94,0.1)', medium: 'rgba(245,158,11,0.1)', high: 'rgba(239,68,68,0.1)' }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between"
        style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Rollover-Risiko
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Alle {termMonths} Monate muss der Kredit verlängert werden. Kann BTC den Mindestpreis halten?
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {highRisk > 0 && (
            <span className="px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#A32D2D' }}>
              {highRisk}× kritisch
            </span>
          )}
          {medRisk > 0 && (
            <span className="px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#854F0B' }}>
              {medRisk}× erhöht
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
              {['Fälligkeit', 'Zyklus', 'Schulden', 'Neuer Kredit', 'Mindestpreis BTC', 'Proj. Preis', 'Puffer', 'Risiko', 'Preis-Risiko'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap"
                  style={{ color: 'var(--text-tertiary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((e, i) => (
              <tr key={e.index} style={{
                borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                background: e.risk === 'high' ? 'rgba(239,68,68,0.03)' : 'var(--surface)',
              }}>
                <td className="px-3 py-2 whitespace-nowrap font-medium" style={{ color: 'var(--text-primary)' }}>
                  {MONTH_NAMES[e.month]} {e.year}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: e.phase.bg, color: e.phase.color, fontSize: 10, fontWeight: 500 }}>
                    {e.phase.label}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#ef4444' }}>
                  {fmtC(e.debtAtMaturity, currency)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                  {fmtC(e.newLoanAmount, currency)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap font-medium" style={{ color: '#f59e0b' }}>
                  {fmtC(e.minBtcPrice, currency)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                  {fmtC(e.projectedPrice, currency)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap font-medium"
                  style={{ color: riskColor[e.risk] }}>
                  {e.safetyBuffer > 0 ? e.safetyBuffer.toFixed(0) + '%' : '—'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: riskBg[e.risk], color: riskColor[e.risk] }}>
                    {riskLabel[e.risk]}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {(() => {
                    const m = e.projectedMultiple
                    const zone = getPowerLawZone(m)
                    const style =
                      zone === 'undervalued' || zone === 'fair'
                        ? { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' }
                        : zone === 'elevated'
                        ? { background: 'rgba(245,158,11,0.10)', color: '#854F0B' }
                        : { background: '#e8e5e0', color: '#444' }
                    const label =
                      zone === 'undervalued' ? 'Unterbewertet' :
                      zone === 'fair'        ? 'Fair Value'    :
                      zone === 'elevated'    ? `${m.toFixed(1)}× (Erhöht)` :
                                               `${m.toFixed(1)}× (Extrem)`
                    return (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={style}>
                        {label}
                      </span>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.length > 8 && (
        <div className="px-4 py-2 border-t text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}>
          <button onClick={() => setExpanded(v => !v)}
            className="text-xs" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            {expanded ? '↑ Weniger anzeigen' : `↓ Alle ${events.length} Rollover anzeigen`}
          </button>
        </div>
      )}

      <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Mindestpreis</strong> = neuer Kredit ÷ (BTC-Stack × LTV) — der BTC-Preis muss mindestens diesen Wert haben damit der Rollover klappt.{' '}
        <strong style={{ color: 'var(--text-secondary)' }}>Puffer</strong> = wie weit BTC unter den projizierten Preis fallen darf.{' '}
        Correction-Jahre sind besonders kritisch.
      </div>
    </div>
  )
}

function buildYearTable(pts: ChartPoint[], freedomIdx: number, withLoan: boolean, btcAtFreedomLoan: number, netMonthly: number, taxRate: number, rate: number, ltv: number): YearRow[] {
  const map = new Map<number, YearRow>()
  let btcBase = 0, btcLoan = btcAtFreedomLoan
  let schulden = 0

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const isAccumulation = i <= freedomIdx
    const existing = map.get(p.year)
    const portfolioBase = p.portfolioBase
    const portfolioLoan = withLoan ? p.portfolioLoan : p.portfolioBase

    // Schuldenentwicklung (vereinfacht jährlich)
    if (!isAccumulation && withLoan && p.month === 0) {
      const brutto = taxRate > 0 ? netMonthly / (1 - taxRate / 100) : netMonthly
      schulden = schulden + brutto * 12
      schulden *= (1 + rate)
    }

    map.set(p.year, {
      year: p.year,
      btcPrice: p.btcPrice,
      btcBase: portfolioBase / p.btcPrice,
      portfolioBase,
      phase: isAccumulation ? 'Aufbau' : 'Entnahme',
      actionBase: (existing?.actionBase ?? 0),
      btcLoan: withLoan ? portfolioLoan / p.btcPrice : undefined,
      portfolioLoan: withLoan ? portfolioLoan : undefined,
      schulden: withLoan && !isAccumulation ? schulden : undefined,
      ltv: withLoan && !isAccumulation && p.btcPrice > 0 ? (schulden / portfolioLoan) * 100 : undefined,
    })
  }
  return Array.from(map.values())
}

// ── Hauptkomponente ───────────────────────────────────────────────
export default function FreedomBoost() {
  // Basis-Eingaben (identisch mit Freedom-Rechner)
  const [currentAge, setCurrentAge]       = useState(40)
  const [freedomAge, setFreedomAge]       = useState(58)
  const [lifeExpectancy, setLifeExp]      = useState(85)
  const [currentBtc, setCurrentBtc]       = useState(0.05)
  const [netMonthly, setNetMonthly]       = useState(3000)
  const [taxRate, setTaxRate]             = useState(0)
  const [buffer, setBuffer]               = useState(1.2)
  const [model, setModel]                 = useState<PriceModel>('lower_band')
  const [currency, setCurrency]           = useState<Currency>('EUR')
  const [inflation, setInflation]         = useState(true)
  const [inflationRate, setInflationRate] = useState(4)

  // Aufbau-Boost Eingaben
  const [withBoost, setWithBoost]             = useState(false)
  const [boostLtv, setBoostLtv]               = useState(0.40)
  const [boostCustomRate, setBoostCustomRate] = useState(false)
  const [boostManualRate, setBoostManualRate] = useState(7)

  // Entnahme-Boost Eingaben
  const [withLoan, setWithLoan]           = useState(false)
  const [ltv, setLtv]                     = useState(0.50)
  const [termMonths, setTermMonths]       = useState<LoanTermMonths>(12)
  const [customRate, setCustomRate]       = useState(false)
  const [manualRate, setManualRate]       = useState(7)
  const [capitalized, setCapitalized]     = useState(true)

  const { price: livePrice, change24h } = useBtcPrice(currency)

  const accMonths      = (freedomAge - currentAge) * 12
  const withdrawMonths = (lifeExpectancy - freedomAge) * 12
  const freedomYear    = NOW_Y + Math.floor((NOW_M + accMonths) / 12)
  const freedomMonth   = (NOW_M + accMonths) % 12

  const annualRate     = customRate ? manualRate / 100 : MARKET_RATES[termMonths]
  const btcPriceAtFreedom = toLocalCurrency(modelPrice(new Date(freedomYear, freedomMonth, 15), model), currency)

  // Power Law Position
  const plMultiple = livePrice ? powerLawMultiple(livePrice, currency) : 1
  const sym = CURRENCY_SYMBOL[currency]

  // ── Berechnung OHNE Kredit (Basis) ──
  const requiredBtcBase = useMemo(() => findRequiredBtc(
    netMonthly, taxRate, freedomYear, freedomMonth,
    withdrawMonths, buffer, model, currency, inflation, inflationRate
  ), [netMonthly, taxRate, freedomYear, freedomMonth, withdrawMonths, buffer, model, currency, inflation, inflationRate])

  const requiredMonthlyBase = useMemo(() => findRequiredMonthly(
    requiredBtcBase, currentBtc, accMonths, model, currency, livePrice
  ), [requiredBtcBase, currentBtc, accMonths, model, currency, livePrice])

  const btcAtFreedomBase = useMemo(() => simulateAccumulation(
    requiredMonthlyBase, currentBtc, accMonths, model, currency, livePrice
  ), [requiredMonthlyBase, currentBtc, accMonths, model, currency, livePrice])

  // ── Berechnung MIT Kredit ──
  const loanFreedom = useMemo(() => withLoan ? calcFreedomViaLoan({
    monthlyTargetEur: netMonthly,
    btcPriceAtFreedomEur: btcPriceAtFreedom,
    termMonths, annualRate, ltv, liquidationLtv: 0.80,
  }) : null, [withLoan, netMonthly, btcPriceAtFreedom, termMonths, annualRate, ltv])

  const requiredBtcLoan = loanFreedom?.requiredBtc ?? requiredBtcBase

  const requiredMonthlyLoan = useMemo(() => withLoan ? findRequiredMonthly(
    requiredBtcLoan, currentBtc, accMonths, model, currency, livePrice
  ) : requiredMonthlyBase, [withLoan, requiredBtcLoan, currentBtc, accMonths, model, currency, livePrice, requiredMonthlyBase])

  const btcAtFreedomLoan = useMemo(() => withLoan ? simulateAccumulation(
    requiredMonthlyLoan, currentBtc, accMonths, model, currency, livePrice
  ) : btcAtFreedomBase, [withLoan, requiredMonthlyLoan, currentBtc, accMonths, model, currency, livePrice, btcAtFreedomBase])

  const borrowLive = useMemo(() => withLoan ? calcBorrowLive({
    monthlyIncomeEur: netMonthly, termMonths, btcPriceEur: btcPriceAtFreedom,
    annualRate, ltv, liquidationLtv: 0.80,
  }) : null, [withLoan, netMonthly, termMonths, btcPriceAtFreedom, annualRate, ltv])

  // ── Aufbau-Boost ──
  const currentBtcPrice   = livePrice ?? toLocalCurrency(modelPrice(new Date(), model), currency)
  const boostAnnualRate   = boostCustomRate ? boostManualRate / 100 : 0.07
  const boostLoanAmount   = withBoost && currentBtcPrice > 0 ? currentBtc * currentBtcPrice * boostLtv : 0
  const boostExtraBtc     = currentBtcPrice > 0 ? boostLoanAmount / currentBtcPrice : 0
  const boostedStartBtc   = currentBtc + boostExtraBtc

  // Ziel: gleiche Ziel-BTC, aber höherer Startpunkt → weniger Sparrate nötig
  const boostTarget       = withLoan ? requiredBtcLoan : requiredBtcBase
  const effectiveStart    = withBoost ? boostedStartBtc : currentBtc

  const requiredMonthlyFinal = useMemo(() => findRequiredMonthly(
    boostTarget, effectiveStart, accMonths, model, currency, livePrice
  ), [boostTarget, effectiveStart, accMonths, model, currency, livePrice])

  // Boost-Schulden beim Freedom-Zeitpunkt (kapitalisiert, Option B)
  const boostDebtAtFreedom = withBoost
    ? boostLoanAmount * Math.pow(1 + boostAnnualRate, accMonths / 12)
    : 0

  // Liquidationspreis für Boost-Kredit (heute)
  const boostLiqPrice = currentBtc > 0
    ? boostLoanAmount / (currentBtc * 0.80)
    : 0

  // Gesamtersparnis vs. reiner Baseline
  const monthlySavedTotal = requiredMonthlyBase - requiredMonthlyFinal

  // ── Chart-Daten ──
  const chartPts = useMemo(() => buildDualChartData(
    requiredMonthlyBase, requiredMonthlyLoan,
    currentBtc, accMonths, withdrawMonths,
    taxRate, netMonthly, model, currency, livePrice,
    inflation, inflationRate, withLoan, btcAtFreedomLoan
  ), [requiredMonthlyBase, requiredMonthlyLoan, currentBtc, accMonths, withdrawMonths,
      taxRate, netMonthly, model, currency, livePrice, inflation, inflationRate, withLoan, btcAtFreedomLoan])

  const yearRows = useMemo(() => buildYearTable(
    chartPts, accMonths, withLoan, btcAtFreedomLoan, netMonthly, taxRate, annualRate, ltv
  ), [chartPts, accMonths, withLoan, btcAtFreedomLoan, netMonthly, taxRate, annualRate, ltv])

  const rolloverEvents = useMemo(() => withLoan ? computeRolloverRisk(
    freedomYear, freedomMonth,
    btcAtFreedomLoan,
    netMonthly, termMonths,
    annualRate, ltv, capitalized,
    model, currency,
    withdrawMonths / 12,
  ) : [], [withLoan, freedomYear, freedomMonth, btcAtFreedomLoan, netMonthly, termMonths, annualRate, ltv, capitalized, model, currency, withdrawMonths])

  // Einsparungen durch Kredit
  const btcSaved    = requiredBtcBase - requiredBtcLoan
  const monthlySaved = requiredMonthlyBase - requiredMonthlyLoan

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader />
      <main className="px-4 md:px-12 py-10 max-w-5xl mx-auto">

        <div className="mb-8">
          <Link href="/rechner" className="text-xs mb-3 block hover:underline" style={{ color: 'var(--text-tertiary)' }}>← Alle Rechner</Link>
          <h1 className="text-3xl font-bold mb-1" style={{ letterSpacing: '-0.03em' }}>Freedom-Rechner</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Wie viel Bitcoin musst du monatlich kaufen um finanziell frei zu werden?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* ── Linke Spalte: Eingaben ── */}
          <div className="space-y-4">

            {/* BTC-Preis Modul */}
            <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--cta-bg)', color: 'var(--cta-text)' }}>₿</div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Bitcoin · Live</span>
                </div>
                {change24h !== null && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: change24h >= 0 ? 'var(--green-bg)' : 'rgba(239,68,68,0.1)',
                      color: change24h >= 0 ? 'var(--green)' : '#ef4444',
                    }}>
                    {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}% 24h
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold" style={{ letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                {livePrice ? formatPrice(livePrice, currency) : <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>Verbinde…</span>}
              </p>
              {/* Währung */}
              <div className="flex gap-2 mt-3">
                {(['EUR','USD'] as Currency[]).map(c => (
                  <button key={c} onClick={() => setCurrency(c)}
                    className="px-3 py-1 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      background: currency === c ? 'var(--text-primary)' : 'transparent',
                      color: currency === c ? 'var(--bg)' : 'var(--text-secondary)',
                      borderColor: currency === c ? 'var(--text-primary)' : 'var(--border)',
                    }}>{c}</button>
                ))}
              </div>
            </div>

            {/* Preismodell */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Preismodell Power Law</span>
                <Tooltip text="Bestimmt wie sich der Bitcoin-Preis entwickelt. Power Law Median ist die mittlere Projektion. 4-Jahres-Zyklus berücksichtigt Halbierungs-Zyklen. Unteres Band ist die konservative Variante." />
              </div>
              <div className="space-y-1">
                {(Object.keys(MODEL_LABELS) as PriceModel[]).map(m => (
                  <button key={m} onClick={() => setModel(m)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm border transition-all"
                    style={{
                      background: model === m ? 'var(--surface-alt)' : 'transparent',
                      borderColor: model === m ? 'var(--border-strong)' : 'var(--border)',
                      color: 'var(--text-primary)', fontWeight: model === m ? 500 : 400,
                    }}>{MODEL_LABELS[m]}</button>
                ))}
              </div>
            </div>

            {/* Basis-Angaben */}
            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Deine Situation</p>

              {[
                {
                  label: 'Aktuelles Alter', value: currentAge, set: setCurrentAge, min: 18, max: 70, unit: 'Jahre',
                  tip: 'Dein Alter heute. Bestimmt wie lange du noch Zeit hast Bitcoin anzusparen.'
                },
                {
                  label: 'Ziel-Alter (Freedom)', value: freedomAge, set: setFreedomAge, min: currentAge + 1, max: 80, unit: 'Jahre',
                  tip: 'Ab diesem Alter willst du von Bitcoin leben — ohne mehr zu arbeiten. Je früher, desto mehr musst du monatlich sparen.'
                },
                {
                  label: 'Lebenserwartung', value: lifeExpectancy, set: setLifeExp, min: freedomAge + 5, max: 100, unit: 'Jahre',
                  tip: 'Wie lange soll dein Bitcoin reichen? Je länger, desto mehr brauchst du. Wähle lieber etwas großzügig.'
                },
              ].map(({ label, value, set, min, max, unit, tip }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                      <Tooltip text={tip} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{value} {unit}</span>
                  </div>
                  <input type="range" min={min} max={max} value={value}
                    onChange={e => set(Number(e.target.value))} className="w-full" />
                </div>
              ))}

              <div className="text-xs rounded-lg p-2" style={{ background: 'var(--bg)', color: 'var(--text-tertiary)' }}>
                {accMonths / 12} J. Sparphase · {withdrawMonths / 12} J. Freiheitsphase
              </div>
            </div>

            {/* Finanzen */}
            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Finanzen</p>

              <div>
                <FieldLabel tooltip="Wie viel Bitcoin hast du bereits? Diese werden sofort miteingerechnet — je mehr du schon hast, desto weniger musst du monatlich sparen.">
                  Vorhandene BTC
                </FieldLabel>
                <input type="number" value={currentBtc} min={0} step={0.01}
                  onChange={e => setCurrentBtc(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>

              <div>
                <FieldLabel tooltip={`Was möchtest du monatlich netto zum Leben haben? Das ist dein Ziel ab dem Freedom-Zeitpunkt. Aktuell wäre das ${fmtC(netMonthly * 12, currency)} pro Jahr.`}>
                  Monatseinkommen Ziel netto ({sym})
                </FieldLabel>
                <input type="number" value={netMonthly} min={500} step={500}
                  onChange={e => setNetMonthly(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>= {fmtC(netMonthly * 12, currency)} / Jahr</p>
              </div>

              <div>
                <FieldLabel tooltip="In Deutschland gilt: Bitcoin die länger als 1 Jahr gehalten wurden sind steuerfrei (§23 EStG). Wenn du vorher verkaufst, fallen Steuern an. Bei 0% gibst du an, dass du erst nach der Haltefrist verkaufst.">
                  Steuersatz bei Entnahme (%)
                </FieldLabel>
                <input type="number" value={taxRate} min={0} max={50} step={0.5}
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>DE §23 EStG: 0% nach {'>'} 1 Jahr Haltedauer</p>
              </div>
            </div>

            {/* Sicherheitspuffer */}
            <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Sicherheitspuffer</p>
                <Tooltip text="Wie viel mehr Bitcoin du über das rechnerische Minimum ansparen möchtest. 1,2× bedeutet 20% Reserve — für den Fall dass Bitcoin sich schlechter als das Modell entwickelt." />
              </div>
              {[
                { v: 1.0, label: '1,0×', desc: 'Kein Puffer' },
                { v: 1.2, label: '1,2×', desc: '20% Reserve' },
                { v: 1.5, label: '1,5×', desc: '50% Reserve' },
              ].map(({ v, label, desc }) => (
                <button key={v} onClick={() => setBuffer(v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-all"
                  style={{
                    background: buffer === v ? 'var(--surface-alt)' : 'transparent',
                    borderColor: buffer === v ? 'var(--border-strong)' : 'var(--border)',
                    color: 'var(--text-primary)',
                  }}>
                  <span className="font-medium">{label}</span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{desc}</span>
                </button>
              ))}
            </div>

            {/* Inflation */}
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={inflation} onChange={e => setInflation(e.target.checked)} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Inflationsanpassung</span>
                </label>
                <Tooltip text="Durch Inflation kaufst du in 20 Jahren mit 3.000 € weniger als heute. Wenn aktiviert, wird dein Ziel-Einkommen jährlich um die Inflationsrate erhöht — du brauchst dann mehr Bitcoin." />
              </div>
              {inflation && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>Inflationsrate (% p.a.)</span>
                    <span className="font-bold">{inflationRate}%</span>
                  </div>
                  <input type="range" min={0} max={10} step={0.5} value={inflationRate}
                    onChange={e => setInflationRate(Number(e.target.value))} className="w-full" />
                </div>
              )}
            </div>

            {/* Boost-Status im Sidebar */}
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border p-3 text-xs" style={{ borderColor: withBoost ? '#f59e0b' : 'var(--border)', background: withBoost ? 'rgba(245,158,11,0.05)' : 'var(--surface)' }}>
                <p className="font-medium mb-0.5" style={{ color: withBoost ? '#854F0B' : 'var(--text-tertiary)' }}>Aufbau-Boost</p>
                <p style={{ color: withBoost ? '#854F0B' : 'var(--text-tertiary)' }}>{withBoost ? `LTV ${(boostLtv*100).toFixed(0)}%` : 'Inaktiv'}</p>
              </div>
              <div className="flex-1 rounded-xl border p-3 text-xs" style={{ borderColor: withLoan ? '#1a1a1a' : 'var(--border)', background: withLoan ? 'var(--surface-alt)' : 'var(--surface)' }}>
                <p className="font-medium mb-0.5" style={{ color: withLoan ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>Entnahme-Boost</p>
                <p style={{ color: withLoan ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>{withLoan ? `✓ LTV ${(ltv*100).toFixed(0)}%` : 'Inaktiv'}</p>
              </div>
            </div>
          </div>

          {/* ── Rechte Spalte: Ergebnisse ── */}
          <div className="space-y-5">

            {/* Haupt-Antwort */}
            <div className="rounded-xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                {withBoost && withLoan ? 'Sparrate mit Aufbau-Boost + Kredit-Strategie'
                  : withBoost ? 'Sparrate mit Aufbau-Boost'
                  : withLoan ? 'Sparrate mit Kredit-Strategie'
                  : 'Benötigte monatliche Sparrate'}
              </p>
              <p className="text-4xl font-bold mb-1" style={{ color: '#22c55e', letterSpacing: '-0.04em' }}>
                {fmtC(requiredMonthlyFinal, currency)}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                um in {accMonths / 12} Jahren finanziell frei zu werden · Freedom-Zeitpunkt: {MONTH_NAMES[freedomMonth]} {freedomYear}
              </p>
              {(withBoost || withLoan) && monthlySavedTotal > 0 && (
                <p className="text-xs mt-2 font-medium" style={{ color: '#22c55e' }}>
                  ↓ {fmtC(monthlySavedTotal, currency)}/Monat weniger als ohne jeglichen Boost
                </p>
              )}
            </div>

            {/* Aufbau-Boost Banner */}
            {withBoost && (
              <div className="rounded-xl border p-4" style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,0.04)' }}>
                <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: '#854F0B' }}>Aufbau-Boost ⚡</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p style={{ color: '#854F0B' }}>Ohne Boost</p>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{fmtC(withLoan ? requiredMonthlyLoan : requiredMonthlyBase, currency)}/Mo.</p>
                  </div>
                  <div>
                    <p style={{ color: '#854F0B' }}>Mit Boost</p>
                    <p className="font-medium text-sm" style={{ color: '#22c55e' }}>{fmtC(requiredMonthlyFinal, currency)}/Mo.</p>
                  </div>
                  <div>
                    <p style={{ color: '#854F0B' }}>Ersparnis</p>
                    <p className="font-medium text-sm" style={{ color: '#22c55e' }}>−{fmtC((withLoan ? requiredMonthlyLoan : requiredMonthlyBase) - requiredMonthlyFinal, currency)}/Mo.</p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t text-xs flex justify-between" style={{ borderColor: 'rgba(245,158,11,0.25)' }}>
                  <span style={{ color: '#854F0B' }}>Boost-Schulden beim Freedom-Zeitpunkt (kapitalisiert)</span>
                  <span className="font-medium" style={{ color: '#ef4444' }}>{fmtC(boostDebtAtFreedom, currency)}</span>
                </div>
                <p className="text-xs mt-2" style={{ color: '#854F0B', opacity: 0.7 }}>
                  Rückzahlung: Boost-Kredit läuft bis Freedom-Zeitpunkt, wird dort mit dem Stack verrechnet (Option B).
                </p>
              </div>
            )}

            {/* Vergleichs-Cards */}
            {withLoan ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ohne Kredit */}
                <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="text-xs font-medium mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#60a5fa' }}>↓</span> Ohne Kredit — Stack schrumpft
                  </p>
                  {[
                    { l: 'BTC-Bedarf beim Freedom-Zeitpunkt', v: fmtBtc(requiredBtcBase) },
                    { l: 'Monatl. Sparrate', v: fmtC(requiredMonthlyBase, currency) },
                    { l: `Stack nach ${withdrawMonths / 12} J. Entnahme`, v: '→ 0 BTC' },
                    { l: 'Entnahmedauer', v: `${withdrawMonths / 12} Jahre` },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex justify-between text-xs py-1.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>{l}</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Mit Kredit */}
                <div className="rounded-xl border-2 border-[#22c55e] p-4" style={{ background: 'rgba(34,197,94,0.04)' }}>
                  <p className="text-xs font-medium mb-3 flex items-center gap-1.5" style={{ color: '#3B6D11' }}>
                    <span>↑</span> Mit Kredit — Stack bleibt intact
                  </p>
                  {(() => {
                    const collateralBtc = borrowLive ? borrowLive.totalCollateralBtc : 0
                    const freeBtc = btcAtFreedomLoan - collateralBtc
                    const collateralPct = btcAtFreedomLoan > 0 ? (collateralBtc / btcAtFreedomLoan * 100).toFixed(0) : '0'
                    return [
                      { l: 'Stack beim Freedom-Zeitpunkt', v: fmtBtc(requiredBtcLoan), highlight: true, note: 'Collateral + 20% Puffer' },
                      { l: 'Monatl. Sparrate', v: fmtC(requiredMonthlyLoan, currency), highlight: true },
                      { l: `↳ Als Sicherheit hinterlegt (${collateralPct}%)`, v: fmtBtc(collateralBtc), highlight: false, sub: true },
                      { l: `↳ Puffer / frei verfügbar (${(100 - Number(collateralPct))}%)`, v: fmtBtc(freeBtc > 0 ? freeBtc : 0), highlight: false, sub: true },
                      { l: 'Jährl. Zinskosten', v: fmtC((loanFreedom?.annualInterestEur ?? 0), currency), highlight: false },
                      { l: 'Liquidationspreis', v: fmtC(loanFreedom?.liquidationPriceEur ?? 0, currency), highlight: false },
                    ]
                  })().map(({ l, v, highlight, sub = false, note = '' }) => (
                    <div key={l} className="flex justify-between text-xs py-1.5 border-b last:border-b-0" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
                      <span style={{ opacity: sub ? 0.7 : 1, paddingLeft: sub ? 8 : 0 }}>
                        <span style={{ color: '#3B6D11' }}>{l}</span>
                        {note && <span style={{ color: '#3B6D11', opacity: 0.5, marginLeft: 4 }}>({note})</span>}
                      </span>
                      <span className="font-medium" style={{ color: highlight ? '#22c55e' : '#27500A' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Normales KPI-Grid ohne Kredit */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Freedom-Zeitpunkt', value: `${MONTH_NAMES[freedomMonth]} ${freedomYear}` },
                  { label: 'Bestand bei Freedom-Zeitpunkt', value: fmtBtc(btcAtFreedomBase) },
                  { label: 'Portfoliowert', value: fmtC(btcAtFreedomBase * btcPriceAtFreedom, currency) },
                  { label: 'Entnahmedauer', value: `${withdrawMonths / 12} Jahre` },
                  { label: 'Sicherheitspuffer', value: `${buffer}×` },
                  { label: 'Jährl. Einkommen', value: fmtC(netMonthly * 12, currency) },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{kpi.label}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Chart */}
            <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-bold mb-1">
                Sparphase → Freedom → {withLoan ? 'Kredit-Phase (Stack bleibt)' : 'Entnahmephase'}
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                {withLoan
                  ? 'Grün gestrichelt = dein Stack bleibt erhalten und wächst weiter (Power Law). Du verkaufst keinen einzigen Satoshi.'
                  : 'Grün = Stack wächst · Gold = Freedom-Zeitpunkt · Blau = Entnahme sinkt Stack auf 0'}
              </p>
              <FreedomBoostChart pts={chartPts} freedomIdx={accMonths} currency={currency} withLoan={withLoan} />
            </div>

            {/* ══ BOOST-OPTIONEN ══════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Aufbau-Boost */}
              <div className="rounded-xl border-2 p-5 transition-all"
                style={{ borderColor: withBoost ? '#f59e0b' : 'var(--border)', background: withBoost ? 'rgba(245,158,11,0.03)' : 'var(--surface)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      Aufbau-Boost
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Stack per Kredit sofort vergrößern</p>
                  </div>
                  <Tooltip text="Du leihst heute Geld gegen deinen BTC-Stack und kaufst damit sofort mehr Bitcoin. Sparphase startet mit größerem Stack → weniger Sparrate nötig." />
                </div>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setWithBoost(false)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
                    style={{ background: !withBoost ? 'var(--text-primary)' : 'transparent', color: !withBoost ? 'var(--bg)' : 'var(--text-secondary)', borderColor: !withBoost ? 'var(--text-primary)' : 'var(--border)' }}>
                    Kein Boost
                  </button>
                  <button onClick={() => setWithBoost(true)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
                    style={{ background: withBoost ? '#f59e0b' : 'transparent', color: withBoost ? '#fff' : 'var(--text-secondary)', borderColor: withBoost ? '#f59e0b' : 'var(--border)' }}>
                    Sofort-Boost
                  </button>
                </div>

                {withBoost ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: '#854F0B' }}>LTV — {(boostLtv*100).toFixed(0)}%</span>
                        <Tooltip text="Wie viel % deines BTC-Wertes du leihst. 40% von 0,1 BTC à 60k€ = 2.400€ → +0,04 BTC." />
                      </div>
                      <input type="range" min={10} max={60} step={1} value={Math.round(boostLtv*100)}
                        onChange={e => setBoostLtv(Number(e.target.value)/100)} className="w-full" />
                      <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}><span>10%</span><span>60%</span></div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={boostCustomRate} onChange={e => setBoostCustomRate(e.target.checked)} />
                      <span className="text-xs" style={{ color: '#854F0B' }}>Eigener Zinssatz (Standard 7% p.a.)</span>
                    </label>
                    {boostCustomRate && (
                      <input type="number" value={boostManualRate} min={1} max={25} step={0.5}
                        onChange={e => setBoostManualRate(Number(e.target.value))}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                        style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                    )}
                    <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'rgba(245,158,11,0.08)', border: '0.5px solid rgba(245,158,11,0.3)' }}>
                      {[
                        ['Boost-Kredit', fmtC(boostLoanAmount, currency)],
                        ['+ Zusätzliche BTC', '+' + fmtBtc(boostExtraBtc)],
                        ['= Neuer Startstack', fmtBtc(boostedStartBtc)],
                        ['Liquidationspreis heute', fmtC(boostLiqPrice, currency)],
                        ['Schulden beim Freedom-Zeitpunkt', fmtC(boostDebtAtFreedom, currency)],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between"><span style={{ color: '#854F0B' }}>{k}</span><span className="font-medium" style={{ color: '#1a1a1a' }}>{v}</span></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-center py-3" style={{ color: 'var(--text-tertiary)' }}>
                    Aktiviere den Boost um deinen Stack sofort zu vergrößern
                  </p>
                )}
              </div>

              {/* Entnahme-Boost */}
              <div className="rounded-xl border-2 p-5 transition-all"
                style={{ borderColor: withLoan ? '#1a1a1a' : 'var(--border)', background: 'var(--surface)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      Entnahme-Boost
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Im Ruhestand Kredit statt verkaufen</p>
                  </div>
                  <Tooltip text="Statt Bitcoin zu verkaufen leihst du Geld gegen deinen Stack. Stack bleibt erhalten und wächst weiter — du zahlst nur Zinsen." />
                </div>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setWithLoan(false)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
                    style={{ background: !withLoan ? 'var(--text-primary)' : 'transparent', color: !withLoan ? 'var(--bg)' : 'var(--text-secondary)', borderColor: !withLoan ? 'var(--text-primary)' : 'var(--border)' }}>
                    Ohne Kredit
                  </button>
                  <button onClick={() => setWithLoan(true)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
                    style={{ background: withLoan ? '#1a1a1a' : 'transparent', color: withLoan ? '#fff' : 'var(--text-secondary)', borderColor: withLoan ? '#1a1a1a' : 'var(--border)' }}>
                    Mit Kredit
                  </button>
                </div>

                {withLoan ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--text-secondary)' }}>LTV — {(ltv*100).toFixed(0)}%</span>
                        <Tooltip text="Bei 50% LTV und 1 BTC à 100k€ kannst du 50k€ leihen. Je niedriger, desto sicherer." />
                      </div>
                      <input type="range" min={10} max={60} step={1} value={Math.round(ltv*100)}
                        onChange={e => setLtv(Number(e.target.value)/100)} className="w-full" />
                      <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}><span>10%</span><span>60%</span></div>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Kreditlaufzeit</p>
                      <div className="grid grid-cols-5 gap-1">
                        {([3,6,12,18,24] as LoanTermMonths[]).map(t => (
                          <button key={t} onClick={() => setTermMonths(t)}
                            className="py-1.5 rounded text-xs font-medium border transition-all"
                            style={{ background: termMonths===t ? 'var(--text-primary)' : 'transparent', color: termMonths===t ? 'var(--bg)' : 'var(--text-secondary)', borderColor: termMonths===t ? 'var(--text-primary)' : 'var(--border)' }}>
                            {t}M
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-1">
                        <input type="checkbox" checked={customRate} onChange={e => setCustomRate(e.target.checked)} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Eigener Zinssatz (Markt: {(MARKET_RATES[termMonths]*100).toFixed(1)}%)
                        </span>
                      </label>
                      {customRate && (
                        <input type="number" value={manualRate} min={1} max={25} step={0.5}
                          onChange={e => setManualRate(Number(e.target.value))}
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { v: true,  l: 'Kapitalisiert', desc: 'Zinsen zur Schuld' },
                        { v: false, l: 'Jährl. zahlen', desc: 'Zinsen vom Einkommen' },
                      ].map(({ v, l, desc }) => (
                        <button key={String(v)} onClick={() => setCapitalized(v)}
                          className="rounded-lg border px-2 py-2 text-xs text-left transition-all"
                          style={{ background: capitalized===v ? 'var(--text-primary)' : 'var(--bg)', color: capitalized===v ? 'var(--bg)' : 'var(--text-secondary)', borderColor: capitalized===v ? 'var(--text-primary)' : 'var(--border)' }}>
                          <p className="font-medium">{l}</p>
                          <p style={{ fontSize: 10, opacity: 0.7 }}>{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-center py-3" style={{ color: 'var(--text-tertiary)' }}>
                    Aktiviere den Kredit um deinen Stack zu erhalten
                  </p>
                )}
              </div>
            </div>

            {/* Power Law Zone Gauge */}
            {livePrice && <PowerLawZoneGauge multiple={plMultiple} currency={currency} />}

            {/* Kredit-Vorteil Banner */}
            {withLoan && btcSaved > 0 && (
              <div className="rounded-xl border p-4"
                style={{ borderColor: '#22c55e', background: 'rgba(34,197,94,0.04)' }}>
                <p className="text-xs font-medium mb-2" style={{ color: '#3B6D11', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vorteil der Kredit-Strategie</p>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-0.5" style={{ color: '#1a1a1a' }}>
                      {fmtBtc(btcSaved)} weniger Bestand bei Freedom-Zeitpunkt nötig
                    </p>
                    <p className="text-xs" style={{ color: '#3B6D11' }}>
                      Ohne Kredit: {fmtBtc(requiredBtcBase)} · Mit Kredit: {fmtBtc(requiredBtcLoan)} — weil du deinen Stack nicht aufbrauchst, sondern nur beleihst.
                    </p>
                  </div>
                </div>
                {monthlySaved > 0 && (
                  <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
                    <p className="text-xs" style={{ color: '#3B6D11' }}>Dadurch sparst du monatlich weniger an</p>
                    <p className="text-sm font-bold" style={{ color: '#22c55e' }}>−{fmtC(monthlySaved, currency)}/Monat</p>
                  </div>
                )}
                {monthlySaved === 0 && currentBtc >= requiredBtcLoan && (
                  <p className="text-xs mt-2" style={{ color: '#3B6D11' }}>
                    Mit {fmtBtc(currentBtc)} hast du bereits genug für beide Strategien — kein weiterer Sparplan nötig.
                  </p>
                )}
              </div>
            )}

            {/* Liquidations-Hinweis */}
            {withLoan && loanFreedom && (
              <div className="rounded-xl border p-4"
                style={{
                  borderColor: loanFreedom.safetyBufferPercent > 40 ? 'var(--border)' : '#f59e0b',
                  background: loanFreedom.safetyBufferPercent > 40 ? 'var(--surface)' : 'rgba(245,158,11,0.05)',
                }}>
                <p className="text-xs font-medium mb-1 flex items-center gap-1.5" style={{ color: loanFreedom.safetyBufferPercent > 40 ? 'var(--text-secondary)' : '#854F0B' }}>
                  ⚠ Liquidationsrisiko
                  <Tooltip text="Fällt der Bitcoin-Preis unter den Liquidationspreis, fordert der Kreditgeber Nachschuss (mehr Sicherheiten) oder löst deine Bitcoin auf. Je niedriger dein LTV, desto mehr Puffer hast du." />
                </p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  BTC kann bis auf <strong>{fmtC(loanFreedom.liquidationPriceEur, currency)}</strong> fallen
                  ({loanFreedom.safetyBufferPercent.toFixed(0)}% Puffer) bevor Nachschusspflicht entsteht.
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  LTV {(ltv * 100).toFixed(0)}% · Liquidation bei 80% LTV · Firefish-Konditionen
                </p>
              </div>
            )}

            {/* Preis-Risiko-Banner */}
            {withLoan && livePrice && loanFreedom && (
              <PriceRiskBanner
                multiple={plMultiple}
                liqPrice={loanFreedom.liquidationPriceEur}
                currency={currency}
                ltv={ltv}
              />
            )}

            {/* Jahrestabelle */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-bold">Jahresübersicht</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                      {[
                        'Jahr', 'BTC-Kurs',
                        withLoan ? 'Stack (Kredit)' : 'BTC-Stack',
                        withLoan ? 'Portfolio (Kredit)' : 'Portfolio',
                        'Phase',
                        withLoan ? 'Schulden' : 'Kauf / Entnahme',
                      ].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {yearRows.map((row, i) => {
                      const isAcc = row.phase === 'Aufbau'
                      const isFreedomYear = row.year === freedomYear
                      return (
                        <tr key={row.year} style={{
                          borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                          background: isFreedomYear ? 'rgba(245,158,11,0.06)' : 'var(--surface)',
                        }}>
                          <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                            {row.year}
                            {isFreedomYear && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 10 }}>Freedom</span>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmtC(row.btcPrice, currency)}</td>
                          <td className="px-3 py-2 whitespace-nowrap font-medium" style={{ color: 'var(--text-primary)' }}>
                            {fmtBtc(withLoan ? (row.btcLoan ?? row.btcBase) : row.btcBase)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-bold" style={{ color: isAcc ? '#22c55e' : withLoan ? '#22c55e' : '#60a5fa' }}>
                            {fmtC(withLoan ? (row.portfolioLoan ?? row.portfolioBase) : row.portfolioBase, currency)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{
                              background: isAcc ? 'var(--green-bg)' : withLoan ? 'rgba(34,197,94,0.1)' : 'rgba(96,165,250,0.12)',
                              color: isAcc ? 'var(--green)' : withLoan ? '#22c55e' : '#60a5fa',
                            }}>{isAcc ? 'Aufbau' : withLoan ? 'Kredit' : 'Entnahme'}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap" style={{ color: row.schulden ? '#ef4444' : 'var(--text-secondary)' }}>
                            {withLoan && row.schulden
                              ? fmtC(row.schulden, currency)
                              : isAcc
                                ? '+' + fmtC((withLoan ? requiredMonthlyLoan : requiredMonthlyBase) * 12, currency)
                                : '−' + fmtC(netMonthly * 12, currency)
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {withLoan && rolloverEvents.length > 0 && (
              <RolloverRiskTable
                events={rolloverEvents}
                currency={currency}
                termMonths={termMonths}
              />
            )}

            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Alle Werte basieren auf dem Power Law Modell — Projektionen, keine Garantien.
              {withLoan && ' Zinssätze aus Firefish-Marktdaten (Juni 2026). Liquidationsszenarien vereinfacht.'}
              {' '}Keine Anlageberatung.
            </p>

            <BoersenCTA context="freedom" />
          </div>
        </div>
      </main>
    </div>
  )
}
