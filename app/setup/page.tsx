'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import {
  SetupProfile,
  EMPTY_PROFILE,
  loadProfile,
  saveProfile,
  mergeFromUrlParams,
} from '@/lib/setupProfile'

// ── Schritte ────────────────────────────────────────────────────
type Step = 'holdings' | 'savings' | 'custody' | 'seed' | 'payments' | 'loan' | 'result'

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

  if (profile.savingsPlan === 'monthly' || profile.savingsPlan === 'irregular' || profile.btcHoldings === 'none') {
    recs.push({
      title: 'Börse für Bitcoin-Kauf',
      desc: profile.calculatorData.dca
        ? `Dein Sparplan: ${profile.calculatorData.dca.monthlyAmount} €/Monat über ${profile.calculatorData.dca.years} Jahre`
        : 'Günstige Gebühren, Sparplanfunktion, KYC-Level im Vergleich',
      href: '/vergleich/boersen',
      label: 'Börsen vergleichen',
    })
  }

  if (profile.custody === 'hardware' || profile.custody === 'unsure') {
    recs.push({
      title: 'Hardware Wallet',
      desc: 'Open Source, Secure Element & UX — 12 Modelle verglichen',
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
      desc: 'Fiat leihen ohne zu verkaufen — Non-Custodial & MiCA-reguliert',
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

// ── Haupt-Komponente ─────────────────────────────────────────────
export default function SetupPage() {
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<SetupProfile>(EMPTY_PROFILE)
  const [currentStep, setCurrentStep] = useState<Step>('holdings')

  useEffect(() => {
    let loaded = loadProfile()
    if (searchParams.toString()) {
      loaded = mergeFromUrlParams(loaded, searchParams)
    }
    setProfile(loaded)
  }, [searchParams])

  const steps = getSteps(profile)
  const stepIndex = steps.indexOf(currentStep)
  const totalSteps = steps.length - 1 // ohne 'result'
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
            <h2 className="text-xl font-bold mb-6" style={{ letterSpacing: '-0.02em' }}>
              Wie viel Bitcoin hast du aktuell?
            </h2>
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
                  <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
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
            <h2 className="text-xl font-bold mb-6" style={{ letterSpacing: '-0.02em' }}>
              Willst du regelmäßig Bitcoin kaufen?
            </h2>
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

        {/* ── Schritt 3: Verwahrung ── */}
        {currentStep === 'custody' && (
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'var(--text-tertiary)' }}>Verwahrung</p>
            <h2 className="text-xl font-bold mb-6" style={{ letterSpacing: '-0.02em' }}>
              Wie willst du deine Bitcoin verwahren?
            </h2>
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

        {/* ── Schritt 4: Seed-Backup (konditionell) ── */}
        {currentStep === 'seed' && (
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'var(--text-tertiary)' }}>Sicherung</p>
            <h2 className="text-xl font-bold mb-6" style={{ letterSpacing: '-0.02em' }}>
              Wie willst du deine Seed Phrase sichern?
            </h2>
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
            <h2 className="text-xl font-bold mb-6" style={{ letterSpacing: '-0.02em' }}>
              Interessiert dich ein Kredit auf deine Bitcoin?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Bitcoin als Sicherheit hinterlegen, Fiat-Kredit aufnehmen — ohne zu verkaufen.
            </p>
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
                    <Link href={rec.href}
                      className="text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-lg"
                      style={{ border: '1px solid #1a1a1a', color: '#1a1a1a', textDecoration: 'none' }}>
                      {rec.label} →
                    </Link>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => {
                    setProfile(EMPTY_PROFILE)
                    saveProfile(EMPTY_PROFILE)
                    setCurrentStep('holdings')
                  }}
                  className="text-sm" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ↺ Neu starten
                </button>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Dein Setup wird lokal gespeichert
                </p>
              </div>
            </div>
          )
        })()}

      </main>
    </div>
  )
}
