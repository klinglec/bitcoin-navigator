import Link from "next/link";

export default function Datenschutz() {
  return (
    <div className="min-h-screen px-6 md:px-12 py-16 max-w-2xl">
      <Link href="/" className="font-mono text-xs mb-12 block hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
        ← Zurück
      </Link>
      <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
      <div className="space-y-6" style={{ color: "var(--text-secondary)" }}>
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Erhobene Daten</h2>
          <p>Wir speichern ausschließlich E-Mail-Adressen, die du freiwillig über unser Formular einträgst, um dich über den Launch zu informieren.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Speicherung</h2>
          <p>Deine E-Mail wird in einer gesicherten Datenbank gespeichert und nicht an Dritte weitergegeben.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Cookies & Tracking</h2>
          <p>Wir verwenden keine Tracking-Cookies oder Analytics-Tools.</p>
        </section>
        <p className="p-4 rounded-lg border font-mono text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          [Vollständige Datenschutzerklärung wird vor dem Launch vervollständigt]
        </p>
      </div>
    </div>
  );
}
