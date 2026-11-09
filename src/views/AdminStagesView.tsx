"use client";

import { StagePhotosManager } from "@/components/admin/StagePhotosManager";
import type { StagePhoto } from "@/lib/stages-data";
import { useDemoDb } from "@/demo/db";

export default function AdminStagesView() {
  const db = useDemoDb();
  const etapasSection = { title: db.stages.title, subtitle: db.stages.subtitle };
  let photos: StagePhoto[] = db.stages.photos;
  // Sort by sortOrder
  photos = [...photos].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const stats = {
    totalPhotos: photos.length,
    withExif: photos.filter((p) => p.takenAt || p.cameraInfo).length,
    stagesCount: new Set(photos.map((p) => p.stageKey)).size,
    featuredCount: photos.filter((p) => p.isFeatured).length,
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 pt-6 pb-24 flex flex-col gap-6 max-w-[1560px] mx-auto w-full">
      <StagePhotosManager
        initialPhotos={photos}
        initialTitle={etapasSection?.title}
        initialSubtitle={etapasSection?.subtitle}
        stats={stats}
      />
    </div>
  );
}
