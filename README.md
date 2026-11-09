# DevFlow Events · Showcase & Demo Interactivo 🌟

Plataforma de alta tecnología para eventos de gala (Quinceañeras, Bodas, Aniversarios y Eventos VIP) desarrollada por **DevFlow**.

Esta versión es un **Showcase / Portafolio 100% Funcional** diseñado para presentaciones comerciales y demostraciones interactivas a clientes:
- **$0 Costo de Servidores:** 100% en memoria con reactividad en tiempo real y persistencia en `localStorage`. Sin bases de datos externas ni credenciales activas.
- **Protección Anticopia de Portafolio:** Marcas de agua diagonales en pases digitales, selector de invitados de prueba y botón de conversión directa hacia WhatsApp de DevFlow.
- **Rendimiento Ultrarrápido:** Construido con Next.js 16, React 19, Tailwind CSS v4 y desplegado como páginas estáticas en Vercel Edge Network.

---

## 🚀 Módulos Incluidos

1. **Invitación Digital Interactiva (`/`)**
   - Música sincronizada con reproductor elegante.
   - Cuenta regresiva milimétrica hacia la fecha del evento.
   - Itinerario de gala con timeline visual.
   - Ubicación en 1 toque (Waze y Google Maps).
   - Código de vestimenta con visualización de colores reservados.
   - Formulario interactivo de confirmación RSVP.
   - Generador y visor del Pase Digital VIP con código QR intransferible.

2. **Dashboard Ejecutivo en Tiempo Real (`/admin`)**
   - KPIs de aforo en salón y ocupación porcentual.
   - Pases validados vs cupos totales.
   - Lista maestra de invitados con búsqueda instantánea, filtrado y alternancia de estado RSVP con 1 clic.

3. **Escáner de Acceso Express en Puerta (`/admin/checkin`)**
   - Validación de códigos QR en menos de 0.5s.
   - Detección automática de pases duplicados o fraudulentos.
   - Sintetizador de audio con Web Audio API (bips en vivo sin archivos de audio externos).
   - Simulador rápido de prueba con 1 toque.

4. **Plano de Mesas Interactivo (`/admin/tables`)**
   - Mapeo de 35 mesas con diferenciación de Mesa de Honor.
   - Consulta instantánea de comensales y cupos asignados por mesa.

5. **Muro Social en Pantalla Gigante LED (`/live`)**
   - Modo de proyección para salones de fiesta y escenarios LED.
   - Carrusel rotativo en tiempo real de dedicatorias y fotos aprobadas.
   - Código QR en pantalla para que los invitados suban selfies desde sus mesas.

6. **Panel de Moderación en Vivo (`/admin/moderation`)**
   - Cola de revisión antes de proyección para el anfitrión.
   - Aprobación o descarte de fotos en 1 clic.

7. **Portal Móvil de Recuerdos (`/recuerdos`)**
   - Subida de fotos directamente convertidas a Base64 sin consumo de almacenamiento en la nube.

---

## 🛠️ Tecnologías

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS v4, Lucide React
- **QR & FX:** qrcode, canvas-confetti
- **Audio:** Web Audio API nativo
- **Desarrollado por:** DevFlow (contacto: +505 8272 5817)
