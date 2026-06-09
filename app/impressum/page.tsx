import Link from "next/link";

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
            Hinweis
          </h2>
          <p className="leading-relaxed text-sm">
            Dieses Angebot befindet sich in der Entwicklungsphase. Es besteht
            noch kein eingetragenes Gewerbe. Umsatzsteuerliche Registrierung
            erfolgt bei Aufnahme einer gewerblichen Tätigkeit.
          </p>
        </section>
      </div>
    </div>
  );
}
