/**
 * SetupProfile — zentrale Datenstruktur für den Bitcoin-Konfigurator
 *
 * Rechner-Integration:
 * - Freedom-Boost → /setup?from=freedom-boost&monthly=X&target_btc=X...
 * - URL-Params füllen Wizard-Antworten vor und speichern Rechner-Kontext
 * - localStorage persistiert das Profil sitzungsübergreifend
 */

export interface SetupProfile {
  // ── Wizard-Antworten ──────────────────────────────────────────
  btcHoldings: 'none' | 'small' | 'medium' | 'large' | null
  // none = 0, small = <0.1 BTC, medium = 0.1–1 BTC, large = >1 BTC

  savingsPlan: 'monthly' | 'irregular' | 'no' | null

  custody: 'hardware' | 'software' | 'exchange' | 'unsure' | null

  seedBackup: 'metal' | 'paper' | 'none' | null
  // nur relevant wenn custody = hardware | software

  payments: boolean | null

  loan: boolean | null

  // ── Rechner-Daten ─────────────────────────────────────────────
  calculatorData: {
    dca?: {
      monthlyAmount: number
      years: number
      projectedBtc: number
    }
    entnahme?: {
      btcStack: number
      monthlyWithdrawal: number
      years: number
    }
    freedom?: {
      monthlyAmount: number   // monatliche Sparrate (ggf. mit Boost reduziert)
      targetBtc: number       // Ziel-BTC-Stack bei Freedom-Zeitpunkt
      years: number           // Sparphase in Jahren
      currentBtc: number      // aktueller BTC-Bestand
      withLoan: boolean       // Entnahme-Boost (Kredit-Strategie) aktiv
      currency: string
      freedomYear: number
      freedomMonth: number    // 0–11
    }
  }

  // Quelle des letzten Imports (für Banner in Setup)
  importedFrom?: 'freedom-boost' | null

  /**
   * Felder, die beim Rechner-Import automatisch gesetzt wurden
   * und vom User noch nicht explizit bestätigt wurden.
   * Setup-Ergebnis zeigt dafür Inline-Fragen.
   */
  autoSetFields?: string[]
}

export const EMPTY_PROFILE: SetupProfile = {
  btcHoldings: null,
  savingsPlan: null,
  custody: null,
  seedBackup: null,
  payments: null,
  loan: null,
  calculatorData: {},
  importedFrom: null,
}

const STORAGE_KEY = 'btcnav_setup_profile'

export function loadProfile(): SetupProfile {
  if (typeof window === 'undefined') return EMPTY_PROFILE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_PROFILE
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) }
  } catch {
    return EMPTY_PROFILE
  }
}

export function saveProfile(profile: SetupProfile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

/**
 * Liest URL-Params und überführt Rechner-Ergebnisse ins Profil.
 *
 * Freedom-Boost-Params:
 *   from=freedom-boost
 *   monthly=X        monatliche Sparrate (in currency)
 *   target_btc=X     Ziel-BTC bei Freedom
 *   current_btc=X    aktueller BTC-Bestand
 *   years=X          Sparphase Jahre
 *   with_loan=1      Kredit-Boost aktiv
 *   currency=EUR
 *   freedom_year=X
 *   freedom_month=X  0–11
 */
export function mergeFromUrlParams(
  profile: SetupProfile,
  params: URLSearchParams
): SetupProfile {
  const updated = { ...profile, calculatorData: { ...profile.calculatorData } }

  // ── Freedom-Boost Import ────────────────────────────────────────
  if (params.get('from') === 'freedom-boost') {
    const currentBtc  = Number(params.get('current_btc')   ?? 0)
    const targetBtc   = Number(params.get('target_btc')    ?? 0)
    const monthly     = Number(params.get('monthly')        ?? 0)
    const years       = Number(params.get('years')          ?? 0)
    const withLoan    = params.get('with_loan') === '1'
    const currency    = params.get('currency')              ?? 'EUR'
    const freedomYear = Number(params.get('freedom_year')   ?? 0)
    const freedomMonth= Number(params.get('freedom_month')  ?? 0)

    // BTC-Bestand kategorisieren
    updated.btcHoldings =
      currentBtc >= 1   ? 'large'  :
      currentBtc >= 0.1 ? 'medium' :
      currentBtc > 0    ? 'small'  : 'none'

    // Sparplan: immer monatlich (Freedom Rechner)
    updated.savingsPlan = 'monthly'

    // Hardware Wallet + Seed empfehlen wenn Bestand oder Ziel ≥ 0,1 BTC
    if (currentBtc >= 0.1 || targetBtc >= 0.1) {
      updated.custody    = 'hardware'
      updated.seedBackup = 'metal'
    } else {
      updated.custody    = updated.custody    ?? 'unsure'
      updated.seedBackup = updated.seedBackup ?? null
    }

    // Kredit-Interesse
    updated.loan = withLoan

    // Payments: kein Fokus im Freedom-Rechner → Default false, aber offen für Klärung
    updated.payments = false

    // Felder die automatisch gesetzt wurden → im Setup zur Bestätigung anzeigen
    const autoSet: string[] = ['payments']
    if (currentBtc >= 0.1 || targetBtc >= 0.1) {
      // seedBackup wurde via Threshold empfohlen, nicht direkt vom User gewählt
      autoSet.push('seedBackup')
    }
    updated.autoSetFields = autoSet

    // Rechner-Kontext speichern
    updated.calculatorData.freedom = {
      monthlyAmount: monthly,
      targetBtc,
      years,
      currentBtc,
      withLoan,
      currency,
      freedomYear,
      freedomMonth,
    }

    updated.importedFrom = 'freedom-boost'
  }

  // ── Legacy DCA-Params ──────────────────────────────────────────
  if (params.get('dca_amount') && params.get('dca_years') && params.get('dca_btc')) {
    updated.calculatorData.dca = {
      monthlyAmount: Number(params.get('dca_amount')),
      years:         Number(params.get('dca_years')),
      projectedBtc:  Number(params.get('dca_btc')),
    }
    updated.savingsPlan = 'monthly'
  }

  if (params.get('entnahme_stack') && params.get('entnahme_monthly')) {
    updated.calculatorData.entnahme = {
      btcStack:         Number(params.get('entnahme_stack')),
      monthlyWithdrawal:Number(params.get('entnahme_monthly')),
      years:            Number(params.get('entnahme_years') ?? 0),
    }
  }

  return updated
}

/** Prüft ob alle Pflichtfelder für den Wizard-Abschluss gesetzt sind */
export function isProfileComplete(profile: SetupProfile): boolean {
  if (!profile.btcHoldings || !profile.savingsPlan || !profile.custody || profile.loan === null) return false
  if ((profile.custody === 'hardware' || profile.custody === 'software') && profile.seedBackup === null) return false
  if (profile.payments === null) return false
  return true
}
