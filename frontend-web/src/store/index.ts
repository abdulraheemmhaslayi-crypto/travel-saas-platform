import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface AppState {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  toast: { message: string; type: 'success' | 'error' | 'info'; visible: boolean } | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      toast: null,
      showToast: (message, type) => {
        set({ toast: { message, type, visible: true } });
        setTimeout(() => set({ toast: null }), 5000);
      },
      hideToast: () => set({ toast: null }),
    }),
    { name: 'AppStore' }
  )
);