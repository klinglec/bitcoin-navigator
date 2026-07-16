'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import BoersenCTA from '@/components/BoersenCTA'
import { useBtcPrice } from '@/lib/useBtcPrice'
import { BTC_PRICE_HISTORY as PRICES, BTC_HISTORY_START, BTC_HISTORY_END } from '@/lib/btcPriceHistory'

// ── Modell-Konstanten ─────────────────────────────────────────────
const DATA_START_MS = Date.parse(BTC_HISTORY_START + 'T00:00:00Z')
const END_IDX = PRICES.length - 1
const DAY_MS = 86_400_000
// Rückblick: auswählbarer Startbereich Jan 2015 .. Jan 2025
const MIN_START_IDX = Math.round((Date.parse('2015-01-01T00:00:00Z') - DATA_START_MS) / DAY_MS)
const MAX_START_IDX = Math.round((Date.parse('2025-01-01T00:00:00Z') - DATA_START_MS) / DAY_MS)

// ── Reine Hilfsfunktionen ─────────────────────────────────────────
function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function idxToDate(i: number): Date { return new Date(DATA_START_MS + i * DAY_MS) }
function addMonthsMs(ms: number, k: number): number { const d = new Date(ms); d.setUTCMonth(d.getUTCMonth() + k); return d.getTime() }

const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })
function money(x: number): string {
  if (x >= 1e9) return '$' + (x / 1e9).toFixed(1) + ' Mrd'
  if (x >= 1e6) return '$' + (x / 1e6).toFixed(x < 1e7 ? 2 : 1) + ' Mio'
  return '$' + nf0.format(Math.round(x))
}
function monthsLabel(m: number): string {
  const y = Math.floor(m / 12), mo = m % 12
  const s: string[] = []
  if (y) s.push(y + (y === 1 ? ' Jahr' : ' Jahre'))
  if (mo) s.push(mo + ' Mon.')
  return s.join(' ') || '0 Mon.'
}
const MONTHS_DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
function fmtMonthYear(ms: number): string { const d = new Date(ms); return MONTHS_DE[d.getUTCMonth()] + ' ' + d.getUTCFullYear() }

// ── Sim-Kern ──────────────────────────────────────────────────────
function monthlyContribDays(startIdx: number, endIdx: number): number[] {
  const days: number[] = []
  let lastKey: number | null = null
  for (let i = startIdx; i <= endIdx; i++) {
    const d = idxToDate(i)
    const key = d.getUTCFullYear() * 12 + d.getUTCMonth()
    if (key !== lastKey) { days.push(i); lastKey = key }
  }
  return days
}
function returnPool(startIdx: number, windowDays: number): number[] {
  const from = Math.max(1, startIdx - windowDays)
  const r: number[] = []
  for (let i = from; i < startIdx; i++) r.push(Math.log(PRICES[i] / PRICES[i - 1]))
  let m = 0; for (let j = 0; j < r.length; j++) m += r[j]; m /= r.length
  for (let k = 0; k < r.length; k++) r[k] -= m
  return r
}

interface BandPoint { dateMs: number; invested: number; p05: number; p25: number; p50: number; p75: number; p95: number }
interface RealPoint { dateMs: number; invested: number; value: number }
interface RealResult { series: RealPoint[]; investedTotal: number; finalValue: number; coins: number }
interface SimResult {
  bands: BandPoint[]; finalsSorted: number[]; N: number; months: number
  investedTotal: number; startMs: number; endMs: number; pct: (v: number) => number
}
interface SimOpts { N?: number; block?: number; seed?: number; windowDays?: number; annualDrift?: number }

function runPaths(startPrice: number, offsets: number[], horizonDays: number, rate: number, pool: number[], N: number, block: number, seed: number, dayDrift: number) {
  const M = offsets.length, poolLen = pool.length
  const rnd = mulberry32(seed)
  const monthVals: Float64Array[] = []
  for (let m = 0; m < M; m++) monthVals.push(new Float64Array(N))
  const finals = new Float64Array(N)
  for (let p = 0; p < N; p++) {
    let price = startPrice, coins = 0, cPtr = 0, blkPos = block, blkStart = 0
    for (let step = 0; step <= horizonDays; step++) {
      if (cPtr < M && offsets[cPtr] === step) { coins += rate / price; monthVals[cPtr][p] = coins * price; cPtr++ }
      if (step < horizonDays) {
        if (blkPos >= block) { blkStart = Math.floor(rnd() * (poolLen - block)); blkPos = 0 }
        const ret = pool[blkStart + blkPos] + dayDrift; blkPos++
        price = price * Math.exp(ret)
      }
    }
    finals[p] = coins * price
  }
  return { monthVals, finals }
}

