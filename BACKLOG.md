# Bitcoin Navigator – Backlog

---

## Kategorie: Bitcoin-Heizungen (`/vergleich/bitcoin-heizungen`)

Vergleich von Bitcoin-Heizgeräten (Miner-as-Heater) für den Heimbereich.

**Anbieter-Fokus:** 21energy (Hauptanbieter DACH), weitere Hersteller sobald verfügbar

**Vergleichskriterien:**
- Heizleistung (kW) vs. Mining-Leistung (TH/s)
- Stromverbrauch (W) und Effizienz (J/TH)
- Lautstärke (dB) — wichtig für Wohnbereich
- Anschaffungskosten & Break-even-Kalkulation
- Kompatibilität: Warmwasser, Raumheizung, Pool
- Selbstverwaltung vs. Managed-Service

**Verlinkt auf:** PV-Mining-Rechner (siehe unten)

---

## Rechner: PV-Mining-Kalkulator (`/rechner/pv-mining`)

Kalkulation für PV-Besitzer: Überschussstrom mit Bitcoin-Minern nutzen statt einspeisen.

### Kernlogik
Vergleich: Einspeisung (€/kWh Vergütung) vs. Mining (BTC-Ertrag × Kurs, Power Law projiziert)

**Eingaben:**
- PV-Anlagenleistung (kWp) und Überschuss-kWh/Jahr
- Einspeisevergütung (€/kWh, regional eingebbar)
- Miner-Auswahl: vordefinierte Profile oder benutzerdefiniert
- Anschaffungskosten Miner (€)

**Ausgaben:**
- BTC-Ertrag/Jahr bei aktuellem Difficulty-Stand
- EUR-Wert bei aktuellem Kurs und Power Law Projektion (1 / 5 / 10 Jahre)
- Break-even Miner-Anschaffung in Monaten
- Direktvergleich Mining vs. Einspeisung über die Laufzeit
- Empfehlung: Lohnt sich Mining bei dieser PV-Anlage?

**Vordefinierte Miner-Profile (keine externe API):**
- 21energy Heizung (3,5 TH/s, ~3500W Heizleistung)
- Antminer S19 (95 TH/s, 3250W)
- Bitaxe / Hobby-Miner (< 1 TH/s, < 15W)
- Benutzerdefiniert

**Power Law Integration:** Mining-Erträge × Power Law Preis über Laufzeit (wie DCA-Rechner)

**Verlinkt auf:** `/vergleich/bitcoin-heizungen`, `/vergleich/btc-kredite` (Miner-Finanzierung)

---

## Rechner (fehlende Features)

Die folgenden Rechner sind konzipiert und in der Übersicht beschrieben, aber noch nicht implementiert.
Sie wurden aus der Rechner-Übersicht (`/rechner`) entfernt bis die jeweilige Seite fertig ist.

### Altersvorsorge-Vergleich
- Route: `/rechner/altersvorsorge-vergleich`
- Subtitle: Bitcoin vs. ETF vs. Riester vs. bAV
- Beschreibung: Bitcoin DCA gegen ETF, Riester-Rente, betriebliche Altersvorsorge, Immobilie und Gold – gleiche Sparrate, gleicher Zeitraum.

### Fair Price
- Route: `/rechner/fair-price`
- Subtitle: Power Law · Datumsrechner · Zielpreis
- Beschreibung: Ist Bitcoin gerade günstig oder teuer? Der Power Law Fair Value für jedes Datum – und wann ein Zielpreis laut Modell erreicht wird.

### Buy. Borrow. Die.
- Route: `/rechner/buy-borrow-die`
- Subtitle: Kein Verkauf · Kredit · Steuerfrei
- Beschreibung: Bitcoin als Sicherheit hinterlegen, Kredit aufnehmen und steuerfrei davon leben – ohne einen Satoshi zu verkaufen.

---

## ⭐ HÖCHSTE PRIORITÄT: Bitcoin-Kredit-Rechner (`/rechner/kredit`)

Erweiterung des Freedom-Rechners um Bitcoin-besicherte Kredit-Szenarien auf Basis des Power Law Modells.

### Zwei Kernszenarien

