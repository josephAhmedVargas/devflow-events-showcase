"use client";

import { useState } from "react";
import confetti from "canvas-confetti";

interface TrackItem {
  id: string;
  title: string;
  artist: string;
  requestedByGuestName?: string | null;
}

interface SpotifyPlaylistSectionProps {
  initialPlaylist?: {
    id?: string;
    title?: string;
    spotifyUrl?: string | null;
    description?: string | null;
    tracks?: TrackItem[];
  } | null;
  guestName?: string | null;
  guestCode?: string | null;
}

export function SpotifyPlaylistSection({
  initialPlaylist,
  guestName = "",
  guestCode = "",
}: SpotifyPlaylistSectionProps) {
  const [tracks, setTracks] = useState<TrackItem[]>(initialPlaylist?.tracks || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [suggesterName, setSuggesterName] = useState(guestName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const spotifyUrl =
    initialPlaylist?.spotifyUrl || "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";

  const handleOpenModal = () => {
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleRecommendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/playlist/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          guestName: suggesterName.trim() || guestName || "Invitado con Afecto",
          guestCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo registrar la canción");

      // Optimistic update
      const newTrack: TrackItem = {
        id: data.track?.id || `temp-${Date.now()}`,
        title: title.trim(),
        artist: artist.trim(),
        requestedByGuestName: suggesterName.trim() || guestName || "Invitado/a",
      };

      setTracks((prev) => [newTrack, ...prev]);
      setFeedback({ type: "success", message: "¡Canción sugerida con éxito! Ya fue añadida a la lista." });
      setTitle("");
      setArtist("");

      // Confetti celebration
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#1DB954", "#0552AC", "#D4AF37"],
        });
      } catch {
        // Confetti fallback
      }

      setTimeout(() => {
        setIsModalOpen(false);
      }, 1600);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al enviar recomendación" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const guestRecommendedCount = tracks.filter((t) => Boolean(t.requestedByGuestName)).length;

  return (
    <div className="lg:col-span-6 bg-white p-6 md:p-8 rounded-3xl border border-[#0552AC]/15 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0552AC] via-[#1DB954] to-[#D4AF37]" />

      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1DB954] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1DB954] font-cinzel">
                Spotify Oficial • D'CAROL XV
              </span>
            </div>
            <h3 className="font-headline text-xl md:text-2xl text-[#001F54] font-bold">
              {initialPlaylist?.title || "Música de la Celebración"}
            </h3>
          </div>

          {/* Quick CTA to open in Spotify */}
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/30 text-[#1DB954] text-xs font-bold transition shadow-2xs hover:scale-102 cursor-pointer shrink-0 w-fit"
            title="Abrir playlist en Spotify"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span>Escuchar en Spotify</span>
          </a>
        </div>

        <p className="text-xs md:text-sm text-[#4B5B76] leading-relaxed mb-5">
          {initialPlaylist?.description ||
            "Melodías seleccionadas con amor y canciones sugeridas por invitados para bailar y disfrutar juntos."}
        </p>

        {/* Action Callout: Recomendar Canción */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-emerald-50/40 to-amber-50/50 border border-[#0552AC]/15 flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0552AC] text-white flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[20px]">queue_music</span>
            </div>
            <div>
              <span className="font-bold text-xs text-[#001F54] block leading-tight">
                ¿Qué canción quieres bailar con Dannia?
              </span>
              <span className="text-[11px] text-[#4B5B76]">
                Suma tus temas favoritos al repertorio de la velada.
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenModal}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-[#0552AC]/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-98"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Sugerir Canción</span>
          </button>
        </div>

        {/* Track list */}
        <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
          {tracks.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Aún no hay canciones cargadas. ¡Sé el primero en recomendar una!
            </p>
          ) : (
            tracks.map((track, idx) => {
              const isGuestSuggested = Boolean(track.requestedByGuestName);
              return (
                <div
                  key={track.id || idx}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isGuestSuggested
                      ? "bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/70"
                      : "bg-[#F8FAFD] border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                        isGuestSuggested
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-[#E8F0FE] text-[#0552AC]"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-[#001F54] truncate">
                          {track.title}
                        </span>
                        {isGuestSuggested && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider">
                            Sugerida por {track.requestedByGuestName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#4B5B76] block truncate">{track.artist}</span>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">
                    {isGuestSuggested ? "favorite" : "graphic_eq"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer bar with counter & Spotify collaborate link */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#4B5B76]">
        <span>
          <strong>{tracks.length}</strong> canciones en lista
          {guestRecommendedCount > 0 && ` (${guestRecommendedCount} aportadas por invitados)`}
        </span>
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1DB954] hover:underline font-bold flex items-center gap-1"
        >
          <span>Abrir playlist colaborativa en Spotify</span>
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </a>
      </div>

      {/* MODAL: Recomendar Canción */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="animate-in fade-in zoom-in-95 duration-300 bg-white rounded-3xl border border-[#0552AC]/20 shadow-2xl max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1DB954] to-emerald-400 text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[22px]">music_note</span>
              </div>
              <div>
                <h4 className="font-headline font-bold text-lg text-[#001F54]">
                  Recomendar una Canción
                </h4>
                <p className="text-[11px] text-[#4B5B76]">
                  Tu sugerencia se sumará a la playlist de la noche de Dannia.
                </p>
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {feedback.type === "success" ? "check_circle" : "error"}
                </span>
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleRecommendSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#001F54] mb-1 font-cinzel">
                  Nombre de la Canción *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Danza Kuduro, Vivir Mi Vida, Perfect..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0552AC] focus:ring-2 focus:ring-[#0552AC]/20 text-xs text-[#0D1829] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#001F54] mb-1 font-cinzel">
                  Artista o Grupo *
                </label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ej: Marc Anthony, Don Omar, Ed Sheeran..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0552AC] focus:ring-2 focus:ring-[#0552AC]/20 text-xs text-[#0D1829] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#001F54] mb-1 font-cinzel">
                  Tu Nombre (Para dedicar la canción)
                </label>
                <input
                  type="text"
                  value={suggesterName}
                  onChange={(e) => setSuggesterName(e.target.value)}
                  placeholder="Ej: Tía Sofía, Primo Carlos, Amigos de Colegio..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0552AC] focus:ring-2 focus:ring-[#0552AC]/20 text-xs text-[#0D1829] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1aa34a] text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-[#1DB954]/25 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{isSubmitting ? "Agregando..." : "Sumar a Playlist"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
