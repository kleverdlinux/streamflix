import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarOpen: false,
  searchQuery: '',
  currentGenreFilter: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCurrentGenreFilter: (genre) => set({ currentGenreFilter: genre }),
}));
