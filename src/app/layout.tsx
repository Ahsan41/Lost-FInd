import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-fraunces",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "LostNFind — Found-property register",
  description:
    "A community register of found belongings. Search what has been handed in, claim what is yours, or report something you found.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`} lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
