import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Cinzel, Alex_Brush } from "next/font/google";
import { DemoRuntime } from "@/demo/DemoRuntime";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const alexBrush = Alex_Brush({
  variable: "--font-alex-brush",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "DevFlow Events — Demo interactiva de una gala real",
  description:
    "Explora la plataforma completa de DevFlow Events: invitación digital, RSVP, pase QR, plano de mesas, check-in, muro en vivo y archivo de recuerdos. Demo 100% local.",
  icons: { icon: "/favicon.ico" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F8FAFD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${jakarta.variable} ${cinzel.variable} ${alexBrush.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8FAFD] text-[#0D1829] font-body selection:bg-[#0552AC] selection:text-white">
        <DemoRuntime>{children}</DemoRuntime>
      </body>
    </html>
  );
}
