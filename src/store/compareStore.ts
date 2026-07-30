"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompareItem {
  id: string;
  name: string;
}

const MAX_COMPARE_ITEMS = 2;

interface CompareState {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // Already in the tray — no-op
          if (state.items.some((i) => i.id === item.id)) {
            return state;
          }
          // At cap — replace the oldest (index 0)
          if (state.items.length >= MAX_COMPARE_ITEMS) {
            return { items: [state.items[1], item] };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      clearItems: () => set({ items: [] }),
    }),
    {
      name: "trueprice-compare",
    }
  )
);
