import type { Metadata, Viewport } from "next";
import { Golos_Text } from "next/font/google";
import "./globals.css";
const golos = Golos_Text({ subsets: ["latin", "cyrillic"], variable: "--font-golos", display: "swap" });
export const metadata: Metadata = {
  title: "Цветочный мир · Цветы в Грязях 24/7",
  description: "Букеты и цветочные композиции от флориста Натальи Кашиной. Цветочный мир в Грязях, круглосуточно. Каталог, доставка и самовывоз.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#fbf9f6" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru" className={golos.variable}><body>{children}</body></html>;
}
