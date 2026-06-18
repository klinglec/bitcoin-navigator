// Power Law Modell für Bitcoin
// Formel: log₁₀(P) = −17.016 + 5.845 · log₁₀(d)
// d = Tage seit Genesis Block (3. Januar 2009)
// Quelle: Giovanni Santostasi

const GENESIS_DATE = new Date('2009-01-03').getTime()
const MS_PER_DAY = 86_400_000

export type PriceModel = 'power_law' | 'cycle_4yr' | 'lower_band'

/** Tage seit Genesis Block für ein gegebenes Datum */
export function daysSinceGenesis(date: Date = new Date()): number {
  return (date.getTime() - GENESIS_DATE) / MS_PER_DAY
}

/** Power Law Median-Preis in USD für ein Datum */
export function powerLawPrice(date: Date = new Date()): number {
  const d = daysSinceGenesis(date)
  const logP = -17.016 + 5.845 * Math.log10(d)
  return Math.pow(10, logP)
}

/** Bodenpreis (unteres Band) = 35% des Medians */
export function powerLawFloor(date: Date = new Date()): number {
  return powerLawPrice(date) * 0.35
}

/** 4-Jahres-Zyklus-Modell: Sinuswelle auf den Power Law Median überlagert */
export function cyclicPrice(date: Date = new Date()): number {
  const median = powerLawPrice(date)
  const d = daysSinceGenesis(date)
  // Halving-Zyklus ~1460 Tage, Amplitude ±50% des Medians
  const cyclePhase = (2 * Math.PI * d) / 1460
  const multiplier = 1 + 0.5 * Math.sin(cyclePhase - 1.2)
  return median * multiplier
}

/** Preis nach gewähltem Modell (in USD) */
export function modelPrice(date: Date, model: PriceModel): number {
  switch (model) {
    case 'lower_band': return powerLawFloor(date)
    case 'cycle_4yr':  return cyclicPrice(date)
    default:           return powerLawPrice(date)
  }
}

/** USD → gewünschte Währung (Näherung) */
const FX: Record<string, number> = { USD: 1, EUR: 0.925, CHF: 0.91 }

export function toLocalCurrency(usdPrice: number, currency: string): number {
  return usdPrice * (FX[currency] ?? 1)
}

// ── Power Law Position & Risikoanalyse ──────────────────────────

export type PowerLawZone = 'undervalued' | 'fair' | 'elevated' | 'extreme'

export const ZONE_THRESHOLDS = {
  undervalued: 0.5,   // < 0.5× Median
  fair:        1.5,   // 0.5–1.5×
  elevated:    2.5,   // 1.5–2.5×
  // extreme:  > 2.5×
}

/** Vielfaches des aktuellen Power Law Medians */
export function powerLawMultiple(livePrice: number, currency: string): number {
  const median = toLocalCurrency(powerLawPrice(new Date()), currency)
  if (median <= 0) return 1
  return livePrice / median
}

/** Einordnung in Zone anhand des Multiples */
export function getPowerLawZone(multiple: number): PowerLawZone {
  if (multiple < ZONE_THRESHOLDS.undervalued) return 'undervalued'
  if (multiple < ZONE_THRESHOLDS.fair)        return 'fair'
  if (multiple < ZONE_THRESHOLDS.elevated)    return 'elevated'
  return 'extreme'
}

export type LiqRisk = 'safe' | 'moderate' | 'critical'

/**
 * Prüft Liquidationspreis gegen Median und unteres Band.
 * critical  = Liq. über unterem Band aber unter Median (normale Korrektur reicht)
 * moderate  = Liq. unter unterem Band (nur extremster Crash würde liquidieren)
 * safe      = Liq. deutlich unter unterem Band
 */
export function getLiqRisk(liqPrice: number, currency: string): LiqRisk {
  const median    = toLocalCurrency(powerLawPrice(new Date()), currency)
  const lowerBand = toLocalCurrency(powerLawFloor(new Date()), currency)
  if (liqPrice >= median)    return 'critical'
  if (liqPrice >= lowerBand) return 'moderate'
  return 'safe'
}

/** Jährliche Wachstumsrate des Power Law Modells (CAGR-Näherung) */
export function powerLawCAGR(fromYear: number, toYear: number): number {
  const from = powerLawPrice(new Date(`${fromYear}-01-01`))
  const to   = powerLawPrice(new Date(`${toYear}-01-01`))
  const years = toYear - fromYear
  return Math.pow(to / from, 1 / years) - 1
}

/** Datum an dem BTC laut Power Law einen Zielpreis (USD) erreicht */
export function dateForTargetPrice(targetUsd: number): Date | null {
  // Invertiere: d = 10^((log10(P) + 17.016) / 5.845)
  if (targetUsd <= 0) return null
  const logD = (Math.log10(targetUsd) + 17.016) / 5.845
  const days = Math.pow(10, logD)
  return new Date(GENESIS_DATE + days * MS_PER_DAY)
}
