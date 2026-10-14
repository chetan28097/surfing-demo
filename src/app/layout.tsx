import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Newsreader } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
});

const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL in the deployment environment for absolute OG image URLs.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: `${site.fullName}: surf lessons at ${site.beach}`,
  description:
    "Small-group and private surf lessons for every level, from your first wave to reading the lineup. Book a session online.",
  openGraph: {
    title: site.fullName,
    description: "Surf lessons for every level. Book a session online.",
    images: ["/images/golden.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#062a3a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
