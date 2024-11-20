import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {} from "@redux-devtools/extension";
import { Source } from "@/types/source";

interface SourcesState {
  sources: Source[];
  setSources: (sources: Source[]) => void;
  addSource: (source: Source) => void;
  removeSource: (id: number) => void;
}

export const useSourcesStore = create<SourcesState>()(
  devtools(
    persist(
      (set) => ({
        sources: [],
        setSources: (sources) => set({ sources }),
        addSource: (source) =>
          set((state) => ({
            sources: [...state.sources, source],
          })),
        removeSource: (id) =>
          set((state) => ({
            sources: state.sources.filter((source) => source.id !== id),
          })),
      }),
      {
        name: "sources-storage",
      }
    )
  )
);
