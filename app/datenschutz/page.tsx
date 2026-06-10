import Link from "next/link";

export const metadata = {
  title: "Datenschutzerklärung – Bitcoin Navigator",
  description: "Datenschutzerklärung für bitcoinnavigator.de gemäß DSGVO.",
};

export default function Datenschutz() {
  return (
    <div className="min-h-screen px-6 md:px-12 py-16 max-w-2xl">
      <Link href="/" className="font-mono text-xs mb-12 block hover:text-white transition-colors"
        style={{ color: "var(--text-secondary)" }}>
        ← Zurück
      </Link>
      <h1 className="text-4xl font-bold mb-2">Datenschutzerklärung</h1>
      <p className="font-mono text-xs mb-10" style={{ color: "var(--text-secondary)" }}>
        Stand: Juni 2026
      </p>

      <div className="space-y-10" style={{ color: "var(--text-secondary)" }}>

        {/* 1. Verantwortlicher */}
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}>
            1. Verantwortlicher
          </h2>
          <p className="leading-relaxed text-sm">
            Christian Klingler<br />
            Scillawaldstr. 79<br />
            70378 Stuttgart<br />
            Deutschland<br /><br />
            E-Mail:{" "}
            <a href="mailto:christian-klingler@gmx.net"
              className="hover:text-white transition-colors"
              style={{ color: "var(--text-primary)" }}>
              christian-klingler@gmx.net
            </a>
          </p>
        </section>

        {/* 2. Erhobene Daten */}
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}>
            2. Welche Daten wir erheben
          </h2>
          <p className="leading-relaxed text-sm mb-3">
            Wir erheben nur Daten, die du uns aktiv mitteilst:
          </p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong style={{ color: "var(--text-primary)" }}>E-Mail-Adresse</strong> – wenn du dich über das Launch-Formular einträgst, um über den Start informiert zu werden.</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Keine weiteren personenbezogenen Daten</strong> – kein Name, keine IP-Adresse im Klartext, kein Tracking.</li>
          </ul>
          <p className="leading-relaxed text-sm mt-3">
            Technisch bedingt verarbeitet unser Hosting-Anbieter Vercel beim Seitenaufruf
            Server-Logs (IP-Adresse, Zeitstempel, aufgerufene URL). Diese werden nicht von
            uns ausgewertet und nach kurzer Zeit gelöscht.
          </p>
        </section>

        {/* 3. Rechtsgrundlage */}
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}>
            3. Rechtsgrundlage
          </h2>
          <p className="leading-relaxed text-sm">
            Die Verarbeitung deiner E-Mail-Adresse erfolgt auf Grundlage deiner freiwilligen
            Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO. Du kannst deine Einwilligung
            jederzeit widerrufen, indem du uns eine E-Mail sendest – deine Adresse wird dann
            unverzüglich gelöscht.
          </p>
        </section>

        {/* 4. Speicherung & Löschung */}
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}>
            4. Speicherung & Löschung
          </h2>
          <p className="leading-relaxed text-sm">
            Deine E-Mail-Adresse wird gespeichert, bis du dich abmeldest oder die Löschung
            verlangst. Spätestens 30 Tage nach deiner Abmeldeanfrage wird die Adresse
            vollständig gelöscht.
          </p>
        </section>

        {/* 5. Auftragsverarbeiter */}
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}>
            5. Dienstleister & Auftragsverarbeiter
          </h2>
          <p className="leading-relaxed text-sm mb-3">
            Wir nutzen folgende Dienste, mit denen ein Auftragsverarbeitungsvertrag (AVV)
            besteht oder die ihren Sitz in einem Land mit angemessenem Datenschutzniveau haben:
          </p>
          <ul className="text-sm space-y-3 ml-4">
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Vercel Inc.</strong> (San Francisco, USA) –
              Hosting der Website. Vercel ist nach dem EU-US Data Privacy Framework zertifiziert.{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
                className="hover:text-white transition-colors" style={{ color: "var(--accent)" }}>
                Datenschutzerklärung Vercel ↗
              </a>
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Supabase Inc.</strong> (San Francisco, USA) –
              Datenbank für E-Mail-Adressen der Warteliste. Supabase bietet EU-Datenhaltung in Frankfurt (AWS eu-central-1) an.{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer"
                className="hover:text-white transition-colors" style={{ color: "var(--accent)" }}>
                Datenschutzerklärung Supabase ↗
              </a>
            </li>
          </ul>
        </section>

        {/* 6. Cookies & Tracking */}
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}>
            6. Cookies & Tracking
          </h2>
          <p className="leading-relaxed text-sm">
            Wir verwenden <strong style={{ color: "var(--text-primary)" }}>keine Tracking-Cookies</strong>,
            keine Analytics-Tools (kein Google Analytics, kein Matomo etc.) und keine
            Social-Media-Plugins. Es ist daher kein Cookie-Banner erforderlich.
          </p>
        </section>

        {/* 7. Affiliate-Links */}
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}>
            7. Affiliate-Links & Vergütung
          </h2>
          <p className="leading-relaxed text-sm">
            Diese Website enthält Affiliate-Links zu Drittanbietern. Wenn du über einen
            solchen Link ein Produkt kaufst oder dich registrierst, erhalten wir unter Umständen
            eine Provision. Für dich entstehen dadurch keine Mehrkosten. Affiliate-Links sind
            auf dieser Website stets transparent mit dem Hinweis{" "}
            <span className="font-mono text-xs px-1.5 py-0.5 rounded"
              style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
              Affiliate
            </span>{" "}
            oder durch <code>rel="sponsored"</code> im Quellcode gekennzeichnet.
          </p>
          <p className="leading-relaxed text-sm mt-2">
            Die redaktionelle Unabhängigkeit dieser Website ist davon nicht betroffen.
            Vergleichsrankings basieren auf sachlichen Kriterien, nicht auf Provisionshöhe.
          </p>
        </section>

        {/* 8. Deine Rechte */}
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}>
            8. Deine Rechte (DSGVO)
          </h2>
          <p className="leading-relaxed text-sm mb-3">
            Du hast jederzeit das Recht auf:
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• <strong style={{ color: "var(--text-primary)" }}>Auskunft</strong> über die gespeicherten Daten (Art. 15 DSGVO)</li>
            <li>• <strong style={{ color: "var(--text-primary)" }}>Berichtigung</strong> unrichtiger Daten (Art. 16 DSGVO)</li>
            <li>• <strong style={{ color: "var(--text-primary)" }}>Löschung</strong> deiner Daten (Art. 17 DSGVO)</li>
            <li>• <strong style={{ color: "var(--text-primary)" }}>Einschränkung</strong> der Verarbeitung (Art. 18 DSGVO)</li>
            <li>• <strong style={{ color: "var(--text-primary)" }}>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
            <li>• <strong style={{ color: "var(--text-primary)" }}>Widerspruch</strong> gegen die Verarbeitung (Art. 21 DSGVO)</li>
          </ul>
          <p className="leading-relaxed text-sm mt-3">
            Wende dich dazu einfach per E-Mail an{" "}
            <a href="mailto:christian-klingler@gmx.net"
              className="hover:text-white transition-colors"
              style={{ color: "var(--text-primary)" }}>
              christian-klingler@gmx.net
            </a>.
          </p>
        </section>

        {/* 9. Beschwerderecht */}
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}>
            9. Beschwerderecht
          </h2>
          <p className="leading-relaxed text-sm">
            Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
            Zuständig für Baden-Württemberg ist der{" "}
            <a href="https://www.baden-wuerttemberg.datenschutz.de" target="_blank"
              rel="noopener noreferrer" className="hover:text-white transition-colors"
              style={{ color: "var(--accent)" }}>
              Landesbeauftragte für Datenschutz und Informationsfreiheit Baden-Württemberg ↗
            </a>.
          </p>
        </section>

        {/* 10. Externe Links */}
        <section>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}>
            10. Externe Links
          </h2>
          <p className="leading-relaxed text-sm">
            Diese Website enthält Links zu externen Websites. Für deren Inhalte und
            Datenschutzpraktiken sind wir nicht verantwortlich. Bitte prüfe die
            Datenschutzerklärungen der jeweiligen Anbieter.
          </p>
        </section>

      </div>
    </div>
  );
}
