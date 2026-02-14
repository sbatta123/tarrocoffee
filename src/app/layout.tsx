import type { Metadata } from "next";
import { DM_Serif_Display, Nunito_Sans } from "next/font/google";
import "./globals.css";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

const sans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-geist-sans",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Tarro — Voice Order",
  description: "AI voice cashier for a busy NYC coffee shop. Order by voice or text.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="antialiased font-sans min-h-screen bg-espresso-50 text-espresso-950">
        {children}
      </body>
    </html>
  );
}
