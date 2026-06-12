'use client'

// Nostr-Auth Helpers – nur im Browser verwenden
// NIP-07: Browser Extension (window.nostr)
// NIP-46: Remote Signing via Relay (Bunker / Amber)

// Alle nostr-tools Imports sind dynamisch (werden zur Laufzeit geladen)
// → kein statischer Import nötig, TypeScript-Fehler bis npm install erwartet

// ── Typen ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NostrEvent = Record<string, any>

export interface NostrAuthResult {
  pubkeyHex: string
  signedEvent: NostrEvent
}

// ── Challenge Event (NIP-98, kind 27235) ──────────────────────
// Kurze Gültigkeitsdauer (60s) schützt vor Replay-Angriffen

export function createChallengeEvent(pubkey: string): NostrEvent {
  return {
    kind: 27235,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', `${window.location.origin}/api/auth/nostr`],
      ['method', 'POST'],
    ],
    content: '',
  }
}

// ── NIP-07: Browser Extension ─────────────────────────────────

export function hasNostrExtension(): boolean {
  return typeof window !== 'undefined' && typeof window.nostr !== 'undefined'
}

export async function signWithExtension(): Promise<NostrAuthResult | null> {
  if (!hasNostrExtension()) return null
  try {
    const pubkeyHex = await window.nostr!.getPublicKey()
    const challenge = createChallengeEvent(pubkeyHex)
    const signedEvent = await window.nostr!.signEvent(challenge)
    return { pubkeyHex, signedEvent }
  } catch (err) {
    console.error('NIP-07 Fehler:', err)
    return null
  }
}

// ── NIP-46: Bunker (Remote Signing) ──────────────────────────
// Unterstützt bunker:// URLs von Amber, nsec.app, Alby Hub

export interface BunkerPointer {
  remotePubkeyHex: string
  relayUrl: string
  secret?: string
}

export function parseBunkerUrl(url: string): BunkerPointer | null {
  try {
    const clean = url.trim()
    if (!clean.startsWith('bunker://')) return null
    // bunker://remotePubkey?relay=wss://...&secret=...
    const withHttp = clean.replace('bunker://', 'https://')
    const parsed = new URL(withHttp)
    const remotePubkeyHex = parsed.hostname
    const relayUrl = parsed.searchParams.get('relay')
    if (!remotePubkeyHex || !relayUrl) return null
    return {
      remotePubkeyHex,
      relayUrl,
      secret: parsed.searchParams.get('secret') ?? undefined,
    }
  } catch {
    return null
  }
}

// NIP-46 Connect via Relay
// Gibt signiertes Challenge-Event zurück, das dann an die API gesendet wird.

