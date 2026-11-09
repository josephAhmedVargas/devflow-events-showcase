import { Metadata } from "next";
import { TableManagementView } from "@/components/admin/TableManagementView";

export const metadata: Metadata = {
  title: "Plano de Mesas & Seating Chart | D'CAROL XV",
  description: "Distribución de las 20 mesas de banquete, aforo y balance de asientos para los Quince Años.",
};

export default function AdminTablesPage() {
  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8 max-w-[1560px] mx-auto w-full pb-16">
      <TableManagementView />
    </div>
  );
}
