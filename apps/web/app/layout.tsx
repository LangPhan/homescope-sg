import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "@/components/providers";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const serif = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-serif", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: { default: "HomeScope SG — Find a home that fits", template: "%s · HomeScope SG" },
  description: "Explore Singapore homes with fast filters, map search and transparent price trends.",
  openGraph: { title: "HomeScope SG", description: "A full-stack Singapore property portal engineering case study.", type: "website" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body className={`${sans.variable} ${serif.variable}`}><Providers><SiteHeader />{children}</Providers></body></html>;
}
