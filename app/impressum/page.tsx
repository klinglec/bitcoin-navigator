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
        className="font-mono text-xs mb-12 block hover:text-white transition-colors"
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
            Scillawaldstr. 79<br />
            70378 Stuttgart<br />
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
              className="hover:text-white transition-colors"
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
            Haftungsausschluss
          </h2>
          <p className="leading-relaxed text-sm">
            Alle Angaben zu Gebühren, Preisen und Konditionen wurden sorgfältig
            recherchiert und werden regelmäßig aktualisiert. Dennoch können sich
            Angebote ohne vorherige Ankündigung ändern. Für die Richtigkeit,
            Vollständigkeit und Aktualität der dargestellten Informationen wird
            keine Gewähr übernommen. Die Nutzung dieser Website erfolgt auf
            eigene Verantwortung.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
            Keine Anlageberatung
          </h2>
          <p className="leading-relaxed text-sm">
            Die Inhalte dieser Website dienen ausschließlich der Information
            und stellen keine Anlage-, Steuer- oder Rechtsberatung dar.
            Investitionen in Bitcoin und Kryptowährungen sind mit erheblichen
            Risiken verbunden. Bitte konsultiere bei Bedarf einen zugelassenen
            Finanzberater.
          </p>
        </section>
      </div>
    </div>
  );
}
