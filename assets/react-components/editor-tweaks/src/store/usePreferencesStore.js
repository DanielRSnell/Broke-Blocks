import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePreferencesStore = create(
  persist(
    (set, get) => ({
      // Sidebar preferences
      sidebarPosition: 'right', // 'left' or 'right'
      isDrawerOpen: false,

      // Actions
      setSidebarPosition: (position) => set({ sidebarPosition: position }),
      setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
      toggleSidebarPosition: () => set((state) => ({
        sidebarPosition: state.sidebarPosition === 'right' ? 'left' : 'right'
      })),
      toggleDrawer: () => set((state) => ({
        isDrawerOpen: !state.isDrawerOpen
      })),
      closeDrawer: () => set({ isDrawerOpen: false }),

      // Future preferences can be added here
      // theme: 'auto', // 'light', 'dark', 'auto'
      // editorOptions: {},
      // quickAddButtons: [],
    }),
    {
      name: 'universal-block-editor-preferences', // localStorage key
      storage: {
        getItem: (name) => {
          try {
            const item = localStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          } catch (error) {
            console.warn('Failed to load preferences:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.warn('Failed to save preferences:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('Failed to remove preferences:', error);
          }
        },
      },
      // Only persist certain keys to avoid saving temporary state
      partialize: (state) => ({
        sidebarPosition: state.sidebarPosition,
        // Add other persistent preferences here
      }),
    }
  )
);

export default usePreferencesStore;