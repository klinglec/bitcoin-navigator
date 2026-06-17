'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { modelPrice, toLocalCurrency, PriceModel } from '@/lib/powerLaw'
import { useBtcPrice, formatPrice, Currency } from '@/lib/useBtcPrice'

const MODEL_LABELS: Record<PriceModel, string> = {
  power_law:  'Power Law Median',
  cycle_4yr:  '4-Jahres-Zyklus',
  lower_band: 'Unteres Band (konservativ)',
}
const CURRENCY_SYMBOL: Record<Currency, string> = { EUR: '€', USD: '$', CHF: 'CHF' }
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
function fmtK(v: number, currency: Currency) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.', ',') + ' Mio. ' + CURRENCY_SYMBOL[currency]
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k ' + CURRENCY_SYMBOL[currency]
  return v.toFixed(0) + ' ' + CURRENCY_SYMBOL[currency]
}

// ── Hilfsfunktionen ───────────────────────────────────────────
function monthPrice(year: number, month: number, model: PriceModel, currency: Currency, livePrice: number | null, isFirstMonth: boolean): number {
  if (isFirstMonth && livePrice) return livePrice
  return toLocalCurrency(modelPrice(new Date(year, month, 15), model), currency)
}

// Akkumuliert BTC über n Monate mit monatlichem Kaufbetrag
function simulateAccumulation(
  monthlyAmount: number, startBtc: number, months: number,
  model: PriceModel, currency: Currency, livePrice: number | null
): number {
  let btc = startBtc
  for (let i = 0; i < months; i++) {
    const y = NOW_Y + Math.floor((NOW_M + i) / 12)
    const m = (NOW_M + i) % 12
    const price = monthPrice(y, m, model, currency, livePrice, i === 0)
    btc += monthlyAmount / price
  }
  return btc
}

