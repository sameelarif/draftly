import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {} from "@redux-devtools/extension"; // required for devtools typing
import { Upload } from "@/types/upload";

interface UploadsState {
  uploads: Upload[];
  setUploads: (uploads: Upload[]) => void;
  addUpload: (upload: Upload) => void;
  removeUpload: (id: string) => void;
}

export const useUploadsStore = create<UploadsState>()(
  devtools(
    persist(
      (set) => ({
        uploads: [],
        setUploads: (uploads) => set({ uploads }),
        addUpload: (upload) =>
          set((state) => ({
            uploads: [...state.uploads, upload],
          })),
        removeUpload: (id) =>
          set((state) => ({
            uploads: state.uploads.filter((upload) => upload.id !== id),
          })),
      }),
      {
        name: "uploads-storage",
      }
    )
  )
);
