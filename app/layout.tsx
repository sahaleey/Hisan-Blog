import type { Metadata } from "next";
import Link from "next/link";
import { Newsreader, Inter } from "next/font/google";
import { AuthControls } from "@/components/auth-controls";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";
import Image from "next/image";

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LAFZOON — A student literary journal",
  description:
    "A multilingual archive of literature, ideas, and creative expression from the HISAN student community.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${inter.variable}`}>
      <body>
        <div className="masthead-wrapper">
          <header className="site-header">
            <Link
              className="wordmark"
              href="/"
              aria-label="LAFZOON Journal Home"
            >
              <Image
                src="/images/LAFZOON-01.svg"
                alt="LAFZOON"
                width={160}
                height={60}
                priority
              />
            </Link>
            <SiteNav />
            <div className="desktop-auth">
              <AuthControls />
            </div>
          </header>
        </div>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div>
              <p className="footer-kicker">HISAN / SIBĀQ 2026</p>
              <p className="footer-note">
                A living multilingual archive of student voices, critical
                essays, poetry, and creative literature from Chamakkala.
              </p>
            </div>
            <div>
              <h3 className="footer-col-title">Journal</h3>
              <ul className="footer-links">
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <Link href="/journal">Recent Issues</Link>
                </li>
                <li>
                  <Link href="/archive">Complete Archive</Link>
                </li>
                <li>
                  <Link href="/authors">Writers Directory</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="footer-col-title">Contributions</h3>
              <ul className="footer-links">
                <li>
                  <Link href="/submit">Submit Your Work</Link>
                </li>
                <li>
                  <Link href="/workspace">Author Workspace</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="footer-col-title">Colophon</h3>
              <p className="footer-note" style={{ fontSize: "0.8rem" }}>
                Nahjurrashad Islamic College
                <br />
                Chamakkala, Kerala, India
                <br />
                All student authors retain copyright of their works.
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} LAFZOON. All rights reserved.
            </span>
            <span>
              Published with care for literature, ideas, and honest inquiry.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
