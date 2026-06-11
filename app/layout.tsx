import type { Metadata } from "next";
import { DM_Mono, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Bitcoin Navigator – Finde die besten Produkte für deine Bitcoin",
    template: "%s | Bitcoin Navigator",
  },
  description:
    "Börsen, Wallets, Steuerberater & mehr – unabhängig verglichen, von der Community bewertet. Das erste community-kuratierte Bitcoin-Vergleichsportal für Deutschland, Österreich & Schweiz.",
  keywords: [
    "Bitcoin kaufen", "Bitcoin Börse Vergleich", "Hardware Wallet Vergleich",
    "Bitcoin Sparplan", "Bitcoin DACH", "Krypto Vergleich Deutschland",
    "Bitcoin Österreich", "Bitcoin Schweiz", "Ledger Trezor BitBox",
  ],
  authors: [{ name: "Bitcoin Navigator" }],
  creator: "Bitcoin Navigator",
  metadataBase: new URL("https://bitcoinnavigator.de"),
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://bitcoinnavigator.de",
    siteName: "Bitcoin Navigator",
    title: "Bitcoin Navigator – Der Bitcoin-Kompass für den DACH-Raum",
    description:
      "Börsen, Wallets, Steuerberater & mehr – unabhängig verglichen, von der Community bewertet.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bitcoin Navigator – Der Bitcoin-Kompass für den DACH-Raum",
    description: "Bitcoin Börsen, Wallets & mehr für DACH – unabhängig verglichen.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://bitcoinnavigator.de",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${syne.variable} ${dmMono.variable}`}>
      <body className="antialiased" style={{ background: '#f7f6f3', color: '#1a1a1a' }}>{children}</body>
    </html>
  );
}