function computeBands(monthVals: Float64Array[], finalsSorted: number[], datesMs: number[], rate: number): BandPoint[] {
  const M = monthVals.length
  const q = (arr: number[], pp: number) => arr[Math.min(arr.length - 1, Math.floor(pp * arr.length))]
  const bands: BandPoint[] = []
  for (let m = 0; m < M; m++) {
    const arr = Array.from(monthVals[m]).sort((a, b) => a - b)
    bands.push({ dateMs: datesMs[m], invested: rate * (m + 1), p05: q(arr, 0.05), p25: q(arr, 0.25), p50: q(arr, 0.5), p75: q(arr, 0.75), p95: q(arr, 0.95) })
  }
  bands.push({ dateMs: datesMs[M], invested: rate * M, p05: q(finalsSorted, 0.05), p25: q(finalsSorted, 0.25), p50: q(finalsSorted, 0.5), p75: q(finalsSorted, 0.75), p95: q(finalsSorted, 0.95) })
  return bands
}
function makePct(fs: number[]) {
  return (v: number) => { let lo = 0, hi = fs.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (fs[mid] < v) lo = mid + 1; else hi = mid } return lo / fs.length }
}

function realDCA(startIdx: number, endIdx: number, rate: number): RealResult {
  const cdays = monthlyContribDays(startIdx, endIdx)
  const cset = new Set(cdays)
  let coins = 0, invested = 0
  const series: RealPoint[] = []
  for (let i = startIdx; i <= endIdx; i++) {
    if (cset.has(i)) { coins += rate / PRICES[i]; invested += rate; series.push({ dateMs: idxToDate(i).getTime(), invested, value: coins * PRICES[i] }) }
  }
  const last = series[series.length - 1]
  const endMs = idxToDate(endIdx).getTime()
  if (last.dateMs !== endMs) series.push({ dateMs: endMs, invested, value: coins * PRICES[endIdx] })
  return { series, investedTotal: invested, finalValue: coins * PRICES[endIdx], coins }
}

function simulateBacktest(startIdx: number, rate: number, opts: SimOpts): SimResult {
  const N = opts.N ?? 2000, block = opts.block ?? 21, seed = opts.seed ?? 42, windowDays = opts.windowDays ?? 1095
  const dayDrift = Math.log(1 + (opts.annualDrift ?? 0)) / 365
  const cdays = monthlyContribDays(startIdx, END_IDX), M = cdays.length
  const offsets = cdays.map(d => d - startIdx), horizon = END_IDX - startIdx
  const pool = returnPool(startIdx, windowDays)
  const { monthVals, finals } = runPaths(PRICES[startIdx], offsets, horizon, rate, pool, N, block, seed, dayDrift)
  const fs = Array.from(finals).sort((a, b) => a - b)
  const datesMs = cdays.map(d => idxToDate(d).getTime()); datesMs.push(idxToDate(END_IDX).getTime())
  const bands = computeBands(monthVals, fs, datesMs, rate)
  return { bands, finalsSorted: fs, pct: makePct(fs), N, months: M, investedTotal: rate * M, startMs: idxToDate(startIdx).getTime(), endMs: idxToDate(END_IDX).getTime() }
}

function simulateForward(startMs: number, startPrice: number, months: number, rate: number, opts: SimOpts): SimResult {
  const N = opts.N ?? 2000, block = opts.block ?? 21, seed = opts.seed ?? 42, windowDays = opts.windowDays ?? 1095
  const dayDrift = Math.log(1 + (opts.annualDrift ?? 0)) / 365
  const M = months
  const offsets: number[] = [], datesMs: number[] = []
  for (let k = 0; k < M; k++) { const dk = addMonthsMs(startMs, k); offsets.push(Math.round((dk - startMs) / DAY_MS)); datesMs.push(dk) }
  const horizon = Math.round((addMonthsMs(startMs, M) - startMs) / DAY_MS)
  datesMs.push(addMonthsMs(startMs, M))
  const pool = returnPool(END_IDX + 1, windowDays) // jüngstes verfügbares ~3-Jahres-Fenster
  const { monthVals, finals } = runPaths(startPrice, offsets, horizon, rate, pool, N, block, seed, dayDrift)
  const fs = Array.from(finals).sort((a, b) => a - b)
  const bands = computeBands(monthVals, fs, datesMs, rate)
  return { bands, finalsSorted: fs, pct: makePct(fs), N, months: M, investedTotal: rate * M, startMs, endMs: addMonthsMs(startMs, M) }
}

