import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import BrandLoader from "@/components/BrandLoader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forge",
  description: "A git forge built from scratch",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=JSON.parse(localStorage.getItem("forge-brand"));if(d&&typeof d.hue==="number"){var h=d.hue,s=d.sat,r=document.documentElement.style;r.setProperty("--brand",h+" "+s+"% 53%");r.setProperty("--brand-muted",h+" "+Math.round(s*.63)+"% 30%");r.setProperty("--brand-subtle",h+" "+Math.round(s*.42)+"% 12%");r.setProperty("--graph-1","hsl("+h+" "+Math.round(s*.42)+"% 18%)");r.setProperty("--graph-2","hsl("+h+" "+Math.round(s*.63)+"% 28%)");r.setProperty("--graph-3","hsl("+h+" "+Math.round(s*.84)+"% 40%)");r.setProperty("--graph-4","hsl("+h+" "+s+"% 53%)")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full font-sans antialiased">
        <BrandLoader />
        <Nav />
        {children}
      </body>
    </html>
  );
}
