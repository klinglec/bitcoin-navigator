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

function fmtC(v: number, currency: Currency) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
}
function fmtBtc(v: number) {
  if (v <= 0) return '0 BTC'
  if (v >= 0.01) return v.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 4 }) + ' BTC'
  return (v * 1e6).toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' Sats'
}
function fmtK(v: number, currency: Currency) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.', ',') + ' Mio. ' + CURRENCY_SYMBOL[currency]
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k ' + CURRENCY_SYMBOL[currency]
  return v.toFixed(0) + ' ' + CURRENCY_SYMBOL[currency]
}

// ── Steuer-Presets ────────────────────────────────────────────
const TAX_PRESETS = [
  { label: 'DE – steuerfrei (§23 EStG)', rate: 0, note: 'BTC > 1 Jahr gehalten → 0%' },
  { label: 'DE – kurzfristig (~26%)', rate: 26, note: 'BTC < 1 Jahr gehalten, Abgeltungssteuer' },
  { label: 'AT – KESt (27,5%)', rate: 27.5, note: 'Österreich Kapitalertragsteuer' },
  { label: 'CH – steuerfrei', rate: 0, note: 'Schweiz: private Kapitalgewinne steuerfrei' },
  { label: 'Individuell', rate: -1, note: '' },
]

const NOW_YEAR_E  = new Date().getFullYear()
const NOW_MONTH_E = new Date().getMonth()  // 0–11

// ── Berechnung (monatlich) ────────────────────────────────────
interface MonthlyEntnahmeRow {
  year: number; month: number
  btcPrice: number
  portfolio: number
  brutto: number; steuer: number; netto: number
  btcSold: number; remainingBtc: number
  cumulativeNetto: number
  isExhausted: boolean
  isCurrentMonth: boolean
}

interface EntnahmeRow {   // Jahres-Aggregat für Tabelle
  year: number; btcPrice: number; portfolio: number
  brutto: number; steuer: number; netto: number
  btcSold: number; remainingBtc: number
  cumulativeNetto: number; isExhausted: boolean
}

function calcEntnahmeMonthly(params: {
  btcStack: number; netTarget: number; taxRate: number
  model: PriceModel; currency: Currency; months: number
  inflation: boolean; inflationRate: number
  livePriceLocal: number | null   // IST-Preis aktueller Monat in Lokalwährung
}): MonthlyEntnahmeRow[] {
  const { btcStack, netTarget, taxRate, model, currency, months, inflation, inflationRate, livePriceLocal } = params
  const rows: MonthlyEntnahmeRow[] = []
  let remainingBtc  = btcStack
  let annualNet     = netTarget
  let monthlyNet    = annualNet / 12
  let cumulativeNetto = 0

  for (let i = 0; i < months; i++) {
    const month = (NOW_MONTH_E + i) % 12
    const year  = NOW_YEAR_E + Math.floor((NOW_MONTH_E + i) / 12)
    const isCurrentMonth = i === 0

    // Preis: IST für aktuellen Monat, sonst Modell
    let btcPrice: number
    if (isCurrentMonth && livePriceLocal) {
      btcPrice = livePriceLocal
    } else {
      btcPrice = toLocalCurrency(modelPrice(new Date(year, month, 15), model), currency)
    }

    const portfolio = remainingBtc * btcPrice

    if (remainingBtc <= 0) {
      rows.push({ year, month, btcPrice, portfolio: 0, brutto: 0, steuer: 0, netto: 0, btcSold: 0, remainingBtc: 0, cumulativeNetto, isExhausted: true, isCurrentMonth })
      continue
    }

    const nettoThisMonth = Math.min(monthlyNet, portfolio)
    const brutto = taxRate > 0 ? nettoThisMonth / (1 - taxRate / 100) : nettoThisMonth
    const steuer = brutto - nettoThisMonth
    const btcSold = Math.min(brutto / btcPrice, remainingBtc)

    remainingBtc    -= btcSold
    cumulativeNetto += nettoThisMonth

    rows.push({ year, month, btcPrice, portfolio, brutto, steuer, netto: nettoThisMonth, btcSold, remainingBtc, cumulativeNetto, isExhausted: remainingBtc <= 0, isCurrentMonth })

    // Inflation: Anpassung zum Jahresende
    if (month === 11 && inflation) {
      annualNet  *= (1 + inflationRate / 100)
      monthlyNet  = annualNet / 12
    }

    if (remainingBtc <= 0) break
  }
  return rows
}

