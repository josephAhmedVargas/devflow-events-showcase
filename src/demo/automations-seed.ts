// Reglas de automatización (copiadas de la app real)
export const DEFAULT_AUTOMATIONS = [
  {
    name: "Invitación Oficial con Enlace Mágico",
    triggerType: "manual_broadcast",
    triggerConfig: {
      targetFilter: "all",
      phase: "pre_event",
      label: "Pre-Evento / Bienvenida",
      description: "Envío inicial con enlace personalizado y cupos asignados",
    },
    actionType: "send_whatsapp",
    actionConfig: {
      category: "invitation",
      template:
        "✨ *DANNIA CAROLINA • MIS XV AÑOS* ✨\n\nEstimado/a *{{guest_name}}*,\n\n_“Hay momentos en la vida que se vuelven inolvidables cuando los compartimos con las personas que queremos.”_\n\nCon mucha alegría y emoción, quiero invitarte a celebrar conmigo la llegada de mis 15 años, una etapa llena de sueños, ilusiones y nuevos comienzos. Será un día muy especial para mí, y me encantaría contar con tu presencia para hacerlo aún más inolvidable.\n\n📅 *Fecha:* Viernes 4 de Diciembre de 2026 • 6:00 PM\n📍 *Lugar:* Hotel Holiday Inn Managua\n🎟️ *Pases Reservados:* {{seats}} lugares de honor\n\nPuedes ver tu invitación formal, confirmar tu asistencia y recomendarnos tus canciones favoritas aquí:\n👉 {{magic_link}}\n\n_“Jehová cumplirá su propósito en mí; Tu misericordia, oh Jehová, es para siempre.” — Salmos 138:8_\n\n¡Espero verte y compartir juntos esta noche tan especial! 💕✨",
    },
    isActive: true,
  },
  {
    name: "Recordatorio RSVP (Cierre 20 de Noviembre)",
    triggerType: "relative_to_event_date",
    triggerConfig: {
      offsetDays: -14,
      targetFilter: "pending_rsvp",
      phase: "pre_event",
      label: "14 Días Antes del Límite",
      description: "Recordatorio a invitados que aún no confirman asistencia",
    },
    actionType: "send_whatsapp",
    actionConfig: {
      category: "reminder",
      template:
        "✨ *RECORDATORIO • DANNIA CAROLINA XV* ✨\n\nHola *{{guest_name}}*,\nTe recordamos con mucho cariño que la fecha límite para confirmar tu asistencia es el *20 de Noviembre de 2026*.\n\nPor favor confirma tus {{seats}} lugares aquí:\n👉 {{magic_link}}\n\n¡Tu presencia hará esta noche aún más especial!",
    },
    isActive: true,
  },
  {
    name: "Asignación de Mesa & Pase Digital Oficial (24h-48h antes)",
    triggerType: "relative_to_event_date",
    triggerConfig: {
      offsetDays: -2,
      targetFilter: "confirmed_only",
      phase: "event_day",
      label: "24h - 48h Antes del Evento",
      description: "Envío del pase digital con QR y número de mesa asignada",
    },
    actionType: "send_whatsapp",
    actionConfig: {
      category: "digital_pass",
      template:
        "🎫 *TU PASE DIGITAL DE ACCESO • DANNIA CAROLINA XV* 🎫\n\n¡Hola *{{guest_name}}*! Ya casi llega el gran día.\n\n📍 *Tu Ubicación:* {{table_info}}\n🎟️ *Lugares Confirmados:* {{seats}}\n\nPor favor ten a mano tu código QR al llegar al Hotel Holiday Inn Managua:\n👉 {{pass_link}}\n\n¡Nos vemos este Viernes 4 de Diciembre a las 6:00 PM!",
    },
    isActive: true,
  },
  {
    name: "Agradecimiento & Libro de Recuerdos (Post-Evento)",
    triggerType: "relative_to_event_date",
    triggerConfig: {
      offsetDays: 1,
      targetFilter: "attended_or_confirmed",
      phase: "post_event",
      label: "1 Día Post-Evento",
      description: "Mensaje de agradecimiento y enlace al álbum y dedicatorias",
    },
    actionType: "send_whatsapp",
    actionConfig: {
      category: "thank_you",
      template:
        "💖 *GRACIAS POR ACOMPAÑARME • DANNIA CAROLINA* 💖\n\nQuerido/a *{{guest_name}}*,\n¡Muchísimas gracias por haber sido parte de mi noche soñada de Quince Años!\n\nPuedes revivir los mejores momentos, ver las fotos del evento y dejarme un lindo deseo en mi Libro de Recuerdos digital:\n👉 {{recuerdos_link}}\n\nCon todo mi cariño, Dannia Carolina.",
    },
    isActive: true,
  },
];
