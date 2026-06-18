/**
 * Bitcoin-Kredit Berechnungsgrundlage
 *
 * Basiert auf echten Marktdaten von Firefish (Stand Juni 2026).
 * Verwendet für: Freedom-Rechner Integration, Kredit-Rechner (/rechner/kredit)
 *
 * Zwei Szenarien:
 *   A) Buy.Borrow.Live. — monatliches Einkommen per Kredit, kein BTC-Verkauf
 *   B) Stack Accumulation — Kredit nutzen um mehr BTC zu kaufen (Leverage)
 */

// ── Marktdaten (Firefish, Juni 2026) ────────────────────────────

export const MARKET_RATES: Record<number, number> = {
  3:  0.040,  // 4.0% p.a.
  6:  0.060,  // 6.0% p.a.
  12: 0.070,  // 7.0% p.a.
  18: 0.075,  // 7.5% p.a.
  24: 0.080,  // 8.0% p.a.
}

export const LOAN_TERM_MONTHS = [3, 6, 12, 18, 24] as const
export type LoanTermMonths = typeof LOAN_TERM_MONTHS[number]

export const LOAN_MIN_EUR = 800
export const LOAN_MAX_EUR = 60_000

// ── Kredit-Parameter ─────────────────────────────────────────────

export interface LoanParams {
  /** Gewünschter Kreditbetrag in EUR */
  loanAmountEur: number
  /** Laufzeit in Monaten */
  termMonths: LoanTermMonths
  /** Zinssatz p.a. (z.B. 0.06 für 6%) — Default: Marktrate für die Laufzeit */
  annualRate?: number
  /** Loan-to-Value Ratio (z.B. 0.50 für 50%) — wie viel % des BTC-Werts wird geliehen */
  ltv?: number
  /** Liquidations-Schwelle (z.B. 0.80 für 80% LTV) */
  liquidationLtv?: number
  /** Aktueller BTC-Preis in EUR */
  btcPriceEur: number
}

// Standardwerte (konservativ, typisch für Firefish/Hodl Hodl)
export const DEFAULT_LTV = 0.50              // 50% — du hinterlegst 2x den Kreditbetrag in BTC
export const DEFAULT_LIQUIDATION_LTV = 0.80  // 80% — Kredit wird fällig

// ── Kernberechnungen ─────────────────────────────────────────────

export interface LoanResult {
  /** Zinssatz p.a. */
  annualRate: number
  /** Zinskosten absolut für die Laufzeit in EUR */
  interestEur: number
  /** Monatliche Zinskosten (für Vergleich mit Entnahme) */
  monthlyInterestCostEur: number
  /** BTC-Menge als Sicherheit (Collateral) */
  collateralBtc: number
  /** Wert der Sicherheit in EUR */
  collateralEur: number
  /** Liquidationspreis: bei diesem BTC-Preis wird Kredit fällig */
  liquidationPriceEur: number
  /** Sicherheitspuffer: wie weit kann BTC fallen (%) bevor Liquidation */
  safetyBufferPercent: number
  /** Effektiver Jahreszins inkl. Laufzeit-Effekt */
  effectiveAnnualCostPercent: number
}

export function calcLoan(params: LoanParams): LoanResult {
  const {
    loanAmountEur,
    termMonths,
    btcPriceEur,
    annualRate = MARKET_RATES[termMonths] ?? 0.07,
    ltv = DEFAULT_LTV,
    liquidationLtv = DEFAULT_LIQUIDATION_LTV,
  } = params

  const interestEur = loanAmountEur * annualRate * (termMonths / 12)
  const monthlyInterestCostEur = interestEur / termMonths

  // Collateral: wie viel BTC musst du hinterlegen?
  const collateralEur = loanAmountEur / ltv
  const collateralBtc = collateralEur / btcPriceEur

  // Liquidationspreis: bei welchem BTC-Preis wird LTV = liquidationLtv?
  // loanAmount / (collateralBtc × liquidationPrice) = liquidationLtv
  // → liquidationPrice = loanAmount / (collateralBtc × liquidationLtv)
  const liquidationPriceEur = loanAmountEur / (collateralBtc * liquidationLtv)

  const safetyBufferPercent = ((btcPriceEur - liquidationPriceEur) / btcPriceEur) * 100

  const effectiveAnnualCostPercent = annualRate * 100

  return {
    annualRate,
    interestEur,
    monthlyInterestCostEur,
    collateralBtc,
    collateralEur,
    liquidationPriceEur,
    safetyBufferPercent,
    effectiveAnnualCostPercent,
  }
}

// ── Szenario A: Buy.Borrow.Live. ─────────────────────────────────
//
// Nutzer lebt von rollierenden Krediten statt BTC zu verkaufen.
// Frage: Wie viel BTC brauche ich für X EUR/Monat netto?

