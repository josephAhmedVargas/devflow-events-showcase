# DevFlow Events · Demo interactiva

La plataforma **real** de una gala (XV Años de Dannia Carolina), convertida en una demo que cualquiera puede abrir, usar y enamorarse de ella — **sin costo de servicios**.

- **Mismos componentes que producción.** `src/components/{admin,guest,live,recuerdos,shared}` son copias de la app real (`dannia_xv`), con el mismo diseño.
- **$0 en infraestructura.** No hay base de datos, auth, almacenamiento de fotos ni WhatsApp. Todo vive en el `localStorage` del visitante y el build es 100% estático.
- **Sincronización entre pestañas.** Sube una foto en una pestaña y aparece en `/live` o en moderación en otra (`BroadcastChannel`).
- **Datos ficticios.** 107 titulares, 37 mesas, fotos y dedicatorias de ejemplo; ningún nombre, teléfono o código corresponde a una persona real.

## Cómo funciona

```
Componentes reales ──fetch("/api/...")──▶ src/demo/api.ts  (interceptor en el navegador)
                                              │
                                              ▼
                                       src/demo/db.ts     (localStorage + BroadcastChannel)
                                              ▲
                                       src/demo/seed.ts   (estado inicial reiniciable)
```

| Pieza de producción | Sustituto en la demo |
| --- | --- |
| Neon PostgreSQL + Drizzle | `src/demo/db.ts` (localStorage) |
| 25 rutas `/api/*` | `src/demo/api.ts` responde con el mismo JSON |
| NextAuth | `src/demo/auth.ts` · botón "Entrar como Coordinador de Demo" |
| Cloudflare R2 | Fotos comprimidas a JPEG en el navegador |
| Evolution API (WhatsApp) | Envíos simulados, nunca sale un mensaje |
| Páginas de servidor | `src/views/*` leen el almacén local con `useDemoDb()` |

El **dock DevFlow** (abajo a la derecha) identifica a DevFlow Events, permite saltar entre módulos, reiniciar los datos y cotizar por WhatsApp.

## Rutas

`/` invitación · `/?code=VIP-DC-001` invitación personalizada · `/live` muro en vivo · `/recuerdos` archivo post-evento · `/login` · `/admin` (métricas, invitados, mesas, check-in QR, itinerario, moderación, automatizaciones, álbum de etapas, ajustes).

## Desarrollo

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # export estático, desplegable gratis en Vercel / Netlify / Cloudflare Pages
```

Al cambiar la forma de los datos de la semilla, sube `DB_VERSION` en `src/demo/seed.ts` para que los visitantes reciban datos frescos.

---

Hecho por **DevFlow** · [www.devflow.lat](https://www.devflow.lat)
