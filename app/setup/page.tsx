'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import {
  SetupProfile,
  EMPTY_PROFILE,
  loadProfile,
  saveProfile,
  mergeFromUrlParams,
  isProfileComplete,
} from '@/lib/setupProfile'
import { loadCart, computeTotals } from '@/lib/setupCart'

// ── Schritte ────────────────────────────────────────────────────
type Step = 'holdings' | 'savings' | 'custody' | 'seed' | 'payments' | 'loan' | 'result'

const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']

function getSteps(profile: SetupProfile): Step[] {
  const steps: Step[] = ['holdings', 'savings', 'custody']
  if (profile.custody === 'hardware' || profile.custody === 'software') {
    steps.push('seed')
  }
  steps.push('payments', 'loan', 'result')
  return steps
}

// ── Empfehlungen ────────────────────────────────────────────────
interface Recommendation {
  title: string
  desc: string
  href: string
  label: string
}

function buildRecommendations(profile: SetupProfile): Recommendation[] {
  const recs: Recommendation[] = []
  const fd = profile.calculatorData.freedom

  if (profile.savingsPlan === 'monthly' || profile.savingsPlan === 'irregular' || profile.btcHoldings === 'none') {
    recs.push({
      title: 'Börse für Bitcoin-Kauf',
      desc: fd
        ? `Dein Freedom-Sparplan: ${fd.monthlyAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ${fd.currency}/Monat über ${fd.years.toFixed(0)} Jahre`
        : profile.calculatorData.dca
        ? `Dein Sparplan: ${profile.calculatorData.dca.monthlyAmount} €/Monat über ${profile.calculatorData.dca.years} Jahre`
        : 'Günstige Gebühren, Sparplanfunktion, KYC-Level im Vergleich',
      href: '/vergleich/boersen',
      label: 'Börsen vergleichen',
    })
  }

  if (profile.custody === 'hardware' || profile.custody === 'unsure') {
    const hwThreshold = fd && (fd.currentBtc >= 0.1 || fd.targetBtc >= 0.1)
    recs.push({
      title: 'Hardware Wallet',
      desc: hwThreshold
        ? `Empfohlen: Ziel-Stack ${fd!.targetBtc.toFixed(3)} BTC benötigt Selbstverwahrung — 12 Modelle verglichen`
        : 'Open Source, Secure Element & UX — 12 Modelle verglichen',
      href: '/vergleich/hardware-wallets',
      label: 'Wallets vergleichen',
    })
  }

  if (
    profile.seedBackup !== null ||
    profile.custody === 'hardware' ||
    profile.custody === 'software'
  ) {
    recs.push({
      title: 'Seed-Backup',
      desc: 'Stahlplatten & Titan-Gravur — feuerfest, wasserdicht, unzerstörbar',
      href: '/vergleich/seed-backup',
      label: 'Seed-Backup vergleichen',
    })
  }

  if (profile.payments) {
    recs.push({
      title: 'Mit Bitcoin bezahlen',
      desc: 'Gutscheine, eSIMs & Aufladungen — Lightning im Alltag nutzen',
      href: '/vergleich/zahlungsdienste',
      label: 'Zahlungsdienste ansehen',
    })
  }

  if (profile.loan) {
    recs.push({
      title: 'Bitcoin-Kredit',
      desc: fd?.withLoan
        ? 'Entnahme-Boost: Stack bleibt intact, Kredit statt Verkauf — Anbieter im Vergleich'
        : 'Fiat leihen ohne zu verkaufen — Non-Custodial & MiCA-reguliert',
      href: '/vergleich/btc-kredite',
      label: 'Kredite vergleichen',
    })
  }

  if (recs.length === 0) {
    recs.push({
      title: 'Börsen & Exchanges',
      desc: 'Der beste Einstieg: eine gute Börse finden',
      href: '/vergleich/boersen',
      label: 'Börsen vergleichen',
    })
  }

  return recs
}

// ── Pending Questions (auto-gesetzt, noch nicht bestätigt) ───────
interface PendingQuestionProps {
  profile: SetupProfile
  onAnswer: (patch: Partial<SetupProfile>) => void
}

