"use client";

import { useState } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import { showErrorAlert } from "@/lib/swal";

export interface PhotoItem {
  id: string;
  url: string;
  uploaderName: string;
  caption?: string;
  category?: string;
  isFeatured?: boolean;
  createdAt?: string | Date;
}

export interface DedicationItem {
  id: string;
  authorName: string;
  messageText: string;
  createdAt: string | Date;
  initials?: string;
  group?: string;
}

interface RecuerdosViewProps {
  initialPhotos: PhotoItem[];
  initialDedications: DedicationItem[];
  stats: {
    totalPhotos: number;
    totalDedications: number;
    totalTables: number;
  };
}

export function RecuerdosInteractiveView({
  initialPhotos,
  initialDedications,
  stats,
}: RecuerdosViewProps) {
  const [activeTab, setActiveTab] = useState<"gallery" | "guestbook" | "letter">("gallery");
  const [photoFilter, setPhotoFilter] = useState<string>("all");
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [dedications, setDedications] = useState<DedicationItem[]>(initialDedications);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  // Formulario de nueva dedicatoria
  const [showDedicationModal, setShowDedicationModal] = useState(false);
  const [newAuthor, setNewAuthor] = useState("");
  const [newGroup, setNewGroup] = useState("Familia");
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fallback visual photos if DB photos are under 4
  const curatedFallbackPhotos: PhotoItem[] = [
    {
      id: "demo-1",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
      uploaderName: "Fotógrafo Oficial de Gala",
      caption: "Entrada Triunfal de Dannia Carolina • Hotel Holiday Inn",
      category: "Vals & Brindis",
      isFeatured: true,
    },
    {
      id: "demo-2",
      url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
      uploaderName: "Familia Mendoza González",
      caption: "Vals en el Hotel Holiday Inn",
      category: "Vals & Brindis",
      isFeatured: true,
    },
    {
      id: "demo-3",
      url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
      uploaderName: "Corte de Honor",
      caption: "Celebrando los Quince Años en la Mesa Principal",
      category: "Selfie / Mesa",
    },
    {
      id: "demo-4",
      url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
      uploaderName: "Dj & Ambientación",
      caption: "Alegría y fiesta en la pista de baile",
      category: "Pista de Baile",
    },
  ];

  const allDisplayPhotos = photos.length > 0 ? photos : curatedFallbackPhotos;

  const filteredPhotos =
    photoFilter === "all"
      ? allDisplayPhotos
      : allDisplayPhotos.filter((p) => p.category === photoFilter);

  const handleSendDedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: `${newAuthor.trim()} (${newGroup})`,
          messageText: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const created: DedicationItem = {
          id: data.message?.id || `msg-${Date.now()}`,
          authorName: newAuthor.trim(),
          group: newGroup,
          messageText: newMessage.trim(),
          createdAt: new Date().toISOString(),
          initials: newAuthor
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
        };

        setDedications((prev) => [created, ...prev]);
        setSubmitSuccess(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#D4AF37", "#0552AC", "#FFFFFF"],
        });

        setTimeout(() => {
          setSubmitSuccess(false);
          setShowDedicationModal(false);
          setNewAuthor("");
          setNewMessage("");
        }, 1500);
      } else {
        showErrorAlert("No se pudo enviar", "Por favor intenta de nuevo en unos momentos.");
      }
    } catch {
      showErrorAlert("Error de conexión", "No pudimos enviar tu dedicatoria. Revisa tu conexión a internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintLetter = () => {
    window.print();
  };

  return (
    <div className="space-y-10">
      {/* 1. Metric Capsules */}
      <div className="w-full max-w-md mx-auto grid grid-cols-3 gap-3 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col items-center justify-center p-2">
          <span className="font-headline text-2xl font-bold text-[#0552AC]">
            {Math.max(stats.totalPhotos, allDisplayPhotos.length)}
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider text-center mt-0.5">
            Fotos Curadas
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl">
          <span className="font-headline text-2xl font-bold text-[#D4AF37]">
            {Math.max(stats.totalDedications, dedications.length)}
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider text-center mt-0.5">
            Dedicatorias
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2">
          <span className="font-headline text-2xl font-bold text-[#0552AC]">
            {stats.totalTables || 35}
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider text-center mt-0.5">
            Mesas de Honor
          </span>
        </div>
      </div>

      {/* 2. Interactive Navigation Pills */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 shadow-xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("gallery")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeTab === "gallery"
                ? "bg-[#0552AC] text-white shadow-md shadow-[#0552AC]/20"
                : "text-slate-600 hover:text-[#0552AC] hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">photo_library</span>
            <span>Galería Fotográfica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guestbook")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeTab === "guestbook"
                ? "bg-[#0552AC] text-white shadow-md shadow-[#0552AC]/20"
                : "text-slate-600 hover:text-[#0552AC] hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">auto_stories</span>
            <span>Libro de Oro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("letter")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeTab === "letter"
                ? "bg-[#0552AC] text-white shadow-md shadow-[#0552AC]/20"
                : "text-slate-600 hover:text-[#0552AC] hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">favorite</span>
            <span>Carta de Gratitud</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GALERÍA FOTOGRÁFICA INTERACTIVA */}
      {activeTab === "gallery" && (
        <section className="space-y-6 animate-in fade-in duration-300">
          {/* Moment Filter Pills */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl font-bold text-[#0D1829]">
                Álbum Oficial de Momentos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fotografías de los invitados y de la cobertura oficial
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", "Vals & Brindis", "Selfie / Mesa", "Pista de Baile"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPhotoFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    photoFilter === cat
                      ? "bg-[#001F54] text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-[#0552AC]"
                  }`}
                >
                  {cat === "all" ? "Todas las Fotos" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Masonry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setLightboxPhoto(photo)}
                className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-2xl transition duration-300 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={photo.url}
                    alt={photo.caption || "Foto de recuerdo"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">zoom_in</span>
                      Ver en pantalla completa
                    </span>
                  </div>

                  {photo.isFeatured && (
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#001F54] text-[10px] font-bold font-cinzel shadow-md uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">star</span>
                      <span>Destacada</span>
                    </div>
                  )}

                  {photo.category && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-bold">
                      {photo.category}
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col justify-between flex-1">
                  <p className="text-xs text-slate-700 font-medium line-clamp-2 italic">
                    &quot;{photo.caption || "Un instante inolvidable en los Quince de Dannia Carolina."}&quot;
                  </p>
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span className="font-semibold text-[#0552AC] truncate">
                      Por: {photo.uploaderName}
                    </span>
                    <span className="shrink-0">
                      {photo.createdAt ? new Date(photo.createdAt).toLocaleDateString("es-NI") : "4 Dic 2026"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: LIBRO DE ORO & DEDICATORIAS */}
      {activeTab === "guestbook" && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl font-bold text-[#0D1829]">
                Libro de Oro &amp; Cápsula del Tiempo
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mensajes y bendiciones que Dannia Carolina atesorará para toda su vida
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDedicationModal(true)}
              className="px-5 py-2.5 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#0552AC]/20 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px] text-[#D4AF37]">edit_note</span>
              <span>Dejar Mi Dedicatoria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dedications.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <span className="material-symbols-outlined text-2xl text-[#D4AF37]/60 block mb-1">
                    format_quote
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-serif italic">
                    {item.messageText}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#0552AC] flex items-center justify-center font-bold text-xs shrink-0 font-cinzel">
                    {item.initials || item.authorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#0D1829] truncate">
                      {item.authorName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.group || "Familia / Amigo"} • {new Date(item.createdAt).toLocaleDateString("es-NI")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: CARTA DE GRATITUD DE DANNIA */}
      {activeTab === "letter" && (
        <section className="bg-white rounded-3xl p-6 md:p-12 border border-slate-200/80 shadow-lg relative overflow-hidden animate-in fade-in duration-300">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0FE] text-[#0552AC] text-[10px] font-bold uppercase tracking-widest font-cinzel">
                <span className="material-symbols-outlined text-[14px] text-[#D4AF37]">auto_awesome</span>
                <span>Carta de la Quinceañera</span>
              </div>
              <h2 className="font-headline text-3xl font-bold text-[#001F54]">
                A quienes bailaron, rieron y soñaron conmigo...
              </h2>
              <p className="text-xs text-slate-400">
                Hotel Holiday Inn Managua
              </p>
            </div>

            <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed font-serif pt-4 border-t border-slate-100">
              <p>
                Todavía cierro los ojos y siento la música del vals, el brillo de las luces doradas y el calor de cada abrazo sincero. No existió instante más perfecto en mi vida que ver a las personas que más amo reunidas bajo el mismo salón celebrando mis quince años.
              </p>
              <p>
                A mis querida madre, por su amor incondicional y por construir con tanto sacrificio este sueño hecho realidad. A mi corte de honor, a mis padrinos y a cada una de las familias que viajaron y nos acompañaron: su presencia llenó de luz y magia mi corazón.
              </p>
              <div className="relative my-6 px-6 py-5 bg-gradient-to-r from-[#001F54] via-[#0552AC] to-[#001F54] text-white rounded-2xl border-2 border-[#D4AF37]/50 text-center shadow-lg">
                <span className="font-cinzel text-xs uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">
                  Salmos 138:8
                </span>
                <p className="italic text-white font-medium font-serif text-base md:text-lg leading-relaxed">
                  &ldquo;Jehov&aacute; cumplir&aacute; su prop&oacute;sito en m&iacute;; Tu misericordia, oh Jehov&aacute;, es para siempre.&rdquo;
                </p>
              </div>
              <p>
                Guardaré para siempre en mi memoria sus sonrisas, los bailes y cada deseo plasmado en este libro. Que la vida les multiplique con bendiciones todo el cariño que me brindaron.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-script text-3xl text-[#0552AC]">
                  Con amor eterno, Dannia Carolina
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-cinzel mt-1">
                  Dannia Carolina Mendoza • Mis XV Años 2026
                </span>
              </div>

              <button
                type="button"
                onClick={handlePrintLetter}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#0552AC]/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
                  print
                </span>
                <span>Imprimir Carta de Gala</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* LIGHTBOX MODAL: FOTO EN ALTA DEFINICIÓN */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxPhoto(null);
          }}
        >
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]">
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar"
            >
              ✕
            </button>

            <div className="relative flex-1 min-h-[350px] md:min-h-[500px] w-full bg-black flex items-center justify-center">
              <Image
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption || "Recuerdo ampliado"}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            <div className="p-5 bg-slate-900/90 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-white/10">
              <div>
                <p className="text-sm font-medium italic text-slate-200">
                  &quot;{lightboxPhoto.caption || "Fotografía de Gala • Dannia Carolina Mis XV"}&quot;
                </p>
                <span className="text-xs text-[#D4AF37] font-semibold mt-0.5 block">
                  Capturado por: {lightboxPhoto.uploaderName}
                </span>
              </div>

              <a
                href={lightboxPhoto.url}
                target="_blank"
                rel="noreferrer"
                download={`Recuerdo_DanniaXV_${lightboxPhoto.id}.jpg`}
                className="px-4 py-2 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Descargar en HD</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NUEVA DEDICATORIA */}
      {showDedicationModal && (
        <div
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDedicationModal(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border-2 border-[#D4AF37]/50 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowDedicationModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1 mb-5">
              <span className="material-symbols-outlined text-3xl text-[#D4AF37]">
                auto_awesome
              </span>
              <h3 className="font-headline text-2xl font-bold text-[#001F54]">
                Escribe en el Libro de Oro
              </h3>
              <p className="text-xs text-slate-500">
                Tus palabras quedarán inmortalizadas para siempre en las memorias de Dannia Carolina.
              </p>
            </div>

            {submitSuccess ? (
              <div className="p-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-2">
                <span className="material-symbols-outlined text-4xl text-emerald-600">
                  check_circle
                </span>
                <h4 className="font-headline text-lg font-bold">¡Mensaje Publicado!</h4>
                <p className="text-xs text-emerald-700">
                  Tu dedicatoria ha sido guardada con éxito en el libro conmemorativo.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendDedication} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#001F54] mb-1 font-cinzel">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Ej. Tío Carlos & Familia..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#001F54] mb-1 font-cinzel">
                    Parentesco o Grupo
                  </label>
                  <select
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-xs text-slate-800 cursor-pointer"
                  >
                    <option value="Familia">Familia</option>
                    <option value="Amigos de Escuela">Amigos de Escuela</option>
                    <option value="Corte de Honor">Corte de Honor</option>
                    <option value="Padrinos de Gala">Padrinos de Gala</option>
                    <option value="Invitado Especial">Invitado Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#001F54] mb-1 font-cinzel">
                    Tu Dedicatoria o Deseo *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe unas palabras de bendición, recuerdo o anécdota especial..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-xs text-slate-800 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#0552AC]/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[17px]">send</span>
                  <span>{isSubmitting ? "Publicando..." : "Publicar en el Libro de Oro"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
