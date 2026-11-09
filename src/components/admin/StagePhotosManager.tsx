"use client";

import { useState, useRef, useTransition, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { StagePhoto } from "@/lib/stages-data";
import { LIFE_STAGES, analyzeFileMetadata, ExifMetadataResult, sortPhotosChronologically } from "@/lib/exif-parser";
import { showSuccessAlert, showErrorAlert, showToast, confirmDelete } from "@/lib/swal";

interface StagePhotosManagerProps {
  initialPhotos: StagePhoto[];
  initialTitle?: string | null;
  initialSubtitle?: string | null;
  stats: {
    totalPhotos: number;
    withExif: number;
    stagesCount: number;
    featuredCount: number;
  };
}

interface QueuedFile {
  file: File;
  previewUrl: string;
  metadata: ExifMetadataResult;
  title: string;
  caption: string;
  stageKey: string;
  year: number;
  status: "idle" | "uploading" | "success" | "error";
  progress?: number;
}

export function StagePhotosManager({
  initialPhotos,
  initialTitle,
  initialSubtitle,
  stats: initialStats,
}: StagePhotosManagerProps) {
  const [photos, setPhotos] = useState<StagePhoto[]>(initialPhotos);
  const [title, setTitle] = useState(initialTitle || "El Álbum de Mi Vida: De Niña a Quinceañera");
  const [subtitle, setSubtitle] = useState(initialSubtitle || "Un viaje fotográfico por las etapas que forjaron mi corazón");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  // Search & Pagination State for 100+ photos
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(24);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit Photo Modal
  const [editingPhoto, setEditingPhoto] = useState<StagePhoto | null>(null);

  // Filtered & Searched photos (derived)
  const searchedPhotos = useMemo(() => {
    let result = photos;
    if (activeFilter !== "all") {
      result = result.filter((p) => p.stageKey === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.caption?.toLowerCase().includes(q) ||
          p.cameraInfo?.toLowerCase().includes(q) ||
          String(p.year).includes(q)
      );
    }
    return result;
  }, [photos, activeFilter, searchQuery]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, pageSize]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(searchedPhotos.length / pageSize));
  const paginatedPhotos = useMemo(() => {
    if (pageSize >= 1000) return searchedPhotos;
    const start = (currentPage - 1) * pageSize;
    return searchedPhotos.slice(start, start + pageSize);
  }, [searchedPhotos, currentPage, pageSize]);

  // Derived stats
  const totalPhotosCount = photos.length;
  const exifDetectedCount = photos.filter((p) => p.takenAt || p.cameraInfo).length;
  const stagesCoveredCount = new Set(photos.map((p) => p.stageKey)).size;
  const featuredCount = photos.filter((p) => p.isFeatured).length;

  // Process files dropped or selected
  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      showToast("Por favor selecciona archivos de imagen válidos", "warning");
      return;
    }

    // Signatures in queue to avoid adding identical files twice
    const queuedSignatures = new Set(
      uploadQueue.map((item) => `${item.file.name.toLowerCase()}_${item.file.size}`)
    );

    // Existing photos to prevent adding already uploaded photos
    const existingPhotoTitles = new Set(
      photos.map((p) => (p.title || "").toLowerCase().trim())
    );

    const newQueued: QueuedFile[] = [];
    let duplicatesCount = 0;

    for (const file of fileArray) {
      const fileSig = `${file.name.toLowerCase()}_${file.size}`;
      const baseNameClean = file.name.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ").toLowerCase().trim();

      if (queuedSignatures.has(fileSig)) {
        duplicatesCount++;
        continue;
      }

      if (existingPhotoTitles.has(baseNameClean)) {
        duplicatesCount++;
        continue;
      }

      queuedSignatures.add(fileSig);

      const previewUrl = URL.createObjectURL(file);
      const metadata = await analyzeFileMetadata(file);

      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ");
      const autoTitle =
        baseName.length > 3 && !baseName.toLowerCase().startsWith("img")
          ? baseName
          : `${metadata.stageLabel} (${metadata.year || 2026})`;

      const autoCaption = `Recuerdo de Dannia Carolina en su etapa de ${metadata.stageLabel.toLowerCase()}.`;

      newQueued.push({
        file,
        previewUrl,
        metadata,
        title: autoTitle,
        caption: autoCaption,
        stageKey: metadata.stageKey,
        year: metadata.year || (metadata.stageKey === "infancia" ? 2012 : 2018),
        status: "idle",
      });
    }

    if (duplicatesCount > 0) {
      showToast(
        `Se omitieron ${duplicatesCount} foto(s) por ser duplicadas o ya existir en el álbum`,
        "warning"
      );
    }

    if (newQueued.length > 0) {
      setUploadQueue((prev) => [...prev, ...newQueued]);
      showToast(`Se agregaron ${newQueued.length} foto(s) a la cola de subida`, "info");
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Remove from queue
  const handleRemoveFromQueue = (index: number) => {
    setUploadQueue((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  // Update queued item metadata
  const handleUpdateQueueItem = (index: number, updates: Partial<QueuedFile>) => {
    setUploadQueue((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Upload entire queue to server with concurrent worker pool (4 parallel uploads for 100+ scalability)
  const handleExecuteBulkUpload = async () => {
    if (uploadQueue.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Upload entire queue sequentially to guarantee zero database update race conditions
    const CONCURRENCY = 1;
    const uploadedNewPhotos: StagePhoto[] = [];
    let completed = 0;

    const uploadWorker = async (index: number) => {
      const item = uploadQueue[index];
      if (!item) return;

      setUploadQueue((prev) => {
        const copy = [...prev];
        if (copy[index]) copy[index].status = "uploading";
        return copy;
      });

      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("stageKey", item.stageKey);
      formData.append("title", item.title);
      formData.append("caption", item.caption);

      try {
        const res = await fetch("/api/admin/stages/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.uploaded && data.uploaded[0]) {
          uploadedNewPhotos.push(data.uploaded[0]);
          setUploadQueue((prev) => {
            const copy = [...prev];
            if (copy[index]) copy[index].status = "success";
            return copy;
          });
        } else {
          setUploadQueue((prev) => {
            const copy = [...prev];
            if (copy[index]) copy[index].status = "error";
            return copy;
          });
        }
      } catch (err) {
        console.error("Upload failed for item", index, err);
        setUploadQueue((prev) => {
          const copy = [...prev];
          if (copy[index]) copy[index].status = "error";
          return copy;
        });
      } finally {
        completed++;
        setUploadProgress(Math.round((completed / uploadQueue.length) * 100));
      }
    };

    const queueIndices = uploadQueue.map((_, i) => i);
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, queueIndices.length) },
      async () => {
        while (queueIndices.length > 0) {
          const nextIndex = queueIndices.shift();
          if (nextIndex !== undefined) {
            await uploadWorker(nextIndex);
          }
        }
      }
    );

    await Promise.all(workers);

    setIsUploading(false);

    if (uploadedNewPhotos.length > 0) {
      // Re-fetch latest photos from server to ensure 100% sync
      try {
        const freshRes = await fetch("/api/stages");
        const freshData = await freshRes.json();
        if (freshData?.photos && Array.isArray(freshData.photos)) {
          setPhotos(freshData.photos);
        } else {
          setPhotos((prev) => [...prev, ...uploadedNewPhotos]);
        }
      } catch {
        setPhotos((prev) => [...prev, ...uploadedNewPhotos]);
      }

      showSuccessAlert(
        "¡Subida Masiva Completada!",
        `Se procesaron y subieron ${uploadedNewPhotos.length} fotos con sus metadatos y optimización WebP.`
      );
      // Clean up queue after short delay
      setTimeout(() => {
        setUploadQueue([]);
        setUploadProgress(0);
      }, 1500);
    } else {
      showErrorAlert("Sin fotos nuevas", "No se subieron fotos nuevas o todas eran duplicadas.");
    }
  };

  // Auto-feature 1 standout photo per life stage
  const handleAutoFeaturePerStage = async () => {
    const stageFeaturedSet = new Set<string>();
    const updated = photos.map((p) => {
      if (!stageFeaturedSet.has(p.stageKey)) {
        stageFeaturedSet.add(p.stageKey);
        return { ...p, isFeatured: true };
      }
      return { ...p, isFeatured: false };
    });

    setPhotos(updated);

    try {
      const res = await fetch("/api/admin/stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: updated, title, subtitle }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccessAlert(
          "¡Recuerdos Destacados!",
          "Se ha seleccionado automáticamente una fotografía destacada para cada etapa de vida."
        );
      }
    } catch (err) {
      console.error("Error setting featured photos:", err);
      showErrorAlert("Error al destacar fotos");
    }
  };

  // Chronological sort by EXIF / Year
  const handleSortChronologically = async () => {
    const sorted = sortPhotosChronologically(photos).map((p, idx) => ({
      ...p,
      sortOrder: idx + 1,
    }));

    setPhotos(sorted);

    // Save to server
    try {
      const res = await fetch("/api/admin/stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: sorted, title, subtitle }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccessAlert(
          "¡Cronología Reordenada!",
          "Todas las fotos del álbum han sido ordenadas cronológicamente por sus metadatos EXIF de menor a mayor fecha."
        );
      }
    } catch (err) {
      console.error("Error saving sorted photos:", err);
      showErrorAlert("Error al guardar orden cronológico");
    }
  };

  // Reorder single photo (move up / down)
  const handleMovePhoto = async (photoId: string, direction: "prev" | "next") => {
    const list = searchedPhotos;
    const indexInList = list.findIndex((p) => p.id === photoId);
    if (indexInList === -1) return;
    const targetIndexInList = direction === "prev" ? indexInList - 1 : indexInList + 1;
    if (targetIndexInList < 0 || targetIndexInList >= list.length) return;

    const photoToMove = list[indexInList];
    const photoTarget = list[targetIndexInList];

    const globalIdxA = photos.findIndex((p) => p.id === photoToMove.id);
    const globalIdxB = photos.findIndex((p) => p.id === photoTarget.id);

    if (globalIdxA === -1 || globalIdxB === -1) return;

    const newPhotos = [...photos];
    const temp = newPhotos[globalIdxA];
    newPhotos[globalIdxA] = newPhotos[globalIdxB];
    newPhotos[globalIdxB] = temp;

    // Re-index sortOrder
    const updated = newPhotos.map((p, i) => ({ ...p, sortOrder: i + 1 }));
    setPhotos(updated);

    // Debounced or direct save
    try {
      await fetch("/api/admin/stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: updated, title, subtitle }),
      });
      showToast("Orden actualizado", "info");
    } catch (err) {
      console.error("Error updating order:", err);
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photo: StagePhoto) => {
    const confirmed = await confirmDelete(photo.title, "Esta foto se eliminará del carrusel de etapas.");
    if (!confirmed) return;

    const remaining = photos.filter((p) => p.id !== photo.id);
    const reordered = remaining.map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
    setPhotos(reordered);

    try {
      const res = await fetch("/api/admin/stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: reordered, title, subtitle }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Foto eliminada correctamente", "success");
      }
    } catch (err) {
      console.error("Error deleting photo:", err);
      showErrorAlert("Error al eliminar la foto");
    }
  };

  // Save edited photo modal
  const handleSaveEditedPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    const stageDef = LIFE_STAGES.find((s) => s.key === editingPhoto.stageKey);
    const stageLabel = stageDef ? stageDef.label : editingPhoto.stageLabel;

    const updatedPhoto: StagePhoto = {
      ...editingPhoto,
      stageLabel,
    };

    const updatedPhotos = photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
    setPhotos(updatedPhotos);
    setEditingPhoto(null);

    try {
      const res = await fetch("/api/admin/stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: updatedPhotos, title, subtitle }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccessAlert("Cambios Guardados", "La información de la foto ha sido actualizada.");
      }
    } catch (err) {
      console.error("Error updating photo:", err);
      showErrorAlert("Error al actualizar la foto");
    }
  };

  // Toggle featured state
  const handleToggleFeatured = async (photo: StagePhoto) => {
    const updatedPhotos = photos.map((p) =>
      p.id === photo.id ? { ...p, isFeatured: !p.isFeatured } : p
    );
    setPhotos(updatedPhotos);

    try {
      await fetch("/api/admin/stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: updatedPhotos, title, subtitle }),
      });
      showToast(photo.isFeatured ? "Foto desmarcada de destacadas" : "Foto marcada como destacada ✨", "info");
    } catch (err) {
      console.error("Error toggling featured:", err);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1560px] mx-auto">
      {/* 1. Planner Header & Quick Actions */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left: Monogram, Title & Subtitle */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0552AC] via-[#001F54] to-[#0D1829] text-[#D4AF37] flex items-center justify-center font-bold font-cinzel text-xl shadow-md ring-2 ring-[#D4AF37]/40 shrink-0">
              DC
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#0552AC] font-cinzel">
                  Coordinaci&oacute;n &amp; Memoria Digital
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#001F54] border border-[#D4AF37]/40 shadow-2xs">
                  Fototeca de Gala
                </span>
              </div>
              <h1 className="font-headline text-xl sm:text-2xl lg:text-3xl font-bold text-[#0D1829] tracking-tight">
                &Aacute;lbum de Etapas: De Ni&ntilde;a a Quincea&ntilde;era
              </h1>
            </div>
          </div>

          {/* Right: Actions Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            <Link
              href="/#etapas-section"
              target="_blank"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#0552AC] hover:bg-[#E8F0FE]/50 text-[#0552AC] text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              <span>Ver Carrusel en Vivo</span>
            </Link>

            <button
              type="button"
              onClick={handleAutoFeaturePerStage}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D4AF37] text-[#001F54] hover:bg-amber-50 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">star</span>
              <span>Auto-Destacar</span>
            </button>

            <button
              type="button"
              onClick={handleSortChronologically}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0552AC] to-[#001F54] text-white hover:brightness-110 text-xs font-bold transition shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">auto_awesome</span>
              <span>Ordenar por Fecha EXIF</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed pt-2 border-t border-slate-100">
          Sube fotograf&iacute;as de manera masiva (soporta decenas a la vez). Nuestro sistema extrae autom&aacute;ticamente la fecha original de captura (EXIF) para clasificar y ordenar cronol&oacute;gicamente la historia de Dannia Carolina desde su ni&ntilde;ez hasta su gala de 15 a&ntilde;os.
        </p>
      </div>

      {/* 2. Telemetry Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Photos */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total de Fotos
            </span>
            <span className="font-headline text-2xl font-bold text-[#0D1829] mt-0.5">
              {totalPhotosCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              En carrusel público
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#E8F0FE] text-[#0552AC] flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">photo_library</span>
          </div>
        </div>

        {/* Metadatos EXIF */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Con Metadatos EXIF
            </span>
            <span className="font-headline text-2xl font-bold text-[#0D1829] mt-0.5">
              {exifDetectedCount}
            </span>
            <span className="text-[10px] text-blue-600 font-semibold mt-1">
              {Math.round((exifDetectedCount / Math.max(totalPhotosCount, 1)) * 100)}% analizadas con fecha
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">camera</span>
          </div>
        </div>

        {/* Etapas Cubiertas */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Etapas de Vida
            </span>
            <span className="font-headline text-2xl font-bold text-[#0D1829] mt-0.5">
              {stagesCoveredCount} / 5
            </span>
            <span className="text-[10px] text-amber-700 font-semibold mt-1">
              Desde 2011 a 2026
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">timeline</span>
          </div>
        </div>

        {/* Destacadas */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Fotos Destacadas
            </span>
            <span className="font-headline text-2xl font-bold text-[#0D1829] mt-0.5">
              {featuredCount}
            </span>
            <span className="text-[10px] text-purple-600 font-semibold mt-1">
              Con insignia de honor
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">star</span>
          </div>
        </div>
      </div>

      {/* 3. Drag & Drop Massive Upload Zone */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline text-lg md:text-xl font-bold text-[#0D1829] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0552AC]">cloud_upload</span>
              <span>Subida Masiva de Fotografías con Extracción EXIF</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Arrastra decenas de fotos simultáneas. Nuestro analizador detecta la fecha original de la cámara (DateTimeOriginal) para clasificar y ordenar automáticamente en la etapa correspondiente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] text-xs font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              <span>Seleccionar Fotos del Disco</span>
            </button>
          </div>
        </div>

        {/* Dropzone Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center gap-3 transition cursor-pointer ${
            isDragging
              ? "border-[#0552AC] bg-[#E8F0FE]/40 scale-[1.01]"
              : "border-slate-300 hover:border-[#D4AF37] hover:bg-slate-50/60"
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-[#E8F0FE] text-[#0552AC] flex items-center justify-center ring-4 ring-[#0552AC]/10 mb-1">
            <span className="material-symbols-outlined text-[32px] text-[#0552AC]">
              upload_file
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-[#0D1829]">
              Arrastra tus fotos aquí o haz clic para explorar
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Soporta JPEG, PNG, WebP • Compresión automática en el navegador
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#0552AC] font-semibold bg-[#E8F0FE]/60 px-3 py-1 rounded-full border border-[#0552AC]/20 mt-1">
            <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
            <span>Extracción de metadatos de cámara (fecha, año, modelo) activada</span>
          </div>
        </div>

        {/* Queue Preview before/during upload */}
        {uploadQueue.length > 0 && (
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#0D1829]">
                  Cola de Procesamiento ({uploadQueue.length} fotos)
                </span>
                <span className="text-[10px] bg-[#E8F0FE] text-[#0552AC] font-bold px-2 py-0.5 rounded-full">
                  Listas para Subir
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUploadQueue([])}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-xs text-slate-600 font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  Vaciar Cola
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkUpload}
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Subiendo ({uploadProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">publish</span>
                      <span>Subir Todo al Álbum ({uploadQueue.length} fotos)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-[width] duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Queue items grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1">
              {uploadQueue.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-slate-200 flex gap-3 items-center relative shadow-2xs group"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative">
                    <img
                      src={item.previewUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.status === "uploading" && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      </div>
                    )}
                    {item.status === "success" && (
                      <div className="absolute inset-0 bg-emerald-600/80 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="absolute inset-0 bg-rose-600/80 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1 gap-1">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateQueueItem(idx, { title: e.target.value })}
                      placeholder="Título de la foto"
                      className="text-xs font-bold text-[#0D1829] border-b border-transparent hover:border-slate-300 focus:border-[#0552AC] focus:outline-none truncate bg-transparent"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <select
                        value={item.stageKey}
                        onChange={(e) => handleUpdateQueueItem(idx, { stageKey: e.target.value })}
                        className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none"
                      >
                        {LIFE_STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label} ({s.era})
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.year}
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-400 flex items-center gap-1 truncate">
                      {item.metadata.hasExif ? (
                        <>
                          <span className="text-emerald-600 font-bold">EXIF</span>
                          <span>• {item.metadata.cameraModel || "Cámara"}</span>
                        </>
                      ) : (
                        <span>Auto-inferido por nombre</span>
                      )}
                    </div>
                  </div>

                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFromQueue(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0 cursor-pointer"
                      title="Quitar de la cola"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Photos Grid, Live Search & Pagination (Optimized for 100+ Photos) */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Stage Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeFilter === "all"
                  ? "bg-[#0552AC] text-white shadow-sm"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas ({photos.length})
            </button>

            {LIFE_STAGES.map((stage) => {
              const countInStage = photos.filter((p) => p.stageKey === stage.key).length;
              const isActive = activeFilter === stage.key;

              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => setActiveFilter(stage.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#0552AC] text-white shadow-sm"
                      : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{stage.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {countInStage}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Page Size Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título o año..."
                className="w-48 sm:w-60 pl-9 pr-7 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0552AC] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span>Mostrar:</span>
              {[24, 48, 1000].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPageSize(sz)}
                  className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                    pageSize === sz
                      ? "bg-[#0552AC] text-white shadow-2xs"
                      : "text-slate-600 hover:text-[#0552AC]"
                  }`}
                >
                  {sz === 1000 ? "Todas" : sz}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 font-medium shrink-0">
              {paginatedPhotos.length} de {searchedPhotos.length} fotos
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        {searchedPhotos.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">photo_library</span>
            </div>
            <h3 className="font-headline text-base font-bold text-[#0D1829]">
              No hay fotos que coincidan
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Prueba cambiando el filtro de etapa o término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {paginatedPhotos.map((photo, index) => {
              const stageDef = LIFE_STAGES.find((s) => s.key === photo.stageKey);

              return (
                <div
                  key={photo.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  {/* Image Container with Badge Overlays */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Stage Tag Overlay */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#001F54]/80 backdrop-blur-md text-[#D4AF37] border border-white/20 shadow-xs flex items-center gap-1 font-cinzel">
                        <span>{photo.stageLabel}</span>
                        <span>•</span>
                        <span className="font-mono text-white">{photo.year}</span>
                      </span>
                    </div>

                    {/* Order index pill */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="w-6 h-6 rounded-full bg-white/90 backdrop-blur-md text-[#0D1829] font-mono text-xs font-bold flex items-center justify-center shadow-xs">
                        {photo.sortOrder}
                      </span>
                    </div>

                    {/* Featured star toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(photo)}
                      className={`absolute bottom-2.5 left-2.5 p-1.5 rounded-lg backdrop-blur-md transition cursor-pointer ${
                        photo.isFeatured
                          ? "bg-[#D4AF37] text-[#001F54] shadow-md"
                          : "bg-black/40 text-white/70 hover:text-white"
                      }`}
                      title={photo.isFeatured ? "Foto Destacada" : "Marcar como Destacada"}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {photo.isFeatured ? "star" : "star_outline"}
                      </span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h4 className="font-headline font-bold text-sm text-[#0D1829] leading-snug line-clamp-1">
                      {photo.title}
                    </h4>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 italic">
                      "{photo.caption}"
                    </p>

                    {/* Camera / Metadata details */}
                    <div className="pt-2 mt-auto border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[12px]">camera</span>
                        <span>{photo.cameraInfo || "Cámara Estándar"}</span>
                      </span>
                      {photo.takenAt && (
                        <span className="font-mono text-[9px]">
                          {new Date(photo.takenAt).toLocaleDateString("es-NI")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Card Controls */}
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                    {/* Move Left / Right */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(photo.id, "prev")}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
                        title="Mover antes en la secuencia"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(photo.id, "next")}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
                        title="Mover después en la secuencia"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingPhoto(photo)}
                        className="p-1.5 rounded-lg hover:bg-[#E8F0FE] text-[#0552AC] transition-colors cursor-pointer"
                        title="Editar detalles y memoria"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                        title="Eliminar de la galería"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Pagination Controls (for 100+ photos) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs mt-2">
            <span className="text-xs text-slate-500 font-medium">
              Página <strong className="text-[#0D1829]">{currentPage}</strong> de{" "}
              <strong className="text-[#0D1829]">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-[#E8F0FE] text-slate-700 hover:text-[#0552AC] text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Anterior</span>
              </button>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>Siguiente</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>



      {/* 6. Edit Photo Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="animate-in fade-in zoom-in-95 duration-300 bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 max-w-lg w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-headline text-lg font-bold text-[#0D1829] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0552AC]">edit_note</span>
                <span>Editar Recuerdo de la Quinceañera</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditedPhoto} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img
                    src={editingPhoto.url}
                    alt={editingPhoto.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 text-xs text-slate-500">
                  <span className="font-bold text-slate-800">Foto ID: {editingPhoto.id.slice(0, 8)}...</span>
                  <span>Orden en carrusel: #{editingPhoto.sortOrder}</span>
                  {editingPhoto.cameraInfo && <span>Cámara: {editingPhoto.cameraInfo}</span>}
                </div>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Título del Recuerdo
                </label>
                <input
                  type="text"
                  required
                  value={editingPhoto.title}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0552AC] focus:bg-white transition font-semibold"
                />
              </div>

              {/* Stage & Year */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Etapa de Vida
                  </label>
                  <select
                    value={editingPhoto.stageKey}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, stageKey: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0552AC] focus:bg-white transition font-semibold"
                  >
                    {LIFE_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label} ({s.era})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Año del Recuerdo
                  </label>
                  <input
                    type="number"
                    min={2011}
                    max={2027}
                    value={editingPhoto.year}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, year: parseInt(e.target.value, 10) || 2026 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0552AC] focus:bg-white transition font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Caption */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Dedicatoria / Descripción Emotiva
                </label>
                <textarea
                  rows={3}
                  value={editingPhoto.caption}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, caption: e.target.value })}
                  placeholder="Escribe la anécdota o emoción detrás de esta fotografía..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0552AC] focus:bg-white transition leading-relaxed"
                />
              </div>

              {/* Featured checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(editingPhoto.isFeatured)}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-[#0552AC] rounded"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0D1829]">Destacar en Carrusel</span>
                  <span className="text-[10px] text-slate-400">Tendrá insignia de honor dorada en la presentación principal</span>
                </div>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