export interface BorrowLiveParams {
  /** Gewünschtes monatliches Netto-Einkommen in EUR */
  monthlyIncomeEur: number
  /** Bevorzugte Kreditlaufzeit in Monaten */
  termMonths: LoanTermMonths
  /** BTC-Preis zu Beginn */
  btcPriceEur: number
  /** Projektierter BTC-Preis am Ende (Power Law) — für Zukunftsberechnung */
  projectedBtcPriceEur?: number
  annualRate?: number
  ltv?: number
  liquidationLtv?: number
}

export interface BorrowLiveResult {
  /** Kreditbetrag pro Zyklus */
  loanAmountEur: number
  /** BTC-Sicherheit pro Kredit-Zyklus */
  collateralBtc: number
  /** Gesamter BTC-Stack der gebunden ist (bei kontinuierlichem Rollen) */
  totalCollateralBtc: number
  /** Zinskosten pro Jahr in EUR */
  annualInterestEur: number
  /** Effektive monatliche Kosten (Zins / Monat) */
  monthlyNetCostEur: number
  /** Liquidationspreis */
  liquidationPriceEur: number
  /** Sicherheitspuffer % */
  safetyBufferPercent: number
  /** Vergleich: wie viel BTC müsste man alternativ verkaufen (bei aktuellem Preis) */
  equivalentBtcSalePerMonth: number
  /** Vorteil gegenüber Verkauf: BTC die im Stack bleiben können */
  btcSavedVsSelling: number
}

export function calcBorrowLive(params: BorrowLiveParams): BorrowLiveResult {
  const {
    monthlyIncomeEur,
    termMonths,
    btcPriceEur,
    annualRate = MARKET_RATES[termMonths],
    ltv = DEFAULT_LTV,
    liquidationLtv = DEFAULT_LIQUIDATION_LTV,
  } = params

  // Kreditbetrag für die gewünschte Laufzeit
  // Zinskosten müssen vom Kredit gedeckt sein → loanAmount × (1 - Zinsen) = Nettoeinnahmen
  // loanAmount = monthlyIncomeEur × termMonths / (1 - annualRate × termMonths/12)
  const zinsanteil = annualRate * (termMonths / 12)
  const loanAmountEur = (monthlyIncomeEur * termMonths) / (1 - zinsanteil)

  const loan = calcLoan({ loanAmountEur, termMonths, btcPriceEur, annualRate, ltv, liquidationLtv })

  // Bei rollierenden Krediten: immer ein Kredit aktiv
  const totalCollateralBtc = loan.collateralBtc

  const annualInterestEur = loan.interestEur * (12 / termMonths)
  const monthlyNetCostEur = loan.monthlyInterestCostEur

  // Vergleich mit Verkauf
  const equivalentBtcSalePerMonth = monthlyIncomeEur / btcPriceEur
  const btcSavedVsSelling = equivalentBtcSalePerMonth * 12 - (annualInterestEur / btcPriceEur)

  return {
    loanAmountEur,
    collateralBtc: loan.collateralBtc,
    totalCollateralBtc,
    annualInterestEur,
    monthlyNetCostEur,
    liquidationPriceEur: loan.liquidationPriceEur,
    safetyBufferPercent: loan.safetyBufferPercent,
    equivalentBtcSalePerMonth,
    btcSavedVsSelling,
  }
}

// ── Szenario B: Stack Accumulation (Leverage) ────────────────────
//
// Nutzer beleiht BTC-Stack und kauft mit Fiat mehr BTC.
// Frage: Wie entwickelt sich der Stack über N Zyklen?

export interface StackAccumParams {
  /** Startstack in BTC */
  startBtc: number
  /** Laufzeit pro Kredit-Zyklus */
  termMonths: LoanTermMonths
  /** Anzahl Leverage-Zyklen (z.B. 3 = 3× aufstocken) */
  cycles: number
  /** BTC-Preis zu Beginn */
  btcPriceEur: number
  /** Projizierter BTC-Preis am Ende der Haltezeit (Power Law) */
  projectedBtcPriceEur: number
  annualRate?: number
  ltv?: number
  liquidationLtv?: number
}

export interface StackAccumCycle {
  cycle: number
  btcStack: number
  loanAmountEur: number
  totalDebtEur: number
  liquidationPriceEur: number
  safetyBufferPercent: number
}

export interface StackAccumResult {
  cycles: StackAccumCycle[]
  finalBtcStack: number
  totalDebtEur: number
  totalInterestEur: number
  /** Stack-Wert am Ende zum projizierten Preis */
  finalStackValueEur: number
  /** Nettogewinn nach Schuldenrückzahlung */
  netProfitEur: number
  /** Vergleich: Stack ohne Leverage zum gleichen projizierten Preis */
  baselineValueEur: number
  /** Mehrwert durch Leverage in EUR */
  leverageGainEur: number
  /** Break-even BTC-Preis: ab hier ist Leverage besser als kein Leverage */
  breakEvenPriceEur: number
}