// ── Chart ─────────────────────────────────────────────────────────
function drawChart(cv: HTMLCanvasElement, sim: SimResult, real: RealResult | null, log: boolean) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const cssW = cv.clientWidth || 880, cssH = Math.round(cssW * 0.46)
  cv.width = cssW * dpr; cv.height = cssH * dpr; cv.style.height = cssH + 'px'
  const ctx = cv.getContext('2d'); if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW, cssH)
  const padL = 64, padR = 16, padT = 14, padB = 30
  const W = cssW - padL - padR, H = cssH - padT - padB
  const bands = sim.bands, M = bands.length
  const startMs = sim.startMs, endMs = sim.endMs

  let lo = Infinity, hi = -Infinity
  for (let i = 0; i < M; i++) { lo = Math.min(lo, bands[i].p05, bands[i].invested); hi = Math.max(hi, bands[i].p95) }
  if (real) for (const s of real.series) { lo = Math.min(lo, s.value); hi = Math.max(hi, s.value) }
  lo = Math.max(lo, 1)
  if (log) { lo = Math.pow(10, Math.floor(Math.log10(lo))); hi = Math.pow(10, Math.ceil(Math.log10(hi))) }
  else { lo = 0; hi = hi * 1.05 }

  const X = (k: number) => padL + W * (k / (M - 1))
  const Y = (v: number) => {
    if (log) { const l0 = Math.log10(Math.max(v, lo)), lmin = Math.log10(lo), lmax = Math.log10(hi); return padT + H * (1 - (l0 - lmin) / (lmax - lmin)) }
    return padT + H * (1 - (v - lo) / (hi - lo))
  }

  ctx.font = "11px 'Syne', system-ui, sans-serif"; ctx.textBaseline = 'middle'
  ctx.lineWidth = 1
  const ticks: number[] = []
  if (log) { const lmin = Math.log10(lo), lmax = Math.log10(hi); for (let t = lmin; t <= lmax + 0.001; t++) ticks.push(Math.pow(10, t)) }
  else { for (let s = 0; s <= 5; s++) ticks.push(lo + (hi - lo) * s / 5) }
  ctx.textAlign = 'right'
  for (const tk of ticks) { const yy = Y(tk); ctx.strokeStyle = '#e0ddd8'; ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(padL + W, yy); ctx.stroke(); ctx.fillStyle = '#999'; ctx.fillText(money(tk), padL - 8, yy) }

  ctx.textAlign = 'center'
  let lastYear: number | null = null
  for (let xi = 0; xi < M; xi++) {
    const d = new Date(bands[xi].dateMs)
    if (d.getUTCFullYear() !== lastYear) {
      lastYear = d.getUTCFullYear(); const xx = X(xi)
      ctx.fillStyle = '#999'; ctx.fillText(String(lastYear), xx, padT + H + 16)
      ctx.strokeStyle = '#efece7'; ctx.beginPath(); ctx.moveTo(xx, padT); ctx.lineTo(xx, padT + H); ctx.stroke()
    }
  }

  const fillBand = (k1: keyof BandPoint, k2: keyof BandPoint, color: string) => {
    ctx.fillStyle = color; ctx.beginPath()
    for (let a = 0; a < M; a++) { const x = X(a), y = Y(bands[a][k1] as number); if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
    for (let b = M - 1; b >= 0; b--) ctx.lineTo(X(b), Y(bands[b][k2] as number))
    ctx.closePath(); ctx.fill()
  }
  fillBand('p05', 'p95', 'rgba(247,147,26,0.14)')
  fillBand('p25', 'p75', 'rgba(247,147,26,0.30)')

  ctx.setLineDash([5, 4]); ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5; ctx.beginPath()
  for (let c = 0; c < M; c++) { const x = X(c), y = Y(bands[c].invested); if (c === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
  ctx.stroke(); ctx.setLineDash([])

  ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.beginPath()
  for (let e = 0; e < M; e++) { const x = X(e), y = Y(bands[e].p50); if (e === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
  ctx.stroke()

  if (real) {
    ctx.strokeStyle = '#f7931a'; ctx.lineWidth = 3; ctx.beginPath()
    for (let f = 0; f < real.series.length; f++) {
      const frac = (real.series[f].dateMs - startMs) / (endMs - startMs)
      const mx = padL + W * frac, my = Y(real.series[f].value)
      if (f === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my)
    }
    ctx.stroke()
    const last = real.series[real.series.length - 1]
    ctx.fillStyle = '#f7931a'; ctx.beginPath(); ctx.arc(padL + W, Y(last.value), 4, 0, 7); ctx.fill()
  }
}

// ── UI-Helfer ─────────────────────────────────────────────────────
function sliderToIdx(v: number): number { return Math.round(MIN_START_IDX + (MAX_START_IDX - MIN_START_IDX) * (v / 100)) }
function idxToSlider(idx: number): number { return Math.round((idx - MIN_START_IDX) / (MAX_START_IDX - MIN_START_IDX) * 100) }

const RATE_PRESETS = [50, 100, 250, 500]
const DRIFT_PRESETS = [{ d: 0, label: 'Neutral (0 %)' }, { d: 28, label: 'Historisch (+28 %)' }]
const HORIZON_PRESETS = [6, 12, 24, 36, 60]
type Mode = 'back' | 'fwd'

// ── Erklärtexte für Tooltips (Pfadzahl wird eingesetzt) ───────────
function buildInfo(n: number) {
  const runs = n.toLocaleString('de-DE')
  return {
    drift: 'Die Drift ist der angenommene durchschnittliche Jahres-Trend des Kurses – wie stark Bitcoin im Modell pro Jahr im Schnitt steigt oder fällt. Bei 0 % unterstellt das Modell keinen Trend, nur zufällige Schwankung um den heutigen Kurs. +28 % entspricht der historischen mittleren Rendite seit 2015. Höher = optimistischer. Die Drift ist eine Annahme, keine Tatsache – den echten Zukunftstrend kennt niemand.',
    invested: 'Deine Sparrate multipliziert mit der Anzahl Monate – also das Geld, das du tatsächlich einzahlst, ganz ohne Kursentwicklung.',
    medianFwd: `Der mittlere der ${runs} simulierten Endwerte: In der Hälfte der Szenarien ist dein Depot mehr wert, in der Hälfte weniger. Robuster als der Durchschnitt, weil einzelne Extreme ihn nicht verzerren.`,
    chanceUp: `Anteil der ${runs} Szenarien, in denen dein Depot am Ende mehr wert ist als du eingezahlt hast. 60 % heißt: in rund 6 von 10 simulierten Zukünften bist du im Plus.`,
    band50: `Der wahrscheinlichste Korridor: In der Hälfte der ${runs} Szenarien landet dein Endwert zwischen diesen beiden Werten (25.–75. Perzentil).`,
    band90: `Die breite Bandbreite: In 90 % der ${runs} Szenarien liegt der Endwert zwischen diesen Werten. Je 5 % fallen darüber oder darunter.`,
    max: `Der höchste Endwert unter allen ${runs} simulierten Szenarien – der absolute Best Case bei extrem günstigem Kursverlauf. Sehr unwahrscheinlich, zeigt aber das theoretische Aufwärtspotenzial. Weil es das Maximum aus ${runs} Ziehungen ist, steigt dieser Wert mit der Pfadzahl.`,
    medianBack: `Der mittlere Endwert der ${runs} Zufalls-Szenarien: die Hälfte liegt darüber, die Hälfte darunter. Vergleiche ihn mit dem echten Endwert oben.`,
    realBeat: `Wie viele der ${runs} Zufalls-Szenarien der echte Kursverlauf geschlagen hat. 70 % heißt: der reale Sparplan war besser als 70 % aller simulierten Alternativ-Verläufe.`,
  }
}

const btnStyle = (active: boolean) => active
  ? { background: 'var(--text-primary)', color: '#fff', border: '1px solid var(--text-primary)' }
  : { background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
const segStyle = (active: boolean) => active
  ? { background: 'var(--surface)', color: 'var(--text-primary)', boxShadow: '0 1px 2px rgba(0,0,0,.08)' }
  : { background: 'transparent', color: 'var(--text-secondary)' }

export default function MonteCarloPage() {
  const [mode, setMode] = useState<Mode>('back')
  // gemeinsame Parameter
  const [rate, setRate] = useState(100)
  const [drift, setDrift] = useState(0)
  const [N, setN] = useState(2000)
  const [axis, setAxis] = useState<'log' | 'lin'>('log')
  // Rückblick
  const [startIdx, setStartIdx] = useState(() => sliderToIdx(60))
  // Ausblick
  const [months, setMonths] = useState(12)
  const [todayMs, setTodayMs] = useState<number | null>(null)
  const [fwdStartPrice, setFwdStartPrice] = useState<number>(PRICES[END_IDX])
  const [priceTouched, setPriceTouched] = useState(false)

  const [running, setRunning] = useState(true)
  const [result, setResult] = useState<{ real: RealResult | null; sim: SimResult; mode: Mode } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { price: livePrice } = useBtcPrice('USD')

  useEffect(() => { setTodayMs(Date.now()) }, [])
  // Live-Kurs EINMALIG als Startkurs übernehmen (nicht bei jedem WS-Tick → keine Dauer-Neuberechnung)
  const adoptedRef = useRef(false)
  useEffect(() => {
    if (livePrice && !adoptedRef.current && !priceTouched) { adoptedRef.current = true; setFwdStartPrice(Math.round(livePrice)) }
  }, [livePrice, priceTouched])

  useEffect(() => {
    setRunning(true)
    const id = setTimeout(() => {
      if (mode === 'back') {
        const real = realDCA(startIdx, END_IDX, rate)
        const sim = simulateBacktest(startIdx, rate, { N, annualDrift: drift / 100, seed: 42 })
        setResult({ real, sim, mode: 'back' })
      } else if (todayMs) {
        const sim = simulateForward(todayMs, fwdStartPrice, months, rate, { N, annualDrift: drift / 100, seed: 42 })
        setResult({ real: null, sim, mode: 'fwd' })
      }
      setRunning(false)
    }, 25)
    return () => clearTimeout(id)
  }, [mode, startIdx, months, rate, drift, N, todayMs, fwdStartPrice])

  useEffect(() => {
    if (!result || !canvasRef.current) return
    drawChart(canvasRef.current, result.sim, result.real, axis === 'log')
  }, [result, axis])
  useEffect(() => {
    const onR = () => { if (result && canvasRef.current) drawChart(canvasRef.current, result.sim, result.real, axis === 'log') }
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [result, axis])

  const kpis = useMemo(() => {
    if (!result) return null
    const { real, sim } = result
    const med = sim.finalsSorted[Math.floor(0.5 * sim.N)]
    const p05 = sim.finalsSorted[Math.floor(0.05 * sim.N)]
    const p95 = sim.finalsSorted[Math.floor(0.95 * sim.N)]
    const p25 = sim.finalsSorted[Math.floor(0.25 * sim.N)]
    const p75 = sim.finalsSorted[Math.floor(0.75 * sim.N)]
    const maxFinal = sim.finalsSorted[sim.finalsSorted.length - 1]
    const chanceUp = (1 - sim.pct(sim.investedTotal)) * 100
    if (result.mode === 'back' && real) {
      const realPct = sim.pct(real.finalValue) * 100
      const mult = real.finalValue / real.investedTotal
      let verdict: string
      if (realPct >= 70) verdict = `Der echte Verlauf war besser als ${realPct.toFixed(0)} % aller Zufalls-Szenarien – dieser Sparplan hatte Rückenwind, nicht nur Zufall. Das ist der Effekt der historisch positiven Bitcoin-Drift, die ein neutrales Modell bewusst nicht annimmt.`
      else if (realPct >= 45) verdict = `Der echte Verlauf lag im typischen Bereich (${realPct.toFixed(0)}. Perzentil) – ein Ergebnis, wie es der Zufall bei dieser Volatilität oft hergibt. Weder außergewöhnliches Glück noch Pech.`
      else verdict = `Der echte Verlauf war schwächer als ${(100 - realPct).toFixed(0)} % der Szenarien (${realPct.toFixed(0)}. Perzentil) – ein Start kurz vor einer längeren Seitwärts- oder Abwärtsphase. Über längere Zeiträume glätten sich solche Startpunkt-Effekte meist.`
      return { mode: 'back' as const, med, p05, p95, realPct, mult, verdict }
    }
    const medMult = med / sim.investedTotal
    const driftTxt = drift === 0 ? 'einer neutralen Annahme (0 % Drift)' : `deiner Drift-Annahme von ${drift > 0 ? '+' : ''}${drift} % pro Jahr`
    const verdict = `In der Hälfte der Szenarien ist dein Depot nach ${monthsLabel(sim.months)} mehr als ${money(med)} wert (${medMult.toFixed(2)}× deiner Einzahlung). Mit 90 % Wahrscheinlichkeit landet es zwischen ${money(p05)} und ${money(p95)}. Diese Bandbreite folgt aus ${driftTxt} plus der Bitcoin-typischen Schwankung der letzten ~3 Jahre – je länger der Horizont, desto breiter der Fächer. Das ist keine Prognose, sondern eine Wahrscheinlichkeits-Bandbreite.`
    return { mode: 'fwd' as const, med, p05, p95, p25, p75, maxFinal, chanceUp, medMult, verdict }
  }, [result, drift])

  const infos = useMemo(() => buildInfo(result?.sim.N ?? N), [result, N])
  const displayMonths = result ? result.sim.months : (mode === 'back' ? 0 : months)

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader />
      <main className="px-6 md:px-12 py-12 max-w-4xl mx-auto">

        <Link href="/rechner" className="text-sm mb-4 inline-block hover:underline" style={{ color: 'var(--text-secondary)' }}>
          ← Alle Rechner
        </Link>

        <div className="mb-6">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-2" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            Neu · Monte-Carlo
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ letterSpacing: '-0.03em' }}>
            Monte-Carlo Sparplan-Simulator
          </h1>
          <p className="text-base max-w-xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Simuliere einen Bitcoin-Sparplan über tausende zufällige Kursverläufe. Im <strong>Rückblick</strong> vergleichst
            du den echten Verlauf mit dem Zufall, im <strong>Ausblick</strong> projizierst du deinen Plan ab heute in die Zukunft.
          </p>
        </div>

        {/* Modus-Umschalter */}
        <div className="inline-flex rounded-lg p-1 gap-1 mb-5" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
          {([['back', 'Rückblick · Realität vs. Zufall'], ['fwd', 'Ausblick · Zukunft simulieren']] as const).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} className="px-4 py-2 rounded-md text-sm font-semibold" style={segStyle(mode === m)}>
              {label}
            </button>
          ))}
        </div>

        {/* Eingaben */}
        <div className="rounded-xl border p-6 mb-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {mode === 'back' ? (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Startdatum: <span style={{ color: 'var(--accent)' }}>{fmtMonthYear(idxToDate(startIdx).getTime())}</span>
                </label>
                <input type="range" min={0} max={100} value={idxToSlider(startIdx)} onChange={e => setStartIdx(sliderToIdx(Number(e.target.value)))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Läuft bis {BTC_HISTORY_END} (Datenstand). Vergleich mit echtem Kursverlauf.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Zeitraum ab heute: <span style={{ color: 'var(--accent)' }}>{monthsLabel(months)}</span>
                </label>
                <input type="range" min={3} max={60} step={1} value={months} onChange={e => setMonths(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {HORIZON_PRESETS.map(h => (
                    <button key={h} onClick={() => setMonths(h)} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={btnStyle(months === h)}>
                      {h >= 12 ? (h / 12) + (h === 12 ? ' Jahr' : ' Jahre') : h + ' Mon.'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sparrate */}
            <div>
              <label className="block text-sm font-semibold mb-2">Sparrate pro Monat</label>
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>$</span>
                <input type="number" min={1} step={10} value={rate} onChange={e => setRate(Math.max(1, Number(e.target.value) || 100))} className="w-28 px-3 py-2 rounded-lg font-semibold" style={{ border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>/ Monat</span>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {RATE_PRESETS.map(r => (
                  <button key={r} onClick={() => setRate(r)} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={btnStyle(rate === r)}>{r}</button>
                ))}
              </div>
            </div>

            {/* Startkurs (nur Ausblick) */}
            {mode === 'fwd' && (
              <div>
                <label className="block text-sm font-semibold mb-2">Startkurs (BTC/USD)</label>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>$</span>
                  <input type="number" min={1} step={100} value={fwdStartPrice} onChange={e => { setPriceTouched(true); setFwdStartPrice(Math.max(1, Number(e.target.value) || 1)) }} className="w-32 px-3 py-2 rounded-lg font-semibold" style={{ border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-primary)' }} />
                  {livePrice && (
                    <button onClick={() => { setPriceTouched(false); setFwdStartPrice(Math.round(livePrice)) }} className="text-xs px-2 py-1 rounded-md font-semibold" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} title="Aktuellen Live-Kurs übernehmen">
                      ↻ Live: {money(livePrice)}
                    </button>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {livePrice ? 'Live-Kurs von Binance (BTC/USDT).' : 'Live-Kurs lädt … Startwert = letzter Datenstand.'}
                </p>
              </div>
            )}

            {/* Drift */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Angenommene jährliche Drift: <span style={{ color: 'var(--accent)' }}>{drift > 0 ? '+' : ''}{drift} %</span>
                <InfoTooltip text={infos.drift} />
              </label>
              <input type="range" min={-15} max={35} step={1} value={drift} onChange={e => setDrift(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
              <div className="flex gap-2 mt-2 flex-wrap">
                {DRIFT_PRESETS.map(p => (
                  <button key={p.d} onClick={() => setDrift(p.d)} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={btnStyle(drift === p.d)}>{p.label}</button>
                ))}
              </div>
            </div>

            {/* Genauigkeit */}
            <div>
              <label className="block text-sm font-semibold mb-2">Genauigkeit</label>
              <div className="inline-flex rounded-lg p-1 gap-1" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                {[2000, 5000].map(n => (
                  <button key={n} onClick={() => setN(n)} className="px-3 py-1.5 rounded-md text-sm font-semibold" style={segStyle(N === n)}>{n.toLocaleString('de-DE')} Pfade</button>
                ))}
              </div>
              {running && <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>rechne …</p>}
            </div>
          </div>
        </div>

        {/* Ergebnis */}
        <div className="rounded-xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-xs tracking-widest uppercase font-bold mb-2" style={{ color: 'var(--text-tertiary)' }}>
            {mode === 'back' ? 'Ergebnis nach' : 'Projektion über'} {monthsLabel(displayMonths)}
          </h2>
          {mode === 'fwd' && (
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Jede Möglichkeit im Chart ist eine denkbare Zukunft deines Sparplans. Die Bänder zeigen, wie
              wahrscheinlich welcher Depotwert nach dem Zeitraum ist – kein einzelner Wert ist eine Vorhersage.
              Fahre über das <span style={{ fontWeight: 700 }}>ⓘ</span> für Erklärungen zu jeder Kennzahl.
            </p>
          )}

          {kpis && result && (
            <>
              <div className={`grid grid-cols-2 gap-3 ${kpis.mode === 'fwd' ? 'md:grid-cols-3' : 'md:grid-cols-5'}`}>
                {kpis.mode === 'back' && result.real ? (
                  <>
                    <Kpi k="Eingezahlt" v={money(result.sim.investedTotal)} s={`${result.sim.months} Monatsraten`} info={infos.invested} />
                    <Kpi k="Realer Endwert" v={money(result.real.finalValue)} s={`${kpis.mult.toFixed(2)}x · ${kpis.mult >= 1 ? 'Gewinn' : 'Verlust'}`} tone={kpis.mult >= 1 ? 'up' : 'down'} />
                    <Kpi k="Median-Szenario" v={money(kpis.med)} s="Hälfte darüber/darunter" info={infos.medianBack} />
                    <Kpi k="Realität schlug" v={`${kpis.realPct.toFixed(0)} %`} s="der Zufalls-Szenarien" hero info={infos.realBeat} />
                    <Kpi k="Spanne 5–95 %" v={money(kpis.p05)} s={`bis ${money(kpis.p95)}`} info={infos.band90} />
                  </>
                ) : kpis.mode === 'fwd' ? (
                  <>
                    <Kpi k="Eingezahlt" v={money(result.sim.investedTotal)} s={`${result.sim.months} Monatsraten`} info={infos.invested} />
                    <Kpi k="Median-Endwert" v={money(kpis.med)} s={`${kpis.medMult.toFixed(2)}× Einzahlung`} tone={kpis.medMult >= 1 ? 'up' : 'down'} info={infos.medianFwd} />
                    <Kpi k="Chance im Plus" v={`${kpis.chanceUp.toFixed(0)} %`} s="Endwert > Einzahlung" hero info={infos.chanceUp} />
                    <Kpi k="50 %-Bereich" v={money(kpis.p25)} s={`bis ${money(kpis.p75)}`} info={infos.band50} />
                    <Kpi k="Spanne 5–95 %" v={money(kpis.p05)} s={`bis ${money(kpis.p95)}`} info={infos.band90} />
                    <Kpi k="Maximum (Bestfall)" v={money(kpis.maxFinal)} s={`bester von ${result.sim.N.toLocaleString('de-DE')} Verläufen`} info={infos.max} />
                  </>
                ) : null}
              </div>

              <div className="flex justify-end mt-4">
                <div className="inline-flex rounded-lg p-1 gap-1" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                  {([['log', 'Log-Skala'], ['lin', 'Linear']] as const).map(([a, label]) => (
                    <button key={a} onClick={() => setAxis(a)} className="px-3 py-1.5 rounded-md text-sm font-semibold" style={segStyle(axis === a)}>{label}</button>
                  ))}
                </div>
              </div>

              <canvas ref={canvasRef} className="w-full mt-2 rounded-lg" style={{ display: 'block' }} />

              <div className="flex flex-wrap gap-4 mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Legend swatch="#f7931a33">90 %-Band (5–95 %)</Legend>
                <Legend swatch="#f7931a66">50 %-Band (25–75 %)</Legend>
                <Legend line="#1a1a1a">Median-Szenario</Legend>
                {mode === 'back' && <Legend line="#f7931a">Echter Kursverlauf</Legend>}
                <Legend dashed>Eingezahlt</Legend>
              </div>

              <div className="mt-4 rounded-r-lg p-4 text-sm" style={{ background: 'var(--accent-dim)', borderLeft: '3px solid var(--accent)', color: 'var(--text-primary)' }}>
                {kpis.verdict}
              </div>
            </>
          )}

          <BoersenCTA context="sparplan" />

          <Link href="/rechner/dca" className="inline-block mt-4 text-sm font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
            Klassischer Sparplan-Rechner →
          </Link>
        </div>

        <p className="mt-8 text-xs" style={{ color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          So funktioniert das Modell: Für jedes Szenario werden echte tägliche Bitcoin-Renditen aus einem ~3-Jahres-Fenster
          zufällig neu zusammengesetzt (Block-Bootstrap, erhält Volatilität und Fat Tails), die angenommene Drift wird explizit
          obendrauf gelegt. Im Rückblick wird nur mit Daten gerechnet, die zum Startzeitpunkt bereits existierten – kein Blick
          in die Zukunft. Kursbasis BTC/USD (CoinMetrics, {BTC_HISTORY_START} bis {BTC_HISTORY_END}), Beträge in $.{' '}
          <strong>Das ist eine statistische Szenariorechnung, keine Prognose und keine Anlageberatung.</strong>{' '}
          Vergangene Wertentwicklung ist kein Indikator für zukünftige Ergebnisse.
        </p>
      </main>
    </div>
  )
}

// ── kleine Präsentations-Komponenten ──────────────────────────────
function Kpi({ k, v, s, hero, tone, info }: { k: string; v: string; s: string; hero?: boolean; tone?: 'up' | 'down'; info?: string }) {
  const vColor = hero ? 'var(--accent)' : tone === 'up' ? 'var(--green)' : tone === 'down' ? '#b23b3b' : 'var(--text-primary)'
  return (
    <div className="rounded-xl p-3" style={{ background: hero ? 'var(--accent-dim)' : 'var(--surface-alt)', border: `1px solid ${hero ? '#f7931a44' : 'var(--border)'}` }}>
      <div className="font-semibold uppercase tracking-wide flex items-center" style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>
        {k}{info && <InfoTooltip text={info} pos="below" />}
      </div>
      <div className="font-extrabold mt-1" style={{ fontSize: '1.15rem', color: vColor, letterSpacing: '-0.02em' }}>{v}</div>
      <div className="mt-0.5" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{s}</div>
    </div>
  )
}

function InfoTooltip({ text, pos = 'side' }: { text: string; pos?: 'side' | 'below' }) {
  const [open, setOpen] = useState(false)
  const popStyle = pos === 'below'
    ? { right: 0, top: '1.4rem' as const }
    : { left: '1.5rem' as const, top: 0 }
  return (
    <span className="relative inline-block ml-1.5 align-middle">
      <button type="button" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full font-bold flex items-center justify-center cursor-help"
        style={{ background: 'var(--border)', color: 'var(--text-secondary)', fontSize: '10px' }} aria-label="Erklärung">
        i
      </button>
      {open && (
        <span className="absolute z-50 w-60 rounded-xl border p-3 shadow-lg" style={{ ...popStyle, background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
          {text}
        </span>
      )}
    </span>
  )
}
function Legend({ children, swatch, line, dashed }: { children: React.ReactNode; swatch?: string; line?: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatch && <i style={{ width: 14, height: 10, borderRadius: 2, background: swatch, display: 'inline-block' }} />}
      {line && <i style={{ width: 18, height: 3, borderRadius: 2, background: line, display: 'inline-block' }} />}
      {dashed && <i style={{ width: 18, height: 0, borderTop: '2px dashed #999', display: 'inline-block' }} />}
      {children}
    </span>
  )
}