export async function signWithBunker(
  pointer: BunkerPointer,
  onStatus: (msg: string) => void
): Promise<NostrAuthResult | null> {
  try {
    onStatus('Verbinde mit Relay…')

    // Dynamischer Import – nur im Browser, vermeidet SSR-Probleme
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { generateSecretKey, getPublicKey, finalizeEvent, nip04 } =
      // @ts-ignore – nostr-tools wird via npm install hinzugefügt
      await import('nostr-tools')

    const localSecretKey = generateSecretKey()
    const localPubkeyHex = getPublicKey(localSecretKey)
    const localSecretHex = Buffer.from(localSecretKey).toString('hex')

    const ws = new WebSocket(pointer.relayUrl)

    return new Promise((resolve, reject) => {
      const TIMEOUT_MS = 90_000
      let connectId = crypto.randomUUID()
      let signId = ''
      let remotePubkeyConfirmed = ''
      let phase: 'connect' | 'sign' = 'connect'

      const timer = setTimeout(() => {
        ws.close()
        reject(new Error('Timeout – keine Antwort vom Signer'))
      }, TIMEOUT_MS)

      function cleanup() {
        clearTimeout(timer)
        ws.close()
      }

      ws.onopen = async () => {
        onStatus('Verbunden. Sende Verbindungsanfrage…')

        // REQ subscription: warte auf Antworten vom remote Pubkey an uns
        ws.send(JSON.stringify([
          'REQ', 'sub1',
          { kinds: [24133], '#p': [localPubkeyHex], authors: [pointer.remotePubkeyHex], limit: 5 },
        ]))

        // connect-Request verschlüsselt an remote Pubkey schicken
        const connectReq = JSON.stringify({
          id: connectId,
          method: 'connect',
          params: [localPubkeyHex, pointer.secret ?? '', 'sign_event'],
        })
        const encrypted = await nip04.encrypt(localSecretHex, pointer.remotePubkeyHex, connectReq)
        const connectEvent = finalizeEvent({
          kind: 24133,
          created_at: Math.floor(Date.now() / 1000),
          tags: [['p', pointer.remotePubkeyHex]],
          content: encrypted,
        }, localSecretKey)
        ws.send(JSON.stringify(['EVENT', connectEvent]))
      }

      ws.onmessage = async (msg) => {
        try {
          const data = JSON.parse(msg.data as string)
          if (data[0] !== 'EVENT') return
          const event: NostrEvent = data[2]
          if (event.kind !== 24133 || event.pubkey !== pointer.remotePubkeyHex) return

          const decrypted = await nip04.decrypt(localSecretHex, pointer.remotePubkeyHex, event.content)
          const response = JSON.parse(decrypted)

          if (phase === 'connect' && response.id === connectId) {
            if (response.error) { cleanup(); reject(new Error(response.error)); return }
            if (response.result !== 'ack') { cleanup(); reject(new Error('Connect abgelehnt')); return }

            remotePubkeyConfirmed = pointer.remotePubkeyHex
            phase = 'sign'
            onStatus('Verbunden! Fordere Signatur an…')

            // Challenge-Event beim remote Signer signieren lassen
            const challengeUnsigned = createChallengeEvent(remotePubkeyConfirmed)
            signId = crypto.randomUUID()
            const signReq = JSON.stringify({
              id: signId,
              method: 'sign_event',
              params: [JSON.stringify(challengeUnsigned)],
            })
            const encryptedSign = await nip04.encrypt(localSecretHex, remotePubkeyConfirmed, signReq)
            const signEvent = finalizeEvent({
              kind: 24133,
              created_at: Math.floor(Date.now() / 1000),
              tags: [['p', remotePubkeyConfirmed]],
              content: encryptedSign,
            }, localSecretKey)
            ws.send(JSON.stringify(['EVENT', signEvent]))

          } else if (phase === 'sign' && response.id === signId) {
            if (response.error) { cleanup(); reject(new Error(response.error)); return }
            const signedEvent: NostrEvent = JSON.parse(response.result)
            cleanup()
            resolve({ pubkeyHex: remotePubkeyConfirmed, signedEvent })
          }
        } catch (err) {
          cleanup()
          reject(err)
        }
      }

      ws.onerror = () => { cleanup(); reject(new Error('WebSocket-Fehler')) }
    })
  } catch (err) {
    console.error('NIP-46 Fehler:', err)
    return null
  }
}

// ── nostrconnect:// für Amber Deep Link ───────────────────────

// Relays in Prioritätsreihenfolge – erster wird im QR-Code verwendet,
// alle werden gleichzeitig abgehört (höhere Erfolgswahrscheinlichkeit)
const NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
]

