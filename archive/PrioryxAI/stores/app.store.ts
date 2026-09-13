import { create } from 'zustand';

interface AppState {
  isMoreSheetOpen: boolean;
  setMoreSheetOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isMoreSheetOpen: false,
  setMoreSheetOpen: (open) => set({ isMoreSheetOpen: open }),
  activeTab: 'index',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
