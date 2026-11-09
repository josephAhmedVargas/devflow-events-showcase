"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  INITIAL_EVENT_SETTINGS,
  INITIAL_GUESTS,
  INITIAL_TABLES,
  INITIAL_PHOTOS,
  DemoGuest,
  DemoTable,
  DemoPhoto,
} from "../mock/demoData";

interface CheckInResult {
  success: boolean;
  reason?: "NOT_FOUND" | "ALREADY_CHECKED_IN" | "DECLINED" | "VALID";
  guest?: DemoGuest;
}

interface DemoContextType {
  eventSettings: typeof INITIAL_EVENT_SETTINGS;
  guests: DemoGuest[];
  tables: DemoTable[];
  photos: DemoPhoto[];
  checkInHistory: { guest: DemoGuest; time: string; status: string }[];
  confirmRsvp: (guestId: string, seats: number, notes?: string) => boolean;
  updateGuestStatus: (guestId: string, status: "CONFIRMED" | "PENDING" | "DECLINED") => void;
  toggleCheckIn: (guestId: string) => void;
  checkInGuest: (code: string) => CheckInResult;
  uploadPhoto: (author: string, message: string, dataUrl: string, tableNumber?: number) => void;
  updatePhotoStatus: (photoId: string, status: "APPROVED" | "REJECTED") => void;
  likePhoto: (photoId: string) => void;
  resetDemo: () => void;
  selectedGuestForPass: DemoGuest | null;
  setSelectedGuestForPass: (guest: DemoGuest | null) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guests, setGuests] = useState<DemoGuest[]>(INITIAL_GUESTS);
  const [tables] = useState<DemoTable[]>(INITIAL_TABLES);
  const [photos, setPhotos] = useState<DemoPhoto[]>(INITIAL_PHOTOS);
  const [checkInHistory, setCheckInHistory] = useState<
    { guest: DemoGuest; time: string; status: string }[]
  >([]);
  const [selectedGuestForPass, setSelectedGuestForPass] = useState<DemoGuest | null>(
    INITIAL_GUESTS[0]
  );

  // Load from localStorage if present
  useEffect(() => {
    try {
      const savedGuests = localStorage.getItem("devflow_demo_guests");
      const savedPhotos = localStorage.getItem("devflow_demo_photos");
      if (savedGuests) setGuests(JSON.parse(savedGuests));
      if (savedPhotos) setPhotos(JSON.parse(savedPhotos));
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const persistGuests = (newGuests: DemoGuest[]) => {
    setGuests(newGuests);
    try {
      localStorage.setItem("devflow_demo_guests", JSON.stringify(newGuests));
    } catch {
      // ignore
    }
  };

  const persistPhotos = (newPhotos: DemoPhoto[]) => {
    setPhotos(newPhotos);
    try {
      localStorage.setItem("devflow_demo_photos", JSON.stringify(newPhotos));
    } catch {
      // ignore
    }
  };

  const confirmRsvp = (guestId: string, seats: number, notes?: string) => {
    const updated = guests.map((g) => {
      if (g.id === guestId) {
        return {
          ...g,
          confirmedSeats: seats,
          status: "CONFIRMED" as const,
          notes: notes ? `${g.notes || ""} | ${notes}` : g.notes,
        };
      }
      return g;
    });
    persistGuests(updated);
    return true;
  };

  const updateGuestStatus = (guestId: string, status: "CONFIRMED" | "PENDING" | "DECLINED") => {
    const updated = guests.map((g) => (g.id === guestId ? { ...g, status } : g));
    persistGuests(updated);
  };

  const toggleCheckIn = (guestId: string) => {
    const updated = guests.map((g) => {
      if (g.id === guestId) {
        const nextState = !g.checkedIn;
        return {
          ...g,
          checkedIn: nextState,
          checkedInAt: nextState
            ? new Date().toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })
            : undefined,
        };
      }
      return g;
    });
    persistGuests(updated);
  };

  const checkInGuest = (code: string): CheckInResult => {
    const cleanCode = code.trim().toUpperCase();
    const guest = guests.find(
      (g) => g.code.toUpperCase() === cleanCode || g.id === cleanCode
    );

    if (!guest) {
      return { success: false, reason: "NOT_FOUND" };
    }

    if (guest.checkedIn) {
      return { success: false, reason: "ALREADY_CHECKED_IN", guest };
    }

    if (guest.status === "DECLINED") {
      return { success: false, reason: "DECLINED", guest };
    }

    const now = new Date().toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" });
    const updatedGuest = { ...guest, checkedIn: true, checkedInAt: now };

    const newGuests = guests.map((g) => (g.id === guest.id ? updatedGuest : g));
    persistGuests(newGuests);

    setCheckInHistory((prev) => [
      { guest: updatedGuest, time: now, status: "PERMITIDO" },
      ...prev,
    ]);

    return { success: true, reason: "VALID", guest: updatedGuest };
  };

  const uploadPhoto = (
    author: string,
    message: string,
    dataUrl: string,
    tableNumber?: number
  ) => {
    const newPhoto: DemoPhoto = {
      id: `p_${Date.now()}`,
      author: author || "Invitado Especial",
      message: message || "¡Muchas felicidades!",
      imageUrl: dataUrl,
      createdAt: "Hace un momento",
      status: "APPROVED",
      likes: 1,
      tableNumber,
    };
    persistPhotos([newPhoto, ...photos]);
  };

  const updatePhotoStatus = (photoId: string, status: "APPROVED" | "REJECTED") => {
    const updated = photos.map((p) => (p.id === photoId ? { ...p, status } : p));
    persistPhotos(updated);
  };

  const likePhoto = (photoId: string) => {
    const updated = photos.map((p) => (p.id === photoId ? { ...p, likes: p.likes + 1 } : p));
    persistPhotos(updated);
  };

  const resetDemo = () => {
    try {
      localStorage.removeItem("devflow_demo_guests");
      localStorage.removeItem("devflow_demo_photos");
    } catch {
      // ignore
    }
    setGuests(INITIAL_GUESTS);
    setPhotos(INITIAL_PHOTOS);
    setCheckInHistory([]);
    setSelectedGuestForPass(INITIAL_GUESTS[0]);
  };

  return (
    <DemoContext.Provider
      value={{
        eventSettings: INITIAL_EVENT_SETTINGS,
        guests,
        tables,
        photos,
        checkInHistory,
        confirmRsvp,
        updateGuestStatus,
        toggleCheckIn,
        checkInGuest,
        uploadPhoto,
        updatePhotoStatus,
        likePhoto,
        resetDemo,
        selectedGuestForPass,
        setSelectedGuestForPass,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};