**Szenario A — "Buy. Borrow. Live." (Entsparen ohne Verkauf)**
- Nutzer hält seinen BTC-Stack und nimmt regelmäßig Kredit darauf auf statt zu verkaufen
- Eingaben: BTC-Stack, Ziel-Monatseinkommen (Fiat), LTV-Ratio (z.B. 30–50%), Kreditzins, Laufzeit
- Ausgabe: Wie groß muss der Stack sein um X €/Monat per Kredit zu leben — im Vergleich zum Freedom-Rechner (ohne Kredit). Thesis: kleinerer Stack ausreichend, da kein Verkauf nötig
- Risiko-Anzeige: Liquidationsgrenze bei welchem BTC-Preis wird Kredit fällig

**Szenario B — "Stack Accumulation" (Leverage Stacking)**
- Nutzer beleiht seinen BTC-Stack und kauft mit dem Fiat-Kredit weitere BTC
- Eingaben: Startstack, LTV-Ratio, Anzahl Leverage-Zyklen, Haltezeit, Power Law Preismodell
- Ausgabe: Endstack nach N Jahren vs. ohne Leverage; Break-even-Analyse; Liquidationsrisiko
- Wichtig: Zinskosten müssen gegen BTC-Preisentwicklung (Power Law) gegengerechnet werden

### Technische Anforderungen
- Power Law Preismodell als Basis (wie in DCA & Freedom Rechner) — Fair Value, konservativ, bullish
- LTV-Szenarien: 25% / 33% / 50% (je nach Anbieter — Ledn, Lend & Borrow etc.)
- Zinssätze: variabel je nach Anbieter, eingabe-fähig
- Liquidationsgrenze berechnen und visuell markieren (roter Bereich im Chart)
- Vergleichsansicht: mit Kredit vs. ohne Kredit (Freedom-Rechner-Baseline)
- Währungen: EUR, CHF, USD

### UI-Konzept
- Tab-Switcher: "Szenario A — Leben vom Kredit" | "Szenario B — Stack aufbauen"
- Chart: Power Law Preisentwicklung + Kreditlinie + Liquidationsgrenze
- Kennzahlen-Cards: Endstack, Gesamtzinslast, Vorteil vs. Baseline, Liquidationsrisiko
- Hinweis: Verlinkt auf `/vergleich/btc-kredite` für passende Anbieter
- Integrierbar in `SetupProfile.calculatorData` (Phase 2 Setup-Integration)

### Abgrenzung zum Freedom-Rechner
- Freedom-Rechner: Wie viel BTC brauche ich um finanziell frei zu sein (durch Verkauf)?
- Kredit-Rechner: Wie viel BTC brauche ich um finanziell frei zu sein (ohne Verkauf, durch Beleihung)?
- → Beide Rechner sollten am Ende eine Vergleichszeile zeigen können

---

## Mein Bitcoin-Setup — Phase 2 (Rechner-Integration)

Die Datenstruktur in `lib/setupProfile.ts` ist bereits für die bidirektionale Integration vorbereitet.

**Rechner → Setup** (URL-Params, bereits implementiert in `mergeFromUrlParams`):
- DCA-Rechner → `/setup?dca_amount=200&dca_years=10&dca_btc=0.63`
- Entnahmeplan → `/setup?entnahme_stack=0.5&entnahme_monthly=1500&entnahme_years=20`
- Freedom-Rechner → `/setup?freedom_amount=300&freedom_btc=1&freedom_years=8`

**Setup → Rechner** (noch nicht gebaut):
- Wenn `savingsPlan = monthly` und `calculatorData.dca.monthlyAmount` vorhanden → Link zu `/rechner/dca?monthly=200` vorausfüllen
- Auf Ergebnis-Screen: "Plan berechnen" Button neben Börsen-Empfehlung

**TODO für Phase 2:**
1. Auf jeder Rechnerseite einen "In Setup übernehmen"-Button hinzufügen
2. Ergebnis-Screen: wenn Rechner-Daten vorhanden, diese anzeigen (z.B. "Dein Sparplan: 200 €/Monat, 10 Jahre → 0.63 BTC")
3. Steuersoftware-Kategorie einbauen sobald verfügbar

---

## Aktiv (live)

| Rechner | Route |
|---|---|
| Sparplan-Rechner | `/rechner/dca` |
| Entnahmeplan | `/rechner/entnahme` |
| Freedom-Rechner | `/rechner/freedom` |
