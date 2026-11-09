"use client";

import { useEffect, useState } from "react";

interface Message {
  id: string;
  authorName: string;
  messageText: string;
  createdAt: string;
}

export function GuestbookSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/guestbook");
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !messageText.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, messageText }),
      });
      if (res.ok) {
        setAuthorName("");
        setMessageText("");
        setSent(true);
        fetchMessages();
        setTimeout(() => setSent(false), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto" id="deseos-section">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0FE] text-[#0552AC] text-xs font-semibold uppercase tracking-wider mb-2 font-cinzel">
          <span className="material-symbols-outlined text-[16px]">favorite</span>
          <span>Libro de Oro & Deseos</span>
        </div>
        <h2 className="font-headline text-3xl md:text-4xl text-[#001F54] font-bold">
          Deja tu Dedicatoria a Dannia
        </h2>
        <p className="text-xs md:text-sm text-[#4B5B76] mt-2 max-w-md mx-auto">
          Tus palabras formarán parte del álbum digital de recuerdos que atesorará para toda la vida.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulario */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#0552AC]/15 shadow-xl">
          <h3 className="font-headline text-lg font-bold text-[#001F54] mb-4">
            Escribir una Felicitación
          </h3>

          {sent && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>¡Tu mensaje ha sido publicado en el libro de oro!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#001F54] uppercase tracking-wider mb-1 font-cinzel">
                Tu Nombre *
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ej: Familia Navarro, Tía Sofía..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-xs text-[#0D1829]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#001F54] uppercase tracking-wider mb-1 font-cinzel">
                Tu Dedicatoria *
              </label>
              <textarea
                rows={4}
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Expresa tus mejores deseos para sus quince años..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-xs text-[#0D1829] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#0552AC]/20 disabled:opacity-50"
            >
              {loading ? "Publicando..." : "Publicar Dedicatoria"}
            </button>
          </form>
        </div>

        {/* Lista de mensajes */}
        <div className="lg:col-span-7 space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {messages.length > 0 ? (
            messages.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-white border border-[#0552AC]/10 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-headline text-sm font-bold text-[#001F54]">
                    {m.authorName}
                  </span>
                  <span className="text-[10px] text-[#4B5B76]">
                    {new Date(m.createdAt).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="text-xs text-[#4B5B76] leading-relaxed italic">
                  "{m.messageText}"
                </p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-[#0552AC]/20">
              <span className="material-symbols-outlined text-[#D4AF37] text-3xl mb-2">draw</span>
              <p className="text-xs text-[#4B5B76]">Sé el primero en dejarle unas hermosas palabras a Dannia Carolina.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
