/**
 * Almacén local de la demo — sustituye a Neon PostgreSQL.
 *
 * Todo vive en localStorage del visitante: cero servidores, cero costo.
 * Los cambios se propagan entre pestañas abiertas (ej. subir una foto en el
 * teléfono-simulado y verla aparecer en /live) vía BroadcastChannel.
 */
"use client";

import { useSyncExternalStore } from "react";
import { createSeed, DB_VERSION, type DemoDb } from "./seed";

const STORAGE_KEY = "devflow-events-demo-db";
const SESSION_KEY = "devflow-events-demo-admin";

let cache: DemoDb | null = null;
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function load(): DemoDb {
  if (cache) return cache;
  if (!isBrowser()) {
    cache = createSeed();
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDb;
      if (parsed?.version === DB_VERSION) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    /* almacenamiento bloqueado o corrupto → semilla fresca */
  }
  cache = createSeed();
  persist();
  return cache;
}

function persist() {
  if (!isBrowser() || !cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Cuota llena (fotos pesadas): descartamos las subidas más antiguas y reintentamos
    const uploaded = cache.photos.filter((p) => String(p.asset?.publicUrl || "").startsWith("data:"));
    if (uploaded.length > 0) {
      const oldest = uploaded[uploaded.length - 1];
      cache.photos = cache.photos.filter((p) => p.id !== oldest.id);
      persist();
    }
  }
}

function emit(broadcast = true) {
  listeners.forEach((l) => l());
  if (broadcast) channel?.postMessage("changed");
}

if (isBrowser()) {
  try {
    channel = new BroadcastChannel("devflow-events-demo");
    channel.onmessage = () => {
      cache = null;
      load();
      emit(false);
    };
  } catch {
    channel = null;
  }
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      load();
      emit(false);
    }
  });
}

export function getDb(): DemoDb {
  return load();
}

/** Aplica una mutación, persiste y notifica a todas las vistas. */
export function mutate<T>(fn: (db: DemoDb) => T): T {
  const db = load();
  const result = fn(db);
  persist();
  emit();
  return result;
}

export function resetDb() {
  cache = createSeed();
  persist();
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let version = 0;
subscribe(() => {
  version++;
});

/** Hook reactivo: re-renderiza cuando cambia cualquier dato de la demo. */
export function useDemoDb(): DemoDb {
  useSyncExternalStore(
    subscribe,
    () => version,
    () => 0
  );
  return load();
}

/* ── Sesión de coordinador (reemplaza NextAuth) ── */
export const DEMO_ADMIN = {
  name: "Coordinación DevFlow",
  email: "demo@devflow.lat",
};

export function isAdminSession(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminSession(active: boolean) {
  if (!isBrowser()) return;
  try {
    if (active) window.localStorage.setItem(SESSION_KEY, "1");
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
  emit();
}

export function useIsAdmin(): boolean {
  return useSyncExternalStore(subscribe, isAdminSession, () => false);
}

let uid = 0;
export function newId(prefix: string) {
  uid++;
  return `${prefix}-${Date.now().toString(36)}${uid}${Math.random().toString(36).slice(2, 6)}`;
}
