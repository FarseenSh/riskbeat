import type { Metadata } from "next";
import { JetBrains_Mono, Martian_Mono } from "next/font/google";
import Link from "next/link";
import { siteData } from "@/lib/data-loader";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

const martian = Martian_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-martian",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OpenRisk — every feed, one view",
    template: "%s · OpenRisk",
  },
  description:
    "What every major DeFi risk feed says about every major Ethereum protocol — side by side, verbatim, with no score of its own.",
};

function SystemBar() {
  const automated = siteData.feeds.filter(
    (f) => f.automation_tier === "full" && f.status === "active",
  );
  const lastFetch = Object.values(siteData.feed_meta)
    .map((m) => m.fetched_at)
    .filter((t): t is string => Boolean(t))
    .sort()
    .at(-1);
  const root = siteData.provenance.latest_root;
  return (
    <div className="system-bar">
      <span>
        ETHEREUM MAINNET · <b>{siteData.protocols.length}</b> PROTOCOLS ·{" "}
        <b>{siteData.feeds.length}</b> FEEDS (<b>{automated.length}</b>{" "}
        AUTOMATED)
      </span>
      <span>
        LAST FETCH{" "}
        <b>{lastFetch ? lastFetch.slice(0, 16).replace("T", " ") : "—"} UTC</b>
      </span>
      {root && (
        <span>
          ROOT{" "}
          <Link href="/verify" className="root-hash" title="Daily Merkle root over the content-addressed archive — reproduce it from a clone at /verify">
            {root.root.slice(0, 16)}…
          </Link>
        </span>
      )}
      <span>
        NO COMPOSITE SCORES —{" "}
        <a
          href="https://github.com/FarseenSh/openrisk/blob/main/CHARTER.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          CHARTER
        </a>
      </span>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jetbrains.variable} ${martian.variable}`}>
      <body>
        <header className="site-header">
          <div className="shell">
            <div className="site-header-inner">
              <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <Link href="/" className="wordmark">
                  OPENRISK<span className="tick">_</span>
                </Link>
                <span className="tagline">
                  every feed · one view · no score of its own
                </span>
              </div>
              <nav className="site-nav">
                <Link href="/">Matrix</Link>
                <Link href="/divergence">Divergence</Link>
                <Link href="/methodology">Methodology</Link>
                <Link href="/corrections">Corrections</Link>
                <Link href="/verify">Verify</Link>
                <Link href="/status">Status</Link>
                <a
                  href="https://github.com/FarseenSh/openrisk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub ↗
                </a>
              </nav>
            </div>
            <SystemBar />
          </div>
        </header>
        <main className="shell">{children}</main>
        <footer className="site-footer">
          <div className="shell" style={{ display: "contents" }}>
            <span>
              AGPL-3.0 · git-native data ·{" "}
              <a
                href="https://github.com/FarseenSh/openrisk/blob/main/CHARTER.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                CHARTER.md
              </a>{" "}
              — no composite scores, ever
            </span>
            <span>
              Ethereum mainnet · built in the open ·{" "}
              <a
                href="https://github.com/FarseenSh/openrisk"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/FarseenSh/openrisk
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
