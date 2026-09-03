"use client"

import { create } from "zustand"

interface SelectedProjectState {
  selected: string | undefined
  select: (name: string) => void
  clear: () => void
}

const useSelectedProjectStore = create<SelectedProjectState>()((set) => ({
  selected: undefined,
  select: (name) => set({ selected: name }),
  clear: () => set({ selected: undefined }),
}))

// Selector hooks — components subscribe to slices, never the whole store.
export const useSelectedProject = () =>
  useSelectedProjectStore((s) => s.selected)

export const useSelectProject = () =>
  useSelectedProjectStore((s) => s.select)
