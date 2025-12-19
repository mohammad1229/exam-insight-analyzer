import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  copyrightText: string;
  copyrightPhone: string;
  setCopyrightText: (text: string) => void;
  setCopyrightPhone: (phone: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      copyrightText: 'محمد الشوامرة للبرمجة والتصميم',
      copyrightPhone: '0566000140',
      setCopyrightText: (text) => set({ copyrightText: text }),
      setCopyrightPhone: (phone) => set({ copyrightPhone: phone }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