function aggregateEntnahmeToYears(monthly: MonthlyEntnahmeRow[]): EntnahmeRow[] {
  const map = new Map<number, EntnahmeRow>()
  for (const m of monthly) {
    const prev = map.get(m.year)
    map.set(m.year, {
      year: m.year,
      btcPrice: m.btcPrice,             // letzter Monatspreis des Jahres
      portfolio: m.portfolio,           // letzter Wert
      brutto: (prev?.brutto ?? 0) + m.brutto,
      steuer: (prev?.steuer ?? 0) + m.steuer,
      netto:  (prev?.netto  ?? 0) + m.netto,
      btcSold: (prev?.btcSold ?? 0) + m.btcSold,
      remainingBtc: m.remainingBtc,
      cumulativeNetto: m.cumulativeNetto,
      isExhausted: m.isExhausted,
    })
  }
  return Array.from(map.values())
}

// ── SVG Chart (monatliche Datenpunkte) ───────────────────────
function EntnahmeChart({ rows, currency }: { rows: MonthlyEntnahmeRow[]; currency: Currency }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 640, H = 260, PAD = { top: 20, right: 20, bottom: 36, left: 72 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...rows.map(r => Math.max(r.portfolio, r.cumulativeNetto, 1)))
  const scaleX = (i: number) => PAD.left + (i / Math.max(rows.length - 1, 1)) * innerW
  const scaleY = (v: number) => PAD.top + innerH - Math.min((v / maxVal) * innerH, innerH)

  const ptPortfolio   = rows.map((r, i) => `${scaleX(i)},${scaleY(r.portfolio)}`).join(' ')
  const ptCumulative  = rows.map((r, i) => `${scaleX(i)},${scaleY(r.cumulativeNetto)}`).join(' ')
  const areaPortfolio = `${PAD.left},${PAD.top + innerH} ${ptPortfolio} ${scaleX(rows.length - 1)},${PAD.top + innerH}`
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: f * maxVal, y: scaleY(f * maxVal) }))

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) * (W / rect.width) - PAD.left
    setHoverIdx(Math.max(0, Math.min(rows.length - 1, Math.round((x / innerW) * (rows.length - 1)))))
  }, [rows.length, innerW])

  const hov = hoverIdx !== null ? rows[hoverIdx] : null

  return (
    <div>
      <div className="flex gap-5 mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-2 rounded" style={{ background: '#22c55e' }} />Verbleibender Stack</span>
        <span className="flex items-center gap-1.5"><svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#f59e0b" strokeWidth="1.5" /></svg>Kumulierte Netto-Entnahmen</span>
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
        {rows.filter(r => r.month === 0 || r === rows[0]).map((r) => {
          const i = rows.indexOf(r)
          return <text key={`${r.year}`} x={scaleX(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">{r.year}</text>
        })}
        <polygon points={areaPortfolio} fill="#22c55e" fillOpacity={0.15} />
        <polyline points={ptPortfolio} fill="none" stroke="#22c55e" strokeWidth={2} />
        <polyline points={ptCumulative} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
        {hoverIdx !== null && (
          <line x1={scaleX(hoverIdx)} y1={PAD.top} x2={scaleX(hoverIdx)} y2={PAD.top + innerH}
            stroke="var(--text-tertiary)" strokeWidth={1} strokeDasharray="3 2" />
        )}
      </svg>
      {hov && (
        <div className="mt-3 rounded-xl border p-3 text-xs" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][hov.month]} {hov.year}
            </p>
            {hov.isCurrentMonth && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--green-bg)', color: 'var(--green)', fontSize: '10px' }}>IST-Preis</span>}
          </div>
          <div className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between gap-8"><span style={{ color: '#22c55e' }}>Portfoliowert</span><span className="font-medium">{fmtC(hov.portfolio, currency)}</span></div>
            <div className="flex justify-between gap-8"><span>Verbleibende BTC</span><span>{fmtBtc(hov.remainingBtc)}</span></div>
            <div className="flex justify-between gap-8"><span>Netto-Entnahme</span><span>{fmtC(hov.netto, currency)}</span></div>
            {hov.steuer > 0 && <div className="flex justify-between gap-8"><span>Steuer</span><span>{fmtC(hov.steuer, currency)}</span></div>}
            <div className="flex justify-between gap-8 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: '#f59e0b' }}>Kumuliert ausgezahlt</span><span>{fmtC(hov.cumulativeNetto, currency)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Brutto vs. Netto Balken-Chart ────────────────────────────
function BruttoNettoChart({ rows, currency }: { rows: EntnahmeRow[]; currency: Currency }) {
  const W = 640, H = 180, PAD = { top: 10, right: 20, bottom: 36, left: 72 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const maxVal = Math.max(...rows.map(r => r.brutto), 1)
  const barW   = Math.max(2, innerW / rows.length - 2)
  const scaleX = (i: number) => PAD.left + (i / rows.length) * innerW + barW / 2
  const scaleH = (v: number) => Math.min((v / maxVal) * innerH, innerH)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {rows.map((r, i) => {
        const x = scaleX(i) - barW / 2
        const netH   = scaleH(r.netto)
        const taxH   = scaleH(r.steuer)
        return (
          <g key={r.year}>
            <rect x={x} y={PAD.top + innerH - netH - taxH} width={barW} height={taxH} fill="#ef4444" fillOpacity={0.7} />
            <rect x={x} y={PAD.top + innerH - netH} width={barW} height={netH} fill="#22c55e" fillOpacity={0.8} />
          </g>
        )
      })}
      {rows.filter((_, i) => i % Math.max(1, Math.floor(rows.length / 6)) === 0).map((r, _, arr) => {
        const i = rows.indexOf(r)
        return <text key={r.year} x={scaleX(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">{r.year}</text>
      })}
    </svg>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────
export default function EntnahmeRechner() {
  const [btcStack, setBtcStack]     = useState(1)
  const [netTarget, setNetTarget]   = useState(36000)
  const [taxPreset, setTaxPreset]   = useState(0)       // Index in TAX_PRESETS
  const [customTax, setCustomTax]   = useState(25)
  const [model, setModel]           = useState<PriceModel>('power_law')
  const [currency, setCurrency]     = useState<Currency>('EUR')
  const [years, setYears]           = useState(25)
  const [inflation, setInflation]   = useState(false)
  const [inflationRate, setInflationRate] = useState(3)
  const { price: livePrice } = useBtcPrice(currency)
  const taxRate = TAX_PRESETS[taxPreset].rate === -1 ? customTax : TAX_PRESETS[taxPreset].rate

  const monthlyRows = useMemo(() => calcEntnahmeMonthly({
    btcStack, netTarget, taxRate, model, currency,
    months: years * 12,
    inflation, inflationRate,
    livePriceLocal: livePrice,
  }), [btcStack, netTarget, taxRate, model, currency, years, inflation, inflationRate, livePrice])

  const rows = useMemo(() => aggregateEntnahmeToYears(monthlyRows), [monthlyRows])

  const lastRow      = rows[rows.length - 1]
  const exhaustedRow = monthlyRows.find(r => r.isExhausted)
  const totalNetto   = lastRow?.cumulativeNetto ?? 0
  const totalSteuer  = rows.reduce((s, r) => s + r.steuer, 0)
  const remainingBtc = lastRow?.remainingBtc ?? 0
  const reichtBis    = exhaustedRow
    ? `${['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][exhaustedRow.month]} ${exhaustedRow.year}`
    : `>${NOW_YEAR_E + years - 1}`

  const sym = CURRENCY_SYMBOL[currency]

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader />
      <main className="px-4 md:px-12 py-10 max-w-5xl mx-auto">

        <div className="mb-8">
          <Link href="/rechner" className="text-xs mb-3 block hover:underline" style={{ color: 'var(--text-tertiary)' }}>← Alle Rechner</Link>
          <h1 className="text-3xl font-bold mb-1" style={{ letterSpacing: '-0.03em' }}>Entnahmeplan</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Wieviel Bitcoin musst du jährlich verkaufen um deinen Lebensunterhalt zu finanzieren?
            {livePrice && <> · Aktuell: <strong>{formatPrice(livePrice, currency)}</strong></>}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

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
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Preismodell</label>
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

            {/* BTC & Entnahme */}
            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Bitcoin & Entnahme</p>

              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Bitcoin-Bestand (BTC)</label>
                <input type="number" value={btcStack} min={0.001} step={0.1}
                  onChange={e => setBtcStack(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                {livePrice && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    ≈ {fmtC(btcStack * livePrice, currency)} heute
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Jahresbedarf netto ({sym})</label>
                <input type="number" value={netTarget} min={1000} step={1000}
                  onChange={e => setNetTarget(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  ≈ {fmtC(netTarget / 12, currency)} / Monat
                </p>
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Betrachtungszeitraum</label>
                <input type="range" min={5} max={40} value={years}
                  onChange={e => setYears(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  <span>5 J.</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{years} Jahre</span>
                  <span>40 J.</span>
                </div>
              </div>
            </div>

            {/* Steuer */}
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Besteuerung</p>
              <div className="space-y-1">
                {TAX_PRESETS.map((preset, i) => (
                  <button key={i} onClick={() => setTaxPreset(i)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs border transition-all"
                    style={{
                      background: taxPreset === i ? 'var(--surface-alt)' : 'transparent',
                      borderColor: taxPreset === i ? 'var(--border-strong)' : 'var(--border)',
                      color: 'var(--text-primary)',
                    }}>
                    <span className="font-medium">{preset.label}</span>
                    {preset.note && <span className="block text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{preset.note}</span>}
                  </button>
                ))}
              </div>
              {TAX_PRESETS[taxPreset].rate === -1 && (
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Individueller Steuersatz (%)</label>
                  <input type="number" value={customTax} min={0} max={50} step={0.5}
                    onChange={e => setCustomTax(Number(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
              )}
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
                  <input type="number" value={inflationRate} min={0} max={15} step={0.5}
                    onChange={e => setInflationRate(Number(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Jahresbedarf steigt jährlich um diesen Betrag.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Ergebnisse ── */}
          <div className="space-y-5">

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Reicht bis', value: reichtBis, highlight: !exhaustedRow },
                { label: 'Gesamt ausgezahlt', value: fmtC(totalNetto, currency) },
                { label: 'Gesamt Steuer', value: taxRate > 0 ? fmtC(totalSteuer, currency) : 'Steuerfrei' },
                { label: 'Verbleibende BTC', value: fmtBtc(remainingBtc) },
              ].map(kpi => (
                <div key={kpi.label} className="rounded-xl border p-4"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{kpi.label}</p>
                  <p className="text-sm font-bold" style={{ color: kpi.highlight ? '#22c55e' : 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart 1: Portfolio vs. kumulative Entnahmen */}
            <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Verbleibender Stack vs. Gesamtentnahmen
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Grüne Fläche = verbleibender Bitcoin-Wert · Orange = kumulierte Nettoauszahlungen
              </p>
              <EntnahmeChart rows={monthlyRows} currency={currency} />
            </div>

            {/* Chart 2: Brutto vs. Netto pro Jahr */}
            {taxRate > 0 && (
              <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Jährliche Entnahme: Netto vs. Steuer
                </h2>
                <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  Grün = Netto-Auszahlung · Rot = Steueranteil
                </p>
                <div className="flex gap-4 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#22c55e' }} />Netto</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#ef4444' }} />Steuer</span>
                </div>
                <BruttoNettoChart rows={rows} currency={currency} />
              </div>
            )}

            {/* Tabelle */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                      {['Jahr','BTC-Kurs','Portfolio','Brutto','Steuer','Netto','Verkauft','Verbleibend'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap"
                          style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.year} style={{
                        borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                        background: row.isExhausted ? 'var(--surface-alt)' : 'var(--surface)',
                        opacity: row.isExhausted ? 0.5 : 1,
                      }}>
                        <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{row.year}</td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmtC(row.btcPrice, currency)}</td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{fmtC(row.portfolio, currency)}</td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmtC(row.brutto, currency)}</td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: row.steuer > 0 ? '#ef4444' : 'var(--text-tertiary)' }}>
                          {row.steuer > 0 ? fmtC(row.steuer, currency) : '–'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap font-bold" style={{ color: '#22c55e' }}>{fmtC(row.netto, currency)}</td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmtBtc(row.btcSold)}</td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: row.remainingBtc < 0.01 ? '#ef4444' : 'var(--text-primary)' }}>
                          {fmtBtc(row.remainingBtc)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Projektionen basieren auf dem Power Law Modell. Steuerliche Behandlung gemäß gewähltem Szenario –
              individuelle Besteuerung kann abweichen. Keine Steuer- oder Anlageberatung.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
