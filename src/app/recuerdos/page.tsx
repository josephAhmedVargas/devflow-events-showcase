import type { Metadata } from "next";
import RecuerdosView from "@/views/RecuerdosView";

export const metadata: Metadata = {
  title: "El Libro Eterno de Dannia Carolina | Demo DevFlow Events",
  description: "Archivo digital conmemorativo, carta de gratitud, galería fotográfica y dedicatorias de gala.",
};

export default function RecuerdosPage() {
  return <RecuerdosView />;
}
