import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "LostNFind — A little closer to found",
  description:
    "A thoughtful community space to reunite lost belongings with the people who miss them.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