export function calcStackAccum(params: StackAccumParams): StackAccumResult {
  const {
    startBtc,
    termMonths,
    cycles,
    btcPriceEur,
    projectedBtcPriceEur,
    annualRate = MARKET_RATES[termMonths],
    ltv = DEFAULT_LTV,
    liquidationLtv = DEFAULT_LIQUIDATION_LTV,
  } = params

  const cycleResults: StackAccumCycle[] = []
  let currentBtc = startBtc
  let totalDebt = 0
  let totalInterest = 0

  for (let i = 1; i <= cycles; i++) {
    // Beleihe den gesamten aktuellen Stack
    const loanAmountEur = currentBtc * btcPriceEur * ltv
    const loan = calcLoan({ loanAmountEur, termMonths, btcPriceEur, annualRate, ltv, liquidationLtv })

    // Kaufe mit Kredit mehr BTC (zum aktuellen Preis)
    const newBtc = loanAmountEur / btcPriceEur
    currentBtc += newBtc
    totalDebt += loanAmountEur
    totalInterest += loan.interestEur

    // Liquidationspreis für den Gesamtstack:
    // Wenn BTC fällt, steigt LTV aller Kredite gleichzeitig
    // Vereinfacht: Liquidation wenn currentBtc × price = totalDebt / liquidationLtv
    const liquidationPriceEur = totalDebt / (currentBtc * liquidationLtv)
    const safetyBufferPercent = ((btcPriceEur - liquidationPriceEur) / btcPriceEur) * 100

    cycleResults.push({
      cycle: i,
      btcStack: currentBtc,
      loanAmountEur,
      totalDebtEur: totalDebt,
      liquidationPriceEur,
      safetyBufferPercent,
    })
  }

  const finalStackValueEur = currentBtc * projectedBtcPriceEur
  const netProfitEur = finalStackValueEur - totalDebt - totalInterest
  const baselineValueEur = startBtc * projectedBtcPriceEur
  const leverageGainEur = netProfitEur - baselineValueEur

  // Break-even: bei welchem Preis ist Leverage genauso gut wie kein Leverage?
  // currentBtc × P - totalDebt - totalInterest = startBtc × P
  // P × (currentBtc - startBtc) = totalDebt + totalInterest
  // P = (totalDebt + totalInterest) / (currentBtc - startBtc)
  const breakEvenPriceEur = (totalDebt + totalInterest) / (currentBtc - startBtc)

  return {
    cycles: cycleResults,
    finalBtcStack: currentBtc,
    totalDebtEur: totalDebt,
    totalInterestEur: totalInterest,
    finalStackValueEur,
    netProfitEur,
    baselineValueEur,
    leverageGainEur,
    breakEvenPriceEur,
  }
}

// ── Freedom-Rechner Integration ──────────────────────────────────
//
// Berechnet den minimal nötigen BTC-Stack für finanzielle Freiheit
// per Kredit-Strategie (Szenario A) vs. Verkauf (bestehender Freedom-Rechner)

export interface FreedomViaLoanParams {
  /** Monatliches Ziel-Einkommen in EUR */
  monthlyTargetEur: number
  /** BTC-Preis wenn Freiheit erreicht wird (Power Law Projektion) */
  btcPriceAtFreedomEur: number
  termMonths: LoanTermMonths
  annualRate?: number
  ltv?: number
  liquidationLtv?: number
}

export interface FreedomViaLoanResult {
  /** BTC-Stack für finanzielle Freiheit via Kredit */
  requiredBtc: number
  /** EUR-Wert dieses Stacks */
  requiredBtcValueEur: number
  /** Davon gebunden als Collateral (%) */
  collateralRatioPercent: number
  /** Freier Stack (nicht als Collateral gebunden) */
  freeBtc: number
  /** Jährliche Zinskosten */
  annualInterestEur: number
  /** Liquidationspreis */
  liquidationPriceEur: number
  /** Sicherheitspuffer */
  safetyBufferPercent: number
}

export function calcFreedomViaLoan(params: FreedomViaLoanParams): FreedomViaLoanResult {
  const {
    monthlyTargetEur,
    btcPriceAtFreedomEur,
    termMonths,
    annualRate = MARKET_RATES[termMonths],
    ltv = DEFAULT_LTV,
    liquidationLtv = DEFAULT_LIQUIDATION_LTV,
  } = params

  const bbl = calcBorrowLive({
    monthlyIncomeEur: monthlyTargetEur,
    termMonths,
    btcPriceEur: btcPriceAtFreedomEur,
    annualRate,
    ltv,
    liquidationLtv,
  })

  // Gesamter Stack: Collateral + Sicherheitspuffer (20% extra für Preisschwankungen)
  const safetyBuffer = 1.20
  const requiredBtc = bbl.totalCollateralBtc * safetyBuffer
  const requiredBtcValueEur = requiredBtc * btcPriceAtFreedomEur
  const collateralRatioPercent = (bbl.totalCollateralBtc / requiredBtc) * 100
  const freeBtc = requiredBtc - bbl.totalCollateralBtc

  return {
    requiredBtc,
    requiredBtcValueEur,
    collateralRatioPercent,
    freeBtc,
    annualInterestEur: bbl.annualInterestEur,
    liquidationPriceEur: bbl.liquidationPriceEur,
    safetyBufferPercent: bbl.safetyBufferPercent,
  }
}