export async function generateAmberConnectUrl(
  relayUrl = NOSTR_RELAYS[0]
): Promise<{ connectUrl: string; waitForConnection: (onStatus: (m: string) => void) => Promise<NostrAuthResult | null> }> {
  // @ts-ignore – nostr-tools wird via npm install hinzugefügt
  const { generateSecretKey, getPublicKey, finalizeEvent, nip04 } = await import('nostr-tools')

  const localSecretKey = generateSecretKey()
  const localPubkeyHex = getPublicKey(localSecretKey)
  const localSecretHex = Buffer.from(localSecretKey).toString('hex')

  const metadata = encodeURIComponent(JSON.stringify({
    name: 'Bitcoin Navigator',
    url: 'https://bitcoinnavigator.de',
    description: 'Bitcoin Vergleichsportal für DACH',
  }))

  // Alle Relays im QR-Code angeben – Signer verbindet sich mit dem,
  // das er kennt (Primal nutzt relay.primal.net und relay.damus.io)
  const relayParams = NOSTR_RELAYS.map(r => `relay=${encodeURIComponent(r)}`).join('&')
  const connectUrl = `nostrconnect://${localPubkeyHex}?${relayParams}&metadata=${metadata}`

  return {
    connectUrl,
    waitForConnection: (onStatus) =>
      new Promise((resolve, reject) => {
        const TIMEOUT_MS = 120_000
        // Alle Relays gleichzeitig abhören – höhere Erfolgsrate
        const sockets = NOSTR_RELAYS.map(r => new WebSocket(r))
        let resolved = false

        const timer = setTimeout(() => {
          cleanup()
          reject(new Error('Timeout – keine Antwort vom Signer'))
        }, TIMEOUT_MS)

        function cleanup() {
          clearTimeout(timer)
          sockets.forEach(s => { try { s.close() } catch {} })
        }

        let signId = ''
        let remotePubkey = ''
        let phase: 'connect' | 'sign' = 'connect'

        const sinceTs = Math.floor(Date.now() / 1000) - 30

        function handleSocket(ws: WebSocket, isPrimalRelay: boolean) {
          ws.onopen = () => {
            onStatus('Verbunden. Warte auf Signer…')
            // Haupt-Subscription: gefiltert auf unseren Pubkey
            ws.send(JSON.stringify([
              'REQ', 'sub1',
              { kinds: [24133], '#p': [localPubkeyHex], since: sinceTs },
            ]))
            // Auf relay.primal.net: zweite Subscription ohne #p-Filter
            // → fängt auf, falls Primal das Tag anders setzt
            if (isPrimalRelay) {
              ws.send(JSON.stringify([
                'REQ', 'sub2',
                { kinds: [24133], since: sinceTs, limit: 0 },
              ]))
            }
          }

          ws.onmessage = async (msg) => {
            if (resolved) return
            try {
              const data = JSON.parse(msg.data as string)
              if (data[0] !== 'EVENT') return
              const event: NostrEvent = data[2]
              if (event.kind !== 24133) return
              // Nur Events verarbeiten die an uns adressiert sind ODER von sub2 kommen
              const pTags: string[] = (event.tags ?? [])
                .filter((t: string[]) => t[0] === 'p')
                .map((t: string[]) => t[1])
              const isAddressedToUs = pTags.includes(localPubkeyHex)
              const isFromSub2 = data[1] === 'sub2'
              if (!isAddressedToUs && !isFromSub2) return

              // NIP-04 versuchen, bei Fehler NIP-44
              let decrypted: string
              try {
                decrypted = await nip04.decrypt(localSecretHex, event.pubkey, event.content)
              } catch {
                const { nip44 } = await import('nostr-tools')
                const convKey = nip44.getConversationKey(localSecretKey, event.pubkey)
                decrypted = nip44.decrypt(event.content, convKey)
              }
              const parsed = JSON.parse(decrypted)

              if (phase === 'connect' && parsed.method === 'connect') {
                remotePubkey = event.pubkey
                onStatus('Verbunden! Fordere Signatur an…')

                // Ack zurückschicken
                const ackReq = JSON.stringify({ id: parsed.id, result: 'ack', error: '' })
                const encAck = await nip04.encrypt(localSecretHex, remotePubkey, ackReq)
                const ackEvent = finalizeEvent({
                  kind: 24133,
                  created_at: Math.floor(Date.now() / 1000),
                  tags: [['p', remotePubkey]],
                  content: encAck,
                }, localSecretKey)
                // Ack auf allen Relays publishen
                sockets.forEach(s => { if (s.readyState === WebSocket.OPEN) s.send(JSON.stringify(['EVENT', ackEvent])) })

                // Challenge signieren lassen
                phase = 'sign'
                signId = crypto.randomUUID()
                const challenge = createChallengeEvent(remotePubkey)
                const signReq = JSON.stringify({ id: signId, method: 'sign_event', params: [JSON.stringify(challenge)] })
                const encSign = await nip04.encrypt(localSecretHex, remotePubkey, signReq)
                const signEv = finalizeEvent({
                  kind: 24133,
                  created_at: Math.floor(Date.now() / 1000),
                  tags: [['p', remotePubkey]],
                  content: encSign,
                }, localSecretKey)
                sockets.forEach(s => { if (s.readyState === WebSocket.OPEN) s.send(JSON.stringify(['EVENT', signEv])) })

              } else if (phase === 'sign' && parsed.id === signId) {
                if (parsed.error) { cleanup(); reject(new Error(parsed.error)); return }
                resolved = true
                const signedEvent: NostrEvent = JSON.parse(parsed.result)
                cleanup()
                resolve({ pubkeyHex: remotePubkey, signedEvent })
              }
            } catch (err) { if (!resolved) { cleanup(); reject(err) } }
          }

          ws.onerror = () => { /* anderer Socket übernimmt ggf. */ }
        }

        sockets.forEach((ws, i) => handleSocket(ws, NOSTR_RELAYS[i] === 'wss://relay.primal.net'))
      }),
  }
}

// ── Zum Server senden ─────────────────────────────────────────

export async function authenticateWithServer(
  result: NostrAuthResult
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const res = await fetch('/api/auth/nostr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: result.signedEvent }),
  })
  if (!res.ok) return null
  return res.json()
}
