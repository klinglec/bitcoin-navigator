'use client'

import { useEffect, useState } from 'react'

const NPUB = 'npub1j0xv44h4zayq2p347srmawzum05qn3rme4wmyzv89qfgnyxafryq9p8xmv'
const NOSTR_HEX = '930d552be8a9200a158be86f6ee82bcde5018d1b9ab76e84260281349374c9'  // decoded
const RELAY = 'wss://relay.damus.io'

interface NostrProfile {
  picture?: string
  display_name?: string
  name?: string
  about?: string
}

function NostrCard() {
  const [profile, setProfile] = useState<NostrProfile | null>(null)

  useEffect(() => {
    let ws: WebSocket
    let done = false
    try {
      ws = new WebSocket(RELAY)
      ws.onopen = () => {
        ws.send(JSON.stringify(['REQ', 'profile-1', { kinds: [0], authors: [NOSTR_HEX], limit: 1 }]))
      }
      ws.onmessage = (e) => {
        if (done) return
        try {
          const msg = JSON.parse(e.data)
          if (msg[0] === 'EVENT' && msg[2]?.kind === 0) {
            const content: NostrProfile = JSON.parse(msg[2].content)
            setProfile(content)
            done = true
            ws.close()
          }
        } catch {}
      }
      ws.onerror = () => {}
    } catch {}
    return () => { try { ws?.close() } catch {} }
  }, [])

  return (
    <a
      href={`https://njump.me/${NPUB}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border overflow-hidden transition-all hover:shadow-md hover:border-gray-300"
      style={{ background: '#ffffff', borderColor: '#e0ddd8', textDecoration: 'none' }}
    >
      {/* Header-Streifen */}
      <div className="h-14 w-full" style={{ background: 'linear-gradient(135deg, #7B0D8E 0%, #4A0BE0 100%)' }} />

      <div className="px-5 pb-5">
        {/* Avatar */}
        <div className="relative -mt-7 mb-3">
          {profile?.picture ? (
            <img
              src={profile.picture}
              alt={profile.display_name || 'Nostr Profil'}
              className="w-14 h-14 rounded-full border-2 object-cover"
              style={{ borderColor: '#ffffff', background: '#e0ddd8' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl font-bold"
              style={{ borderColor: '#ffffff', background: '#7B0D8E', color: '#ffffff' }}
            >
              ₿
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: '#1a1a1a' }}>
              {profile?.display_name || profile?.name || 'Christian'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#999999' }}>
              Nostr · {NPUB.slice(0, 12)}…
            </p>
          </div>
          {/* Nostr-Logo */}
          <svg width="20" height="20" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="256" height="256" rx="48" fill="#7B0D8E"/>
            <path d="M72 184V72l112 112V72" stroke="white" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {profile?.about && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#666666' }}>
            {profile.about}
          </p>
        )}
      </div>
    </a>
  )
}

function InstagramCard() {
  return (
    <a
      href="https://www.instagram.com/chris.bitcoinnavigator/"
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border overflow-hidden transition-all hover:shadow-md hover:border-gray-300"
      style={{ background: '#ffffff', borderColor: '#e0ddd8', textDecoration: 'none' }}
    >
      {/* Instagram Gradient Header */}
      <div
        className="h-14 w-full"
        style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
      />

      <div className="px-5 pb-5">
        {/* Avatar Placeholder mit IG-Initials */}
        <div className="relative -mt-7 mb-3">
          <div
            className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-bold"
            style={{ borderColor: '#ffffff', background: 'linear-gradient(45deg, #f09433, #bc1888)', color: '#ffffff' }}
          >
            CK
          </div>
        </div>

        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: '#1a1a1a' }}>
              chris.bitcoinnavigator
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#999999' }}>
              Instagram · Bitcoin Navigator
            </p>
          </div>
          {/* Instagram-Logo */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="url(#ig-grad)"/>
            <defs>
              <linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0">
                <stop offset="0%" stopColor="#f09433"/>
                <stop offset="50%" stopColor="#dc2743"/>
                <stop offset="100%" stopColor="#bc1888"/>
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="12" height="12" rx="3.5" stroke="white" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5"/>
            <circle cx="16" cy="8" r="0.75" fill="white"/>
          </svg>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: '#666666' }}>
          Reels &amp; Stories rund um Bitcoin, Selbstverwahrung und den DACH-Raum.
        </p>
      </div>
    </a>
  )
}

export default function SocialCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <NostrCard />
      <InstagramCard />
    </div>
  )
}