// Simuliert Entnahme ab freedomYear und gibt verbleibende BTC nach withdrawalMonths zurück
function simulateWithdrawal(
  startBtc: number, monthlyNet: number, taxRate: number,
  freedomYear: number, freedomMonth: number,
  withdrawalMonths: number, model: PriceModel, currency: Currency,
  inflation: boolean, inflationRate: number
): number {
  let btc = startBtc
  let net = monthlyNet
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

// Binärsuche: monatlicher Kaufbetrag für Zielbetrag in n Monaten
function findRequiredMonthly(
  targetBtc: number, startBtc: number, months: number,
  model: PriceModel, currency: Currency, livePrice: number | null
): number {
  if (simulateAccumulation(0, startBtc, months, model, currency, livePrice) >= targetBtc) return 0
  let lo = 0, hi = targetBtc * 5000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (simulateAccumulation(mid, startBtc, months, model, currency, livePrice) < targetBtc) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// Binärsuche: BTC-Bedarf bei Freedom um n Monate lang zu leben
function findRequiredBtc(
  monthlyNet: number, taxRate: number,
  freedomYear: number, freedomMonth: number,
  withdrawalMonths: number, buffer: number,
  model: PriceModel, currency: Currency,
  inflation: boolean, inflationRate: number
): number {
  let lo = 0, hi = 500
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (simulateWithdrawal(mid, monthlyNet, taxRate, freedomYear, freedomMonth, withdrawalMonths, model, currency, inflation, inflationRate) > 0) hi = mid
    else lo = mid
  }
  return hi * buffer
}

// ── Chart-Daten ───────────────────────────────────────────────
interface ChartPoint {
  year: number; month: number
  btcPrice: number; btc: number; portfolio: number
  phase: 'accumulation' | 'withdrawal'
  monthlyAction: number   // + bei Kauf, - bei Entnahme (Netto)
}

function buildChartData(
  monthlyAmount: number, startBtc: number,
  accMonths: number, withdrawMonths: number,
  taxRate: number, netMonthly: number,
  model: PriceModel, currency: Currency, livePrice: number | null,
  inflation: boolean, inflationRate: number
): ChartPoint[] {
  const pts: ChartPoint[] = []
  let btc = startBtc
  let net = netMonthly

  // Aufbauphase
  for (let i = 0; i <= accMonths; i++) {
    const y = NOW_Y + Math.floor((NOW_M + i) / 12)
    const m = (NOW_M + i) % 12
    const price = monthPrice(y, m, model, currency, livePrice, i === 0)
    if (i > 0) btc += monthlyAmount / price
    pts.push({ year: y, month: m, btcPrice: price, btc, portfolio: btc * price, phase: 'accumulation', monthlyAction: i > 0 ? monthlyAmount : 0 })
  }

  // Entnahmephase
  const freedomY = pts[pts.length - 1].year
  const freedomM = pts[pts.length - 1].month
  for (let i = 1; i <= withdrawMonths; i++) {
    const y = freedomY + Math.floor((freedomM + i) / 12)
    const m = (freedomM + i) % 12
    if (btc <= 0) { pts.push({ year: y, month: m, btcPrice: 0, btc: 0, portfolio: 0, phase: 'withdrawal', monthlyAction: 0 }); continue }
    const price = toLocalCurrency(modelPrice(new Date(y, m, 15), model), currency)
    const brutto = taxRate > 0 ? net / (1 - taxRate / 100) : net
    btc -= Math.min(brutto / price, btc)
    pts.push({ year: y, month: m, btcPrice: price, btc, portfolio: btc * price, phase: 'withdrawal', monthlyAction: -net })
    if ((freedomM + i) % 12 === 11 && inflation) net *= (1 + inflationRate / 100)
  }
  return pts
}

// Jahresaggregat aus monatlichen Punkten
interface YearSummary {
  year: number; btcPrice: number; btc: number; portfolio: number
  phase: string; yearlyAction: number
}

function aggregateToYears(pts: ChartPoint[]): YearSummary[] {
  const map = new Map<number, YearSummary>()
  for (const p of pts) {
    map.set(p.year, {
      year: p.year,
      btcPrice: p.btcPrice,
      btc: p.btc,
      portfolio: p.portfolio,
      phase: p.phase === 'accumulation' ? 'Aufbau' : 'Entnahme',
      yearlyAction: (map.get(p.year)?.yearlyAction ?? 0) + p.monthlyAction,
    })
  }
  return Array.from(map.values())
}

// ── SVG Chart ─────────────────────────────────────────────────
function FreedomChart({ pts, freedomIdx, currency }: { pts: ChartPoint[]; freedomIdx: number; currency: Currency }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 640, H = 280, PAD = { top: 24, right: 20, bottom: 36, left: 72 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...pts.map(p => p.portfolio), 1)
  const scaleX = (i: number) => PAD.left + (i / Math.max(pts.length - 1, 1)) * innerW
  const scaleY = (v: number) => PAD.top + innerH - Math.min((v / maxVal) * innerH, innerH)

  const ptAcc = pts.slice(0, freedomIdx + 1).map((p, i) => `${scaleX(i)},${scaleY(p.portfolio)}`).join(' ')
  const ptWith = pts.slice(freedomIdx).map((p, i) => `${scaleX(i + freedomIdx)},${scaleY(p.portfolio)}`).join(' ')

  const areaAcc  = `${PAD.left},${PAD.top + innerH} ${ptAcc} ${scaleX(freedomIdx)},${PAD.top + innerH}`
  const areaWith = freedomIdx < pts.length - 1
    ? `${scaleX(freedomIdx)},${PAD.top + innerH} ${ptWith} ${scaleX(pts.length - 1)},${PAD.top + innerH}` : ''

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
      <div className="flex gap-5 mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-2 rounded" style={{ background: '#22c55e' }} />Aufbauphase</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-2 rounded" style={{ background: '#60a5fa', opacity: 0.7 }} />Entnahmephase</span>
        <span className="flex items-center gap-1.5"><svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#f59e0b" strokeWidth="2"/></svg>Freedom-Punkt</span>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%"
        style={{ cursor: 'crosshair', overflow: 'visible' }}
        onMouseMove={onMouseMove} onMouseLeave={() => setHoverIdx(null)}>

        {yTicks.map(({ v, y }) => (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--border)" strokeWidth={0.5} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-tertiary)">{fmtK(v, currency)}</text>
          </g>
        ))}

        {pts.filter(p => p.month === 0 || p === pts[0]).map((p) => {
          const i = pts.indexOf(p)
          return <text key={`${p.year}-${p.month}`} x={scaleX(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">{p.year}</text>
        })}

        {/* Aufbau-Fläche */}
        {ptAcc && <polygon points={areaAcc} fill="#22c55e" fillOpacity={0.15} />}
        {ptAcc && <polyline points={ptAcc} fill="none" stroke="#22c55e" strokeWidth={2} />}

        {/* Entnahme-Fläche */}
        {areaWith && <polygon points={areaWith} fill="#60a5fa" fillOpacity={0.12} />}
        {ptWith && <polyline points={ptWith} fill="none" stroke="#60a5fa" strokeWidth={2} />}

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
          <div className="flex items-center gap-2 mb-2">
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{MONTH_NAMES[hov.month]} {hov.year}</p>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{
              background: hov.phase === 'accumulation' ? 'var(--green-bg)' : 'rgba(96,165,250,0.15)',
              color: hov.phase === 'accumulation' ? 'var(--green)' : '#60a5fa',
              fontSize: '10px',
            }}>
              {hov.phase === 'accumulation' ? 'Aufbau' : 'Entnahme'}
            </span>
          </div>
          <div className="flex justify-between gap-8" style={{ color: 'var(--text-secondary)' }}>
            <span>Portfoliowert</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{fmtC(hov.portfolio, currency)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────
export default function FreedomRechner() {
  const [currentAge, setCurrentAge]     = useState(35)
  const [freedomAge, setFreedomAge]     = useState(55)
  const [lifeExpectancy, setLifeExp]    = useState(85)
  const [currentBtc, setCurrentBtc]     = useState(0.1)
  const [netMonthly, setNetMonthly]     = useState(3000)
  const [taxRate, setTaxRate]           = useState(0)
  const [buffer, setBuffer]             = useState(1.2)
  const [model, setModel]               = useState<PriceModel>('power_law')
  const [currency, setCurrency]         = useState<Currency>('EUR')
  const [inflation, setInflation]       = useState(true)
  const [inflationRate, setInflationRate] = useState(3)

  const { price: livePrice } = useBtcPrice(currency)

  const accMonths      = (freedomAge - currentAge) * 12
  const withdrawMonths = (lifeExpectancy - freedomAge) * 12

  const freedomYear  = NOW_Y + Math.floor((NOW_M + accMonths) / 12)
  const freedomMonth = (NOW_M + accMonths) % 12

  // Benötigter BTC-Stack beim Freedom-Punkt
  const requiredBtc = useMemo(() => findRequiredBtc(
    netMonthly, taxRate, freedomYear, freedomMonth,
    withdrawMonths, buffer, model, currency, inflation, inflationRate
  ), [netMonthly, taxRate, freedomYear, freedomMonth, withdrawMonths, buffer, model, currency, inflation, inflationRate])

  // Benötigter monatlicher Kaufbetrag
  const requiredMonthly = useMemo(() => findRequiredMonthly(
    requiredBtc, currentBtc, accMonths, model, currency, livePrice
  ), [requiredBtc, currentBtc, accMonths, model, currency, livePrice])

  // BTC-Stack beim Freedom-Punkt (Simulation)
  const btcAtFreedom = useMemo(() => simulateAccumulation(
    requiredMonthly, currentBtc, accMonths, model, currency, livePrice
  ), [requiredMonthly, currentBtc, accMonths, model, currency, livePrice])

  const btcPriceAtFreedom = toLocalCurrency(modelPrice(new Date(freedomYear, freedomMonth, 15), model), currency)
  const portfolioAtFreedom = btcAtFreedom * btcPriceAtFreedom
  const annualIncome = netMonthly * 12

  // Chart- und Tabellen-Daten
  const chartPts = useMemo(() => buildChartData(
    requiredMonthly, currentBtc, accMonths, withdrawMonths,
    taxRate, netMonthly, model, currency, livePrice, inflation, inflationRate
  ), [requiredMonthly, currentBtc, accMonths, withdrawMonths, taxRate, netMonthly, model, currency, livePrice, inflation, inflationRate])

  const yearSummary = useMemo(() => aggregateToYears(chartPts), [chartPts])

  const sym = CURRENCY_SYMBOL[currency]

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader />
      <main className="px-4 md:px-12 py-10 max-w-5xl mx-auto">

        <div className="mb-8">
          <Link href="/rechner" className="text-xs mb-3 block hover:underline" style={{ color: 'var(--text-tertiary)' }}>← Alle Rechner</Link>
          <h1 className="text-3xl font-bold mb-1" style={{ letterSpacing: '-0.03em' }}>Freedom-Rechner</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Wie viel Bitcoin musst du monatlich kaufen um finanziell frei zu werden?
            {livePrice && <> · Aktuell: <strong>{formatPrice(livePrice, currency)}</strong></>}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* ── Inputs ── */}
          <div className="space-y-4">

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
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Preismodell Power Law</label>
              <div className="space-y-1">
                {(Object.keys(MODEL_LABELS) as PriceModel[]).map(m => (
                  <button key={m} onClick={() => setModel(m)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm border transition-all"
                    style={{
                      background: model === m ? 'var(--surface-alt)' : 'transparent',
                      borderColor: model === m ? 'var(--border-strong)' : 'var(--border)',
                      color: 'var(--text-primary)', fontWeight: model === m ? 500 : 400,
                    }}>
                    {MODEL_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* Person */}
            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Person</p>

              {[
                { label: 'Aktuelles Alter', value: currentAge, set: setCurrentAge, min: 18, max: 70 },
                { label: 'Ziel-Alter (Freedom)', value: freedomAge, set: setFreedomAge, min: currentAge + 1, max: 80 },
                { label: 'Lebenserwartung', value: lifeExpectancy, set: setLifeExp, min: freedomAge + 5, max: 100 },
              ].map(({ label, value, set, min, max }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{value} Jahre</span>
                  </div>
                  <input type="range" min={min} max={max} value={value}
                    onChange={e => set(Number(e.target.value))} className="w-full" />
                </div>
              ))}

              <div className="text-xs rounded-lg p-2" style={{ background: 'var(--bg)', color: 'var(--text-tertiary)' }}>
                {accMonths / 12} J. Aufbau · {withdrawMonths / 12} J. Entnahme
              </div>
            </div>

            {/* Finanzen */}
            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Finanzen</p>

              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Vorhandene BTC</label>
                <input type="number" value={currentBtc} min={0} step={0.01}
                  onChange={e => setCurrentBtc(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Gewünschtes Monatseinkommen netto ({sym})</label>
                <input type="number" value={netMonthly} min={500} step={500}
                  onChange={e => setNetMonthly(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>= {fmtC(annualIncome, currency)} / Jahr</p>
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Steuersatz bei Entnahme (%)</label>
                <input type="number" value={taxRate} min={0} max={50} step={0.5}
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>DE §23 EStG: 0% nach {'>'} 1 Jahr Haltedauer</p>
              </div>
            </div>

            {/* Sicherheitspuffer */}
            <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>Sicherheitspuffer</p>
              {[
                { v: 1.0, label: '1,0×', desc: 'Exakt ausreichend' },
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
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={inflation} onChange={e => setInflation(e.target.checked)} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Inflationsanpassung</span>
              </label>
              {inflation && (
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Inflationsrate (% p.a.)</label>
                  <input type="number" value={inflationRate} min={0} max={10} step={0.5}
                    onChange={e => setInflationRate(Number(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
              )}
            </div>
          </div>

          {/* ── Ergebnisse ── */}
          <div className="space-y-5">

            {/* Haupt-KPI */}
            <div className="rounded-xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Benötigter monatlicher Kaufbetrag</p>
              <p className="text-4xl font-bold mb-1" style={{ color: '#22c55e', letterSpacing: '-0.04em' }}>
                {fmtC(requiredMonthly, currency)}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                um in {accMonths / 12} Jahren finanziell frei zu werden
              </p>
            </div>

            {/* KPI-Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Freedom-Punkt', value: `${MONTH_NAMES[freedomMonth]} ${freedomYear}` },
                { label: 'BTC beim Freedom', value: fmtBtc(btcAtFreedom) },
                { label: 'Portfolio beim Freedom', value: fmtC(portfolioAtFreedom, currency) },
                { label: 'Entnahmedauer', value: `${withdrawMonths / 12} Jahre` },
                { label: 'Sicherheitspuffer', value: `${buffer}×` },
                { label: 'Jährliches Einkommen', value: fmtC(annualIncome, currency) },
              ].map(kpi => (
                <div key={kpi.label} className="rounded-xl border p-4"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{kpi.label}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Aufbauphase → Freedom → Entnahmephase
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Grün = Stack wächst durch monatliche Käufe · Gold = Freedom-Punkt · Blau = Entnahme bis Lebenserwartung
              </p>
              <FreedomChart pts={chartPts} freedomIdx={accMonths} currency={currency} />
            </div>

            {/* Jahrestabelle */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Jahresübersicht</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                      {['Jahr','BTC-Kurs','BTC-Stack','Portfolio','Phase','Kauf / Entnahme'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap"
                          style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {yearSummary.map((row, i) => {
                      const isAcc = row.phase === 'Aufbau'
                      const isFreedomYear = row.year === freedomYear
                      return (
                        <tr key={row.year} style={{
                          borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                          background: isFreedomYear ? 'rgba(245,158,11,0.06)' : 'var(--surface)',
                        }}>
                          <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                            {row.year}
                            {isFreedomYear && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '10px' }}>Freedom</span>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmtC(row.btcPrice, currency)}</td>
                          <td className="px-3 py-2 whitespace-nowrap font-medium" style={{ color: 'var(--text-primary)' }}>{fmtBtc(row.btc)}</td>
                          <td className="px-3 py-2 whitespace-nowrap font-bold" style={{ color: isAcc ? '#22c55e' : '#60a5fa' }}>{fmtC(row.portfolio, currency)}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{
                              background: isAcc ? 'var(--green-bg)' : 'rgba(96,165,250,0.12)',
                              color: isAcc ? 'var(--green)' : '#60a5fa',
                            }}>{row.phase}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap" style={{ color: row.yearlyAction >= 0 ? '#22c55e' : '#ef4444' }}>
                            {row.yearlyAction >= 0 ? '+' : ''}{fmtC(Math.abs(row.yearlyAction), currency)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Alle Werte basieren auf dem Power Law Modell und sind Projektionen, keine Garantien.
              Steuerliche Behandlung gemäß individuellem Szenario. Keine Anlageberatung.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
