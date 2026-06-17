import Link from "next/link";

export const metadata = {
  title: "Impressum – Bitcoin Navigator",
  description: "Impressum und Anbieterkennzeichnung für bitcoinnavigator.de.",
};

export default function Impressum() {
  return (
    <div className="min-h-screen px-6 md:px-12 py-16 max-w-2xl">
      <Link
        href="/"
        className="font-mono text-xs mb-12 block hover:opacity-70 transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        ← Zurück
      </Link>
      <h1 className="text-4xl font-bold mb-10">Impressum</h1>

      <div className="space-y-8" style={{ color: "var(--text-secondary)" }}>
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
            Angaben gemäß § 5 TMG
          </h2>
          <p className="leading-relaxed">
            Christian Klingler<br />
            Im Brühl 43<br />
            70734 Fellbach<br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
            Kontakt
          </h2>
          <p>
            E-Mail:{" "}
            <a
              href="mailto:christian-klingler@gmx.net"
              className="hover:opacity-70 transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              christian-klingler@gmx.net
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
            Gewerbliche Tätigkeit
          </h2>
          <p className="leading-relaxed text-sm">
            Dieses Angebot wird privat betrieben. Es besteht derzeit kein
            eingetragenes Gewerbe. Umsatzsteuerliche Registrierung erfolgt
            bei Aufnahme einer gewerblichen Tätigkeit.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
            Affiliate-Hinweis
          </h2>
          <p className="leading-relaxed text-sm">
            Diese Website enthält Affiliate-Links. Wenn du über einen solchen
            Link einen Kauf tätigst oder dich registrierst, erhalten wir
            gegebenenfalls eine Provision – ohne Mehrkosten für dich.
            Alle Affiliate-Links sind auf dieser Website transparent gekennzeichnet.
            Die redaktionelle Unabhängigkeit bleibt davon unberührt.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
            Haftungsausschluss & Risikohinweis
          </h2>

          <div className="rounded-xl border p-4 mb-5 text-sm leading-relaxed"
            style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }}>
            <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Kein Ersatz für professionelle Finanzberatung
            </p>
            <p>
              Bitcoin Navigator ist ein kostenloses Informations- und Planungsangebot.
              Alle Vergleiche, Rechner und Inhalte dieser Website dienen
              ausschließlich allgemeinen Informationszwecken und stellen in
              keiner Weise eine Anlageberatung, Vermögensberatung,
              Finanzportfolioverwaltung oder individuelle Empfehlung im Sinne
              des Wertpapierhandelsgesetzes (WpHG) oder der europäischen
              MiFID-II-Richtlinie dar.
            </p>
          </div>

          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Keine Finanzberatung: </span>
              Der Betreiber dieser Website erbringt keine erlaubnispflichtigen
              Finanzdienstleistungen im Sinne des § 32 KWG oder § 15 WpIG und
              untersteht keiner Aufsicht durch die Bundesanstalt für
              Finanzdienstleistungsaufsicht (BaFin). Die Inhalte dieser Website
              empfehlen weder den Kauf noch den Verkauf von Bitcoin oder anderen
              Vermögenswerten.
            </p>

            <p>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Risikohinweis: </span>
              Bitcoin ist eine hochvolatile Anlageklasse. Die auf dieser Website
              dargestellten Preisprognosen und Rechenergebnisse basieren auf
              mathematischen Modellen (u. a. dem Bitcoin Power Law) sowie
              historischen Marktdaten. Modellbasierte Projektionen sind keine
              Garantie für zukünftige Kursentwicklungen – tatsächliche Ergebnisse
              können erheblich abweichen. Ein Totalverlust des eingesetzten
              Kapitals ist möglich.
            </p>

            <p>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Haftung: </span>
              Der Betreiber übernimmt keinerlei Haftung für Entscheidungen, die
              auf Grundlage der hier bereitgestellten Informationen oder
              Berechnungen getroffen werden. Alle Angaben zu Gebühren, Preisen
              und Konditionen wurden sorgfältig recherchiert, können sich jedoch
              ohne Vorankündigung ändern. Die Nutzung dieser Website und ihrer
              Rechner erfolgt auf eigene Verantwortung. Bei konkreten Anlage-
              oder Steuerfragen wende dich bitte an einen zugelassenen Finanz-
              oder Steuerberater.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
