// NIP-07 Browser Extension – window.nostr Typ-Deklaration

declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signEvent(event: Record<string, any>): Promise<Record<string, any>>
      getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>
      nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>
        decrypt(pubkey: string, ciphertext: string): Promise<string>
      }
    }
  }
}

export {}
