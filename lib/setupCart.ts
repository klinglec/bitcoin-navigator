/**
 * SetupCart — Warenkorb für Bitcoin-Produkte
 *
 * Speichert ausgewählte Produkte aus den Vergleichsseiten.
 * Max. 1 Produkt pro Kategorie (replace-Logik).
 * Einmalkosten → Sonderausgabe Monat 1 im Freedom-Rechner.
 * Laufende Gebühren (%) → reduzieren effektive Sparrate.
 */

export type CartCategory = 'boersen' | 'hardware-wallets' | 'seed-backup'

export interface CartItem {
  productId:         string
  productSlug:       string
  productName:       string
  category:          CartCategory
  oneTimeCost:       number | null   // EUR — Hardware Wallets, Seed-Backup
  feePercent:        number | null   // % der Sparrate — Börsen
  affiliateUrl:      string | null
  promoCode:         string | null
  promoCodeBenefit:  string | null
  productPageUrl:    string          // /anbieter/{slug}
}

export interface SetupCart {
  items:     CartItem[]
  sparrate:  number | null   // aus Freedom-Rechner, für Gebührenberechnung
  currency:  string
}

export interface CartTotals {
  totalOneTime:    number          // Σ oneTimeCost
  totalFeePercent: number          // Σ feePercent
  monthlyFeeEur:   number | null   // totalFeePercent * sparrate / 100, null wenn sparrate unbekannt
}

const STORAGE_KEY  = 'btcnav_setup_cart'
const CART_TTL_MS  = 30 * 24 * 60 * 60 * 1000  // 30 Tage

export const EMPTY_CART: SetupCart = {
  items:    [],
  sparrate: null,
  currency: 'EUR',
}

// ── Persistence ────────────────────────────────────────────────

export function loadCart(): SetupCart {
  if (typeof window === 'undefined') return EMPTY_CART
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_CART
    const parsed = JSON.parse(raw)
    // Legacy-Format (kein savedAt) → direkt verwenden, beim nächsten Save wird Timestamp ergänzt
    if (!parsed.savedAt) return { ...EMPTY_CART, ...parsed }
    // TTL prüfen
    if (Date.now() - parsed.savedAt > CART_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return EMPTY_CART
    }
    return { ...EMPTY_CART, ...parsed.data }
  } catch {
    return EMPTY_CART
  }
}

export function saveCart(cart: SetupCart): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: cart, savedAt: Date.now() }))
  window.dispatchEvent(new CustomEvent('btcnav:cart', { detail: cart }))
}

// ── Mutations ──────────────────────────────────────────────────

/**
 * Fügt ein Produkt hinzu. Ersetzt ggf. ein vorhandenes Produkt
 * der gleichen Kategorie (max. 1 pro Kategorie).
 */
export function addToCart(item: CartItem): SetupCart {
  const cart = loadCart()
  const items = cart.items.filter(i => i.category !== item.category)
  const updated: SetupCart = { ...cart, items: [...items, item] }
  saveCart(updated)
  return updated
}

export function removeFromCart(category: CartCategory): SetupCart {
  const cart = loadCart()
  const updated: SetupCart = { ...cart, items: cart.items.filter(i => i.category !== category) }
  saveCart(updated)
  return updated
}

export function clearCart(): SetupCart {
  saveCart(EMPTY_CART)
  return EMPTY_CART
}

/** Speichert die Sparrate aus dem Freedom-Rechner für die Gebührenberechnung */
export function setSparrate(sparrate: number, currency: string): void {
  const cart = loadCart()
  saveCart({ ...cart, sparrate, currency })
}

// ── Queries ────────────────────────────────────────────────────

export function getCartItem(category: CartCategory): CartItem | undefined {
  return loadCart().items.find(i => i.category === category)
}

export function isInCart(category: CartCategory, productId?: string): boolean {
  const item = getCartItem(category)
  if (!item) return false
  if (productId !== undefined) return item.productId === productId
  return true
}

export function computeTotals(cart: SetupCart): CartTotals {
  const totalOneTime    = cart.items.reduce((s, i) => s + (i.oneTimeCost ?? 0), 0)
  const totalFeePercent = cart.items.reduce((s, i) => s + (i.feePercent ?? 0), 0)
  const monthlyFeeEur   = cart.sparrate !== null
    ? (totalFeePercent * cart.sparrate) / 100
    : null
  return { totalOneTime, totalFeePercent, monthlyFeeEur }
}

// ── Helpers ────────────────────────────────────────────────────

export const CART_CATEGORIES: CartCategory[] = ['hardware-wallets', 'seed-backup', 'boersen']

export const CATEGORY_LABELS: Record<CartCategory, string> = {
  'hardware-wallets': 'Hardware Wallet',
  'seed-backup':      'Seed-Backup',
  'boersen':          'Börse',
}