function PendingQuestions({ profile, onAnswer }: PendingQuestionProps) {
  const pending = profile.autoSetFields ?? []
  if (pending.length === 0) return null

  const btnBase = 'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer'
  const btnSel  = `${btnBase} border-[#1a1a1a] bg-[#1a1a1a] text-white`
  const btnIdle = `${btnBase} border-[#e5e5e5] hover:border-[#aaa]`

  function confirm(field: string, patch: Partial<SetupProfile>) {
    const remaining = pending.filter(f => f !== field)
    onAnswer({ ...patch, autoSetFields: remaining })
  }

  return (
    <div className="rounded-xl border mb-8 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#b45309' }}
        >
          {pending.length} Frage{pending.length !== 1 ? 'n' : ''} offen
        </span>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Konnten nicht aus dem Rechner abgeleitet werden
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>

        {/* ── Seed-Backup ── */}
        {pending.includes('seedBackup') && (
          <div className="px-4 py-4">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Wie möchtest du deine Seed-Phrase sichern?
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Bei einem Stack ≥ 0,1 BTC empfehlen wir ein Metall-Backup — feuerfest & wasserdicht.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'metal', label: 'Metall (empfohlen)' },
                { value: 'paper', label: 'Papier' },
                { value: 'none',  label: 'Noch kein Plan' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => confirm('seedBackup', { seedBackup: opt.value as SetupProfile['seedBackup'] })}
                  className={profile.seedBackup === opt.value ? btnSel : btnIdle}
                  style={{ background: profile.seedBackup === opt.value ? '#1a1a1a' : 'var(--surface)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Payments ── */}
        {pending.includes('payments') && (
          <div className="px-4 py-4">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Willst du mit Bitcoin bezahlen?
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Gutscheine, eSIMs & Lightning — nur relevant wenn du Bitcoin im Alltag nutzen willst.
            </p>
            <div className="flex gap-2">
              {[
                { value: true,  label: 'Ja' },
                { value: false, label: 'Nein' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => confirm('payments', { payments: opt.value })}
                  className={profile.payments === opt.value ? btnSel : btnIdle}
                  style={{ background: profile.payments === opt.value ? '#1a1a1a' : 'var(--surface)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Freedom-Plan-Banner ─────────────────────────────────────────
function FreedomPlanBanner({ profile, isFromRechner }: { profile: SetupProfile; isFromRechner: boolean }) {
  const fd = profile.calculatorData.freedom
  // Nur anzeigen wenn aktive Rechner-Session (URL-Param), nicht bei Reload mit alten localStorage-Daten
  if (!isFromRechner || !fd) return null

  const freedomDate = fd.freedomYear > 0
    ? `${MONTH_NAMES[fd.freedomMonth] ?? ''} ${fd.freedomYear}`
    : null

  const fmtBtc = (v: number) =>
    v >= 0.001 ? v.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 4 }) + ' BTC' : '—'

  const fmtC = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: fd.currency, maximumFractionDigits: 0 }).format(v)

  return (
    <div
      className="rounded-xl p-4 mb-8 border"
      style={{ background: 'var(--surface-alt)', borderColor: '#1a1a1a' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#1a1a1a', color: '#fff' }}>
          Freedom-Rechner
        </span>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Dein Plan wurde automatisch importiert
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Sparrate</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fmtC(fd.monthlyAmount)}/Mo.</p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Zeithorizont</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fd.years.toFixed(0)} Jahre</p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Ziel-Stack</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fmtBtc(fd.targetBtc)}</p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Freedom-Zeitpunkt</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{freedomDate ?? '—'}</p>
        </div>
      </div>
      {fd.withLoan && (
        <p className="text-xs mt-2 pt-2 border-t" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
          ✓ Kredit-Strategie (Entnahme-Boost) aktiv — kein Bitcoin verkaufen nötig
        </p>
      )}
      <Link
        href="/rechner/freedom-boost"
        className="text-xs mt-2 inline-block"
        style={{ color: 'var(--text-tertiary)', textDecoration: 'underline' }}
      >
        ← Zurück zum Rechner
      </Link>
    </div>
  )
}

// ── Wizard Feedback ─────────────────────────────────────────────
function WizardFeedback() {
  const [submitted, setSubmitted] = useState(false)
  const [hovered, setHovered]     = useState(0)

  async function submit(rating: number) {
    setSubmitted(true)
    await fetch('/api/wizard-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    })
  }

  if (submitted) {
    return (
      <p className="text-sm text-center py-2" style={{ color: 'var(--text-tertiary)' }}>
        Danke für dein Feedback ✓
      </p>
    )
  }

  return (
    <div className="text-center py-4">
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
        War diese Empfehlung hilfreich?
      </p>
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            onClick={() => submit(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '22px',
              lineHeight: 1,
              color: s <= hovered ? '#F7931A' : '#d0cdc8',
              transition: 'color 0.1s',
            }}
            aria-label={`${s} von 5 Sternen`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Haupt-Komponente ─────────────────────────────────────────────
function SetupWizard() {
  const searchParams = useSearchParams()
  const [profile, setProfile]         = useState<SetupProfile>(EMPTY_PROFILE)
  const [currentStep, setCurrentStep] = useState<Step>('holdings')
  const [cartCount, setCartCount]     = useState(0)
  const [cartOneTime, setCartOneTime] = useState(0)

  useEffect(() => {
    let loaded = loadProfile()
    if (searchParams.toString()) {
      loaded = mergeFromUrlParams(loaded, searchParams)
    }
    setProfile(loaded)
    saveProfile(loaded)

    // Auto-jump zum Ergebnis wenn alles vorausgefüllt (z.B. Import aus Freedom-Rechner)
    if (searchParams.get('from') === 'freedom-boost' && isProfileComplete(loaded)) {
      setCurrentStep('result')
    }

    // Cart-Badge
    const cart = loadCart()
    setCartCount(cart.items.length)
    setCartOneTime(computeTotals(cart).totalOneTime)
  }, [searchParams])

  const steps = getSteps(profile)
  const stepIndex = steps.indexOf(currentStep)
  const progressSteps = steps.filter(s => s !== 'result')

  function update(patch: Partial<SetupProfile>) {
    const updated = { ...profile, ...patch }
    setProfile(updated)
    saveProfile(updated)
  }

  function next() {
    const idx = steps.indexOf(currentStep)
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1])
  }

  function back() {
    const idx = steps.indexOf(currentStep)
    if (idx > 0) setCurrentStep(steps[idx - 1])
  }

  const canProceed = (): boolean => {
    if (currentStep === 'holdings') return profile.btcHoldings !== null
    if (currentStep === 'savings') return profile.savingsPlan !== null
    if (currentStep === 'custody') return profile.custody !== null
    if (currentStep === 'seed') return profile.seedBackup !== null
    if (currentStep === 'payments') return profile.payments !== null
    if (currentStep === 'loan') return profile.loan !== null
    return true
  }

  const btnBase = 'rounded-xl px-5 py-3 text-sm font-medium transition-all border cursor-pointer'
  const btnSelected = `${btnBase} border-[1.5px] border-[#1a1a1a]`
  const btnIdle = `${btnBase} border-[#e5e5e5] hover:border-[#aaa]`

  // Badge "Vom Rechner" — nur wenn die aktuelle URL-Session aus dem Rechner kommt,
  // NICHT aus dem gespeicherten profile.importedFrom (das persistiert über Reloads)
  const isFromRechner = searchParams.get('from') === 'freedom-boost'
  const importBadge = isFromRechner
    ? <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}>Rechner</span>
    : null

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader activePath="/setup" />

      <main className="px-6 md:px-12 py-12 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase mb-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Bitcoin Navigator
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ letterSpacing: '-0.03em' }}>
            Mein Bitcoin-Setup
          </h1>
          <p className="text-base max-w-xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Beantworte ein paar Fragen — wir zeigen dir genau, welche Produkte du brauchst.
          </p>
        </div>

        {/* Fortschrittsanzeige */}
        {currentStep !== 'result' && (
          <div className="flex items-center gap-2 mb-10">
            {progressSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{
                    background: i < stepIndex ? '#1a1a1a' : i === stepIndex ? '#ffffff' : 'var(--surface)',
                    color: i < stepIndex ? '#ffffff' : '#1a1a1a',
                    border: i === stepIndex ? '1.5px solid #1a1a1a' : i < stepIndex ? 'none' : '1px solid #e5e5e5',
                  }}
                >
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                {i < progressSteps.length - 1 && (
                  <div className="flex-1 h-px" style={{ background: i < stepIndex ? '#1a1a1a' : '#e5e5e5' }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Schritt 1: BTC-Bestand ── */}
        {currentStep === 'holdings' && (
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'var(--text-tertiary)' }}>Ausgangspunkt</p>
            <h2 className="text-xl font-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
              Wie viel Bitcoin hast du aktuell?
            </h2>
            {isFromRechner && profile.btcHoldings && (
              <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
                Vom Freedom-Rechner vorausgefüllt — du kannst das hier anpassen.
              </p>
            )}
            {!isFromRechner && <div className="mb-6" />}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { value: 'none', label: 'Noch keinen', sub: 'Ich fange neu an' },
                { value: 'small', label: 'Unter 0,1 BTC', sub: 'Erste Schritte' },
                { value: 'medium', label: '0,1 – 1 BTC', sub: 'Im Aufbau' },
                { value: 'large', label: 'Über 1 BTC', sub: 'Signifikanter Stack' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => update({ btcHoldings: opt.value as SetupProfile['btcHoldings'] })}
                  className={profile.btcHoldings === opt.value ? btnSelected : btnIdle}
                  style={{ textAlign: 'left', background: 'var(--surface)' }}
                >
                  <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                    {profile.btcHoldings === opt.value && importBadge}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{opt.sub}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={next} disabled={!canProceed()}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: canProceed() ? '#1a1a1a' : '#e5e5e5', color: canProceed() ? '#fff' : '#aaa', cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* ── Schritt 2: Sparplan ── */}
        {currentStep === 'savings' && (
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'var(--text-tertiary)' }}>Kaufplan</p>
            <h2 className="text-xl font-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
              Willst du regelmäßig Bitcoin kaufen?
            </h2>
            {isFromRechner && profile.savingsPlan && (
              <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
                Vom Freedom-Rechner vorausgefüllt — du kannst das hier anpassen.
              </p>
            )}
            {!isFromRechner && <div className="mb-6" />}
            <div className="flex flex-col gap-3 mb-8">
              {[
                { value: 'monthly', label: 'Ja, monatlich (Sparplan)', sub: 'Feste Rate, automatisch oder manuell' },
                { value: 'irregular', label: 'Ja, aber unregelmäßig', sub: 'Bei günstigen Kursen oder nach Gefühl' },
                { value: 'no', label: 'Nein, ich halte nur', sub: 'Stack ist vorhanden, kein weiterer Kauf geplant' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => update({ savingsPlan: opt.value as SetupProfile['savingsPlan'] })}
                  className={profile.savingsPlan === opt.value ? btnSelected : btnIdle}
                  style={{ textAlign: 'left', background: 'var(--surface)' }}
                >
                  <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                    {profile.savingsPlan === opt.value && importBadge}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{opt.sub}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="text-sm" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>← Zurück</button>
              <button onClick={next} disabled={!canProceed()}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: canProceed() ? '#1a1a1a' : '#e5e5e5', color: canProceed() ? '#fff' : '#aaa', cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* ── Schritt 3: Verwahrung ── */}
        {currentStep === 'custody' && (
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'var(--text-tertiary)' }}>Verwahrung</p>
            <h2 className="text-xl font-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
              Wie willst du deine Bitcoin verwahren?
            </h2>
            {isFromRechner && profile.custody && (
              <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
                Hardware Wallet empfohlen: Ziel-Stack ≥ 0,1 BTC — du kannst das hier anpassen.
              </p>
            )}
            {!isFromRechner && <div className="mb-6" />}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { value: 'hardware', label: 'Hardware Wallet', sub: 'Höchste Sicherheit, selbstverwahrt' },
                { value: 'software', label: 'Software Wallet', sub: 'App auf Smartphone oder PC' },
                { value: 'exchange', label: 'Auf der Börse', sub: 'Einfach, nicht selbstverwahrt' },
                { value: 'unsure', label: 'Noch unsicher', sub: 'Ich brauche eine Empfehlung' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => update({ custody: opt.value as SetupProfile['custody'] })}
                  className={profile.custody === opt.value ? btnSelected : btnIdle}
                  style={{ textAlign: 'left', background: 'var(--surface)' }}
                >
                  <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                    {profile.custody === opt.value && importBadge}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{opt.sub}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="text-sm" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>← Zurück</button>
              <button onClick={next} disabled={!canProceed()}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: canProceed() ? '#1a1a1a' : '#e5e5e5', color: canProceed() ? '#fff' : '#aaa', cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* ── Schritt 4: Seed-Backup (konditionell) ── */}
        {currentStep === 'seed' && (
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'var(--text-tertiary)' }}>Sicherung</p>
            <h2 className="text-xl font-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
              Wie willst du deine Seed Phrase sichern?
            </h2>
            {isFromRechner && profile.seedBackup && (
              <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
                Vom Freedom-Rechner vorausgefüllt — du kannst das hier anpassen.
              </p>
            )}
            {!isFromRechner && <div className="mb-6" />}
            <div className="flex flex-col gap-3 mb-8">
              {[
                { value: 'metal', label: 'Metall-Backup (empfohlen)', sub: 'Stahl oder Titan — feuerfest und wasserdicht' },
                { value: 'paper', label: 'Auf Papier', sub: 'Günstig, aber nicht feuerfest' },
                { value: 'none', label: 'Noch kein Plan', sub: 'Ich weiß noch nicht wie' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => update({ seedBackup: opt.value as SetupProfile['seedBackup'] })}
                  className={profile.seedBackup === opt.value ? btnSelected : btnIdle}
                  style={{ textAlign: 'left', background: 'var(--surface)' }}
                >
                  <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                    {profile.seedBackup === opt.value && importBadge}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{opt.sub}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="text-sm" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>← Zurück</button>
              <button onClick={next} disabled={!canProceed()}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: canProceed() ? '#1a1a1a' : '#e5e5e5', color: canProceed() ? '#fff' : '#aaa', cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* ── Schritt: Bezahlen ── */}
        {currentStep === 'payments' && (
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'var(--text-tertiary)' }}>Zahlen</p>
            <h2 className="text-xl font-bold mb-6" style={{ letterSpacing: '-0.02em' }}>
              Willst du mit Bitcoin bezahlen?
            </h2>
            <div className="flex flex-col gap-3 mb-8">
              {[
                { value: true, label: 'Ja', sub: 'Gutscheine, eSIMs, Lightning-Zahlungen' },
                { value: false, label: 'Nein', sub: 'Ich halte Bitcoin nur als Wertanlage' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => update({ payments: opt.value })}
                  className={profile.payments === opt.value ? btnSelected : btnIdle}
                  style={{ textAlign: 'left', background: 'var(--surface)' }}
                >
                  <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{opt.sub}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="text-sm" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>← Zurück</button>
              <button onClick={next} disabled={!canProceed()}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: canProceed() ? '#1a1a1a' : '#e5e5e5', color: canProceed() ? '#fff' : '#aaa', cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* ── Schritt: Kredit ── */}
        {currentStep === 'loan' && (
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'var(--text-tertiary)' }}>Kredit</p>
            <h2 className="text-xl font-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
              Interessiert dich ein Kredit auf deine Bitcoin?
            </h2>
            {isFromRechner && profile.loan !== null && (
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                {profile.loan
                  ? 'Kredit-Interesse aus Freedom-Rechner übernommen (Entnahme-Boost aktiv).'
                  : 'Aus dem Freedom-Rechner importiert — du kannst das hier anpassen.'}
              </p>
            )}
            {!isFromRechner && (
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Bitcoin als Sicherheit hinterlegen, Fiat-Kredit aufnehmen — ohne zu verkaufen.
              </p>
            )}
            <div className="flex flex-col gap-3 mb-8">
              {[
                { value: true, label: 'Ja, interessiert mich', sub: 'Zeig mir Anbieter für Bitcoin-besicherte Kredite' },
                { value: false, label: 'Nein, kein Thema für mich', sub: 'Ich verkaufe lieber oder halte einfach' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => update({ loan: opt.value })}
                  className={profile.loan === opt.value ? btnSelected : btnIdle}
                  style={{ textAlign: 'left', background: 'var(--surface)' }}
                >
                  <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                    {profile.loan === opt.value && importBadge}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{opt.sub}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="text-sm" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>← Zurück</button>
              <button onClick={next} disabled={!canProceed()}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: canProceed() ? '#1a1a1a' : '#e5e5e5', color: canProceed() ? '#fff' : '#aaa', cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
                Ergebnis anzeigen →
              </button>
            </div>
          </div>
        )}

        {/* ── Ergebnis ── */}
        {currentStep === 'result' && (() => {
          const recs = buildRecommendations(profile)
          return (
            <div>
              {/* Freedom-Plan-Banner — nur bei aktiver Rechner-Session */}
              <FreedomPlanBanner profile={profile} isFromRechner={isFromRechner} />

              {/* Pending Questions — nur bei aktiver Rechner-Session */}
              {isFromRechner && <PendingQuestions profile={profile} onAnswer={update} />}

              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                  style={{ background: '#1a1a1a', color: '#fff' }}>✓</div>
                <div>
                  <h2 className="text-xl font-bold" style={{ letterSpacing: '-0.02em', margin: 0 }}>Dein Bitcoin-Setup</h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    {recs.length} Empfehlung{recs.length !== 1 ? 'en' : ''} auf Basis deiner Angaben
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-10">
                {recs.map((rec, i) => (
                  <div key={rec.href}
                    className="flex items-center gap-4 rounded-xl p-4 border"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>{rec.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{rec.desc}</p>
                    </div>
                    <Link
                      href={rec.href.startsWith('/vergleich/') ? rec.href + '?from=setup' : rec.href}
                      className="text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-lg"
                      style={{ border: '1px solid #1a1a1a', color: '#1a1a1a', textDecoration: 'none' }}>
                      {rec.label} →
                    </Link>
                  </div>
                ))}
              </div>

              {/* ── Warenkorb-Badge ── */}
              {cartCount > 0 ? (
                <Link
                  href="/setup/warenkorb"
                  className="flex items-center justify-between rounded-xl p-4 mb-6 border transition-all hover:border-gray-400"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', textDecoration: 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: '#1a1a1a', color: '#fff' }}
                    >
                      {cartCount}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Dein Warenkorb
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {cartCount} Produkt{cartCount !== 1 ? 'e' : ''}
                        {cartOneTime > 0 && ` · ${cartOneTime.toLocaleString('de-DE')} € einmalig`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Ansehen →</span>
                </Link>
              ) : (
                <div
                  className="flex items-center justify-between rounded-xl p-4 mb-6 border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Warenkorb</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Füge Produkte aus dem Vergleich hinzu und rechne die Kosten in deinen Plan ein.
                    </p>
                  </div>
                  <Link
                    href="/vergleich/hardware-wallets"
                    className="text-xs px-3 py-1.5 rounded-lg border flex-shrink-0 ml-3"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    Vergleich →
                  </Link>
                </div>
              )}

              {/* ── Micro-Feedback ── */}
              <div className="mt-2 mb-2 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <WizardFeedback />
              </div>

              <div className="pt-6 border-t flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => {
                    const reset = EMPTY_PROFILE
                    setProfile(reset)
                    saveProfile(reset)
                    setCurrentStep('holdings')
                  }}
                  className="text-sm" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ↺ Neu starten
                </button>
                <button
                  onClick={() => setCurrentStep('holdings')}
                  className="text-sm" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Antworten anpassen →
                </button>
              </div>
            </div>
          )
        })()}

      </main>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupWizard />
    </Suspense>
  )
}
