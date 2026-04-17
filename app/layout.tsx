import type { Metadata } from "next";
import { Inter, Bitter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Bitter({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pell City Trailer Rentals — Camp & Flatbed Trailer Rentals in Pell City, AL",
    template: "%s | Pell City Trailer Rentals",
  },
  description:
    "Rent camp trailers and flatbed utility trailers in Pell City, Alabama. Online booking, real-time availability, and instant confirmation.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
