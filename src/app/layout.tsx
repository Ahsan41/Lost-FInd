import type { Metadata } from "next";
import { Figtree, Instrument_Serif, Spline_Sans_Mono } from "next/font/google";
import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-spline-sans-mono",
});

export const metadata: Metadata = {
  title: "LostNFind — Found-property register",
  description:
    "A community register of found belongings. Search what has been handed in, claim what is yours, or report something you found.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${instrumentSerif.variable} ${figtree.variable} ${splineSansMono.variable}`} lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
