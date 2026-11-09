import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/context/DemoContext";
import { ShowcaseTopBanner } from "@/components/showcase/ShowcaseTopBanner";
import { ShowcaseFloatingCTA } from "@/components/showcase/ShowcaseFloatingCTA";

export const metadata: Metadata = {
  title: "DevFlow Events · Showcase Tecnológico para Eventos de Gala",
  description:
    "Muestra interactiva de la plataforma de tecnología para eventos desarrollada por DevFlow. Invitaciones digitales interactivas, pases VIP con QR, escáner en puerta, planos interactivos y muro social en pantallas gigantes.",
  icons: {
    icon: "https://res.cloudinary.com/dzezhxhd2/image/upload/v1776909102/dental_flow_logo_mini_plcbg8.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#07070D] text-slate-100 antialiased selection:bg-purple-600 selection:text-white">
        <DemoProvider>
          <ShowcaseTopBanner />
          <div className="pt-12 min-h-screen flex flex-col">{children}</div>
          <ShowcaseFloatingCTA />
        </DemoProvider>
      </body>
    </html>
  );
}
