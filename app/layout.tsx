import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";

// One weight on purpose: every display glyph (titles, card indices, tokens) renders at 600.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "600",
});

const ui = Geist({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Card Games by CoffeeCoders", template: "%s · Card Games by CoffeeCoders" },
  description: "Playing-card games to play online with friends. Pick a game, share a code, deal.",
  openGraph: { images: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH}/cardgames_logo.png`, width: 512, height: 512 }] },
};

export const viewport: Viewport = {
  themeColor: "#0b0807",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
