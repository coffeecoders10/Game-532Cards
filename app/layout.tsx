import type { Metadata, Viewport } from "next";
import { Figtree, Young_Serif } from "next/font/google";
import "./globals.css";

const display = Young_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const ui = Figtree({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Card Games by CoffeeCoders", template: "%s · Card Games by CoffeeCoders" },
  description: "Playing-card games to play online with friends. Pick a game, share a code, deal.",
  openGraph: { images: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH}/cardgames_logo.png`, width: 512, height: 512 }] },
};

export const viewport: Viewport = {
  themeColor: "#0b2624",
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
