/**
 * Reemplazo de `next-auth/react` para la demo: sesión de coordinador en
 * localStorage, sin servidor de autenticación.
 */
"use client";

import { setAdminSession } from "./db";

export async function signIn(
  _provider: string,
  opts: { email?: string; password?: string; redirect?: boolean; callbackUrl?: string } = {}
) {
  await new Promise((r) => setTimeout(r, 450));
  setAdminSession(true);
  const url = opts.callbackUrl || "/admin";
  if (opts.redirect !== false) window.location.href = url;
  return { ok: true, error: null as string | null, status: 200, url };
}

export async function signOut(opts: { callbackUrl?: string; redirect?: boolean } = {}) {
  setAdminSession(false);
  if (opts.redirect !== false) window.location.href = opts.callbackUrl || "/";
  return { url: opts.callbackUrl || "/" };
}
