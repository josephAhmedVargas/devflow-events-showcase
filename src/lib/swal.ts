import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// D'CAROL Luxury Theme Mixin
export const DcarolSwal = Swal.mixin({
  customClass: {
    popup: "rounded-3xl border border-slate-200/80 shadow-2xl p-6 font-sans text-slate-800",
    title: "font-headline text-xl font-bold text-[#0D1829] tracking-tight",
    htmlContainer: "text-xs text-slate-600 leading-relaxed",
    confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-md active:scale-95 cursor-pointer mx-1.5",
    cancelButton: "px-4 py-2.5 rounded-xl font-semibold text-xs transition bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 cursor-pointer mx-1.5",
    denyButton: "px-4 py-2.5 rounded-xl font-semibold text-xs transition bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer mx-1.5",
  },
  buttonsStyling: false,
  background: "#FFFFFF",
  backdrop: "rgba(13, 24, 41, 0.65)",
});

/**
 * Confirm logout modal with D'CAROL branding
 */
export async function confirmLogout(): Promise<boolean> {
  const result = await DcarolSwal.fire({
    title: "¿Cerrar Sesión de Coordinación?",
    text: "Se cerrará el acceso al Centro de Mando y deberás ingresar tus credenciales nuevamente.",
    icon: "question",
    iconColor: "#D4AF37",
    showCancelButton: true,
    confirmButtonText: "Sí, Cerrar Sesión",
    cancelButtonText: "Permanecer Aquí",
    customClass: {
      popup: "rounded-3xl border border-slate-200/80 shadow-2xl p-6 font-sans text-slate-800",
      title: "font-headline text-xl font-bold text-[#0D1829]",
      htmlContainer: "text-xs text-slate-600 leading-relaxed mt-2",
      confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs bg-[#0552AC] hover:bg-[#001F54] text-white shadow-md active:scale-95 cursor-pointer mx-1.5",
      cancelButton: "px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 cursor-pointer mx-1.5",
    },
    reverseButtons: true,
  });

  return result.isConfirmed;
}

/**
 * Confirm destructive deletion modal
 */
export async function confirmDelete(itemName: string, customMessage?: string): Promise<boolean> {
  const result = await DcarolSwal.fire({
    title: `¿Eliminar "${itemName}"?`,
    text: customMessage || "Esta acción es permanente y no se podrá deshacer.",
    icon: "warning",
    iconColor: "#E11D48",
    showCancelButton: true,
    confirmButtonText: "Sí, Eliminar",
    cancelButtonText: "Cancelar",
    customClass: {
      popup: "rounded-3xl border border-slate-200/80 shadow-2xl p-6 font-sans text-slate-800",
      title: "font-headline text-xl font-bold text-[#0D1829]",
      htmlContainer: "text-xs text-slate-600 leading-relaxed mt-2",
      confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer mx-1.5",
      cancelButton: "px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 cursor-pointer mx-1.5",
    },
    reverseButtons: true,
  });

  return result.isConfirmed;
}

/**
 * Generic confirmation dialog
 */
export async function confirmAction({
  title,
  text,
  confirmButtonText = "Confirmar",
  cancelButtonText = "Cancelar",
  isDestructive = false,
  icon = "question",
}: {
  title: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDestructive?: boolean;
  icon?: "warning" | "question" | "info" | "success" | "error";
}): Promise<boolean> {
  const result = await DcarolSwal.fire({
    title,
    text,
    icon,
    iconColor: isDestructive ? "#E11D48" : icon === "info" ? "#0552AC" : "#D4AF37",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    customClass: {
      popup: "rounded-3xl border border-slate-200/80 shadow-2xl p-6 font-sans text-slate-800",
      title: "font-headline text-xl font-bold text-[#0D1829]",
      htmlContainer: "text-xs text-slate-600 leading-relaxed mt-2",
      confirmButton: `px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md active:scale-95 cursor-pointer mx-1.5 ${
        isDestructive
          ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
          : "bg-[#0552AC] hover:bg-[#001F54] shadow-[#0552AC]/20"
      }`,
      cancelButton: "px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 cursor-pointer mx-1.5",
    },
    reverseButtons: true,
  });

  return result.isConfirmed;
}

/**
 * Success alert
 */
export async function showSuccessAlert(title: string, text?: string) {
  return DcarolSwal.fire({
    title,
    text,
    icon: "success",
    iconColor: "#10B981",
    confirmButtonText: "Entendido",
    customClass: {
      popup: "rounded-3xl border border-slate-200/80 shadow-2xl p-6 font-sans text-slate-800",
      title: "font-headline text-xl font-bold text-[#0D1829]",
      htmlContainer: "text-xs text-slate-600 leading-relaxed mt-2",
      confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs bg-[#0552AC] hover:bg-[#001F54] text-white shadow-md active:scale-95 cursor-pointer",
    },
    timer: 3000,
    timerProgressBar: true,
  });
}

/**
 * Error alert
 */
export async function showErrorAlert(title: string, text?: string) {
  return DcarolSwal.fire({
    title,
    text,
    icon: "error",
    iconColor: "#E11D48",
    confirmButtonText: "Cerrar",
    customClass: {
      popup: "rounded-3xl border border-slate-200/80 shadow-2xl p-6 font-sans text-slate-800",
      title: "font-headline text-xl font-bold text-[#0D1829]",
      htmlContainer: "text-xs text-slate-600 leading-relaxed mt-2",
      confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95 cursor-pointer",
    },
  });
}

/**
 * Luxury Floating Toast
 */
export function showToast(title: string, icon: "success" | "error" | "warning" | "info" = "success") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
    customClass: {
      popup: "rounded-2xl border border-slate-200 shadow-xl px-4 py-3 bg-white text-xs font-semibold text-slate-800",
    },
  });

  Toast.fire({
    icon,
    title,
  });
}

export default DcarolSwal;
