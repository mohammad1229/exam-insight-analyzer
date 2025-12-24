import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  copyrightText: string;
  copyrightPhone: string;
  protectionPassword: string;
  setCopyrightText: (text: string) => void;
  setCopyrightPhone: (phone: string) => void;
  setProtectionPassword: (password: string) => void;
  verifyPassword: (password: string) => boolean;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      copyrightText: 'محمد الشوامرة للبرمجة والتصميم',
      copyrightPhone: '0566000140',
      protectionPassword: 'admin2024',
      setCopyrightText: (text) => set({ copyrightText: text }),
      setCopyrightPhone: (phone) => set({ copyrightPhone: phone }),
      setProtectionPassword: (password) => set({ protectionPassword: password }),
      verifyPassword: (password) => get().protectionPassword === password,
    }),
    {
      name: 'settings-storage',
    }
  )
);
