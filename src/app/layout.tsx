import type { Metadata } from "next";
import { Homenaje, IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const homenaje = Homenaje({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Facade",
  description:
    "A personal chapter dashboard for experimentation, SEO, analytics, and daily signals.",
  icons: {
    icon: "/icon-facade-portal.svg",
    shortcut: "/icon-facade-portal.svg",
    apple: "/icon-facade-portal.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${homenaje.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
