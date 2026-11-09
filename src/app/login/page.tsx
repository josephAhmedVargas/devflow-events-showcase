"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "@/demo/auth";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (urlError) {
      if (urlError === "CredentialsSignin") {
        setErrorMessage("Credenciales no reconocidas. Verifica tu correo y contraseña.");
      } else {
        setErrorMessage("Error de autenticación. Por favor intenta de nuevo.");
      }
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");

    // Safety timeout: Ensure loading never hangs infinitely
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
      setErrorMessage("El servidor tardó en responder. Verifica tu conexión e intenta de nuevo.");
    }, 9000);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      clearTimeout(safetyTimer);

      // Si NextAuth devolvió un error
      if (!res || res.error || (res.url && res.url.includes("error="))) {
        setErrorMessage("Credenciales no reconocidas. Verifica tu correo y contraseña.");
        setIsLoading(false);
        return;
      }

      // Éxito: Redirección directa a nivel de ventana para forzar envío limpio de cookies
      const destination = (res.url && !res.url.includes("error=")) ? res.url : callbackUrl;
      window.location.href = destination;
    } catch (err: any) {
      clearTimeout(safetyTimer);
      console.error("Login exception:", err);
      setErrorMessage(err?.message || "Error al conectar con el servidor de autenticación.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 relative z-10 flex flex-col gap-6">
      {/* Header with Monogram */}
      <div className="flex flex-col items-center text-center gap-2">
        <Link
          href="/"
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0552AC] to-[#001F54] flex items-center justify-center text-[#D4AF37] ring-4 ring-[#D4AF37]/30 shadow-md mb-2 cursor-pointer"
        >
          <span className="font-cinzel text-xl font-bold tracking-wider">DC</span>
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
          D&apos;CAROL — Mis XV 2026
        </span>
        <h1 className="font-headline text-2xl font-bold text-[#0D1829]">
          Centro de Mando
        </h1>
        <p className="text-xs text-slate-500">
          Acceso protegido para coordinación, anfitriones y control de gala en Hotel Holiday Inn Managua.
        </p>
      </div>

      {/* Redirect notice if redirected from protected page */}
      {callbackUrl && callbackUrl !== "/admin" && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-amber-600">lock</span>
          <span>Por favor inicia sesión para acceder a la sección solicitada.</span>
        </div>
      )}


      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Demo: acceso de un clic, sin credenciales reales */}
      <button
        type="button"
        disabled={isLoading}
        onClick={async () => {
          setIsLoading(true);
          const res = await signIn("credentials", { redirect: false, callbackUrl });
          window.location.href = res.url;
        }}
        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-br from-[#0552AC] to-[#001F54] text-white text-sm font-semibold shadow-lg shadow-[#0552AC]/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">bolt</span>
        <span>Entrar como Coordinador de Demo</span>
      </button>
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold">
        <span className="h-px flex-1 bg-slate-200" />
        <span>o con cualquier correo</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Correo Electrónico
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              mail
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-correo@ejemplo.com"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0552AC] focus:bg-white transition"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Contraseña
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              lock
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0552AC] focus:bg-white transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] transition text-xs font-semibold shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin text-[#D4AF37]">
                progress_activity
              </span>
              <span>Autenticando...</span>
            </>
          ) : (
            <>
              <span>Ingresar al Centro de Mando</span>
              <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">
                arrow_forward
              </span>
            </>
          )}
        </button>
      </form>

      {/* Security badge & back link */}
      <div className="pt-2 flex flex-col items-center gap-2 text-center border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="material-symbols-outlined text-[14px] text-emerald-600">verified_user</span>
          <span>Demo DevFlow · sesión guardada solo en este navegador</span>
        </div>
        <Link
          href="/"
          className="text-xs font-medium text-slate-500 hover:text-[#0552AC] transition-colors"
        >
          ← Volver a la Invitación Pública
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col items-center justify-center p-4 selection:bg-[#0552AC] selection:text-white relative">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#0552AC]/10 via-[#D4AF37]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 flex items-center justify-center py-20">
            <span className="w-6 h-6 rounded-full border-2 border-[#0552AC] border-t-transparent animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
