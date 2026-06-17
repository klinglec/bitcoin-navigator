/**
 * SetupProfile — zentrale Datenstruktur für den Bitcoin-Konfigurator
 *
 * Erweiterungspunkt für Rechner-Integration (Phase 2):
 * - URL-Params: /setup?dca_amount=200&dca_years=10  → füllt calculatorData vor
 * - Rechner können auf /rechner/dca?from=setup&monthly=200 verlinken
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

  // ── Rechner-Daten (Phase 2 — aktuell leer) ───────────────────
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
      monthlyAmount: number
      targetBtc: number
      years: number
    }
  }
}

export const EMPTY_PROFILE: SetupProfile = {
  btcHoldings: null,
  savingsPlan: null,
  custody: null,
  seedBackup: null,
  payments: null,
  loan: null,
  calculatorData: {},
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
 * Liest URL-Params und überführt Rechner-Ergebnisse ins Profil (Phase 2)
 * Beispiel: /setup?dca_amount=200&dca_years=10&dca_btc=0.63
 */
export function mergeFromUrlParams(
  profile: SetupProfile,
  params: URLSearchParams
): SetupProfile {
  const updated = { ...profile, calculatorData: { ...profile.calculatorData } }

  if (params.get('dca_amount') && params.get('dca_years') && params.get('dca_btc')) {
    updated.calculatorData.dca = {
      monthlyAmount: Number(params.get('dca_amount')),
      years: Number(params.get('dca_years')),
      projectedBtc: Number(params.get('dca_btc')),
    }
    updated.savingsPlan = 'monthly'
  }

  if (params.get('entnahme_stack') && params.get('entnahme_monthly')) {
    updated.calculatorData.entnahme = {
      btcStack: Number(params.get('entnahme_stack')),
      monthlyWithdrawal: Number(params.get('entnahme_monthly')),
      years: Number(params.get('entnahme_years') ?? 0),
    }
  }

  if (params.get('freedom_amount') && params.get('freedom_btc')) {
    updated.calculatorData.freedom = {
      monthlyAmount: Number(params.get('freedom_amount')),
      targetBtc: Number(params.get('freedom_btc')),
      years: Number(params.get('freedom_years') ?? 0),
    }
  }

  return updated
}
