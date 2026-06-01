import type { Metadata } from "next";
import { Bricolage_Grotesque, Familjen_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

import SmoothScroll from "@/components/SmoothScroll";
import GameProvider from "@/components/GameProvider";
import CustomCursor from "@/components/CustomCursor";
import BootIntro from "@/components/BootIntro";
import ScrollProgress from "@/components/ScrollProgress";
import Journey3D from "@/components/Journey3D";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--ff-display", display: "swap" });
const body = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ff-body", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--ff-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Sandeep · Full-Stack Developer",
  description: "An interactive journey through the work of a full-stack developer — building across the universe of the web.",
  keywords: ["full-stack developer", "portfolio", "React", "Next.js", "TypeScript", "web developer"],
  authors: [{ name: "Sandeep" }],
  openGraph: {
    title: "Sandeep · Full-Stack Developer",
    description: "An interactive journey through the work of a full-stack developer.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body suppressHydrationWarning>
        <SmoothScroll>
          <GameProvider>
            <CustomCursor />
            <Journey3D />
            <div className="nebula nebula-1" />
            <div className="nebula nebula-2" />
            <div className="nebula nebula-3" />
            <div className="nebula nebula-4" />
            <div className="grid-overlay" />
            <div className="grain" />

            <BootIntro />
            <ScrollProgress />
            <Nav />
            <main>{children}</main>
            <Footer />
          </GameProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
