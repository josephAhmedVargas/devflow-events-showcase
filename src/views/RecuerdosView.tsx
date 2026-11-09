"use client";

import Image from "next/image";
import Link from "next/link";
import { DevFlowNavbar } from "@/components/showcase/DevFlowNavbar";
import { TopExperienceNav } from "@/components/shared/TopExperienceNav";
import {
  RecuerdosInteractiveView,
  PhotoItem,
  DedicationItem,
} from "@/components/recuerdos/RecuerdosInteractiveView";
import { useDemoDb, useIsAdmin } from "@/demo/db";

export default function RecuerdosView() {
  const db = useDemoDb();
  const isAdmin = useIsAdmin();

  const approvedPhotos: PhotoItem[] = [...db.photos]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((p) => p.moderationStatus === "approved" || p.isFeatured)
    .map((p) => ({
      id: p.id,
      url: p.asset?.publicUrl,
      uploaderName: p.uploaderName || "Invitado de Gala",
      caption: p.caption || "Un recuerdo inolvidable en los Quince Años de Dannia Carolina.",
      category: p.source === "official_photographer" ? "Vals & Brindis" : "Selfie / Mesa",
      isFeatured: p.isFeatured || false,
      createdAt: p.createdAt,
    }));

  const dbMessages = [...db.messages]
    .filter((m) => m.moderationStatus === "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);

  // Fallback emotivo de gala si la base de datos tiene pocos mensajes aún
  const fallbackDedications: DedicationItem[] = [
    {
      id: "d1",
      authorName: "Familia Mendoza González",
      group: "Familia Paterna",
      createdAt: "2026-12-04T22:00:00-06:00",
      messageText:
        "Dannia de nuestro corazón, verte bailar el vals fue como ver un ángel. Eres el orgullo más grande de toda la familia. ¡Te amamos con el alma!",
      initials: "MG",
    },
    {
      id: "d2",
      authorName: "Lic. Alejandro Morales",
      group: "Padrino de Brindis",
      createdAt: "2026-12-04T22:30:00-06:00",
      messageText:
        "Un honor inmenso acompañarte en tu noche soñada. Que la vida te llene de éxitos, salud y la misma luz que deslumbró a todo el salón.",
      initials: "AM",
    },
    {
      id: "d3",
      authorName: "Camila & Sofía",
      group: "Corte de Honor",
      createdAt: "2026-12-04T23:00:00-06:00",
      messageText:
        "¡La mejor noche de nuestras vidas! Inolvidable el baile sorpresa y cada risa en la mesa. Siempre juntas amiga hermosa 👑✨",
      initials: "CS",
    },
  ];

  const dedications: DedicationItem[] =
    dbMessages.length > 0
      ? dbMessages.map((m) => ({
          id: m.id,
          authorName: m.authorName,
          messageText: m.messageText,
          createdAt: m.createdAt,
          initials: m.authorName
            .split(" ")
            .map((n: string) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
          group: "Invitado de Gala",
        }))
      : fallbackDedications;

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#0D1829] flex flex-col selection:bg-[#0552AC] selection:text-white">
      {/* Header DevFlow Events */}
      <DevFlowNavbar showSectionNav={false} />

      {/* Main Content Area */}
      <main className="w-full pt-24 pb-20 flex-1 max-w-[1240px] mx-auto px-4 md:px-8 flex flex-col gap-10">
        {/* Mobile Nav Bar */}
        {isAdmin && (
          <div className="md:hidden flex justify-center py-1">
            <TopExperienceNav isAdmin={true} />
          </div>
        )}

        {/* 1. Header Emotivo Conmemorativo */}
        <section className="relative pt-4 pb-2 flex flex-col items-center text-center overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F0FE] text-[#0552AC] border border-[#0552AC]/20 shadow-2xs mb-4">
            <span className="material-symbols-outlined text-[#D4AF37] text-[15px]">
              auto_awesome
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest font-cinzel">
              Edición Conmemorativa • 4 Diciembre 2026
            </span>
          </div>

          <h1 className="font-headline text-3xl md:text-5xl font-normal text-[#0D1829] mb-3 leading-tight">
            El Libro Eterno de{" "}
            <span className="italic font-headline text-[#0552AC] font-bold">Dannia Carolina</span>
          </h1>

          <p className="text-xs md:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed mb-6">
            Una noche mágica celebrada en el Hotel Holiday Inn Managua, grabada en fotografías,
            dedicatorias y risas que vivirán por siempre en nuestro corazón.
          </p>

          {/* Mini Portrait with Champagne Ring */}
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#D4AF37] via-[#0552AC] to-[#D4AF37] shadow-lg">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-200 relative">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
                  alt="Dannia Carolina"
                  fill
                  className="object-cover object-top"
                  unoptimized
                />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#D4AF37] ring-2 ring-[#D4AF37]/40">
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
            </div>
          </div>
        </section>

        {/* 2. Vista Interactiva: Galería + Libro de Oro + Carta */}
        <RecuerdosInteractiveView
          initialPhotos={approvedPhotos}
          initialDedications={dedications}
          stats={{
            totalPhotos: approvedPhotos.length,
            totalDedications: dedications.length,
            totalTables: 35,
          }}
        />

        {/* Footer */}
        <footer className="pt-8 pb-12 flex flex-col items-center text-center gap-2 border-t border-slate-200">
          <span className="font-cinzel text-xs font-bold text-[#0552AC] tracking-widest uppercase">
            D&apos;CAROL — Dannia Carolina MIS XV 2026
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-cinzel">
            Hotel Holiday Inn Managua
          </span>
        </footer>
      </main>
    </div>
  );
}
