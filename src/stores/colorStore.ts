import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  accent: string;
  secondary: string;
}

export const defaultThemes: ColorTheme[] = [
  {
    id: 'palestine',
    name: 'فلسطين',
    primary: '0 78% 57%',
    accent: '143 55% 41%',
    secondary: '0 0% 0%',
  },
  {
    id: 'ocean',
    name: 'المحيط',
    primary: '210 100% 50%',
    accent: '180 70% 45%',
    secondary: '220 50% 20%',
  },
  {
    id: 'sunset',
    name: 'الغروب',
    primary: '25 95% 55%',
    accent: '340 80% 55%',
    secondary: '270 50% 25%',
  },
  {
    id: 'forest',
    name: 'الغابة',
    primary: '150 60% 40%',
    accent: '80 60% 50%',
    secondary: '160 30% 15%',
  },
  {
    id: 'royal',
    name: 'ملكي',
    primary: '270 70% 55%',
    accent: '45 90% 55%',
    secondary: '280 40% 20%',
  },
];

interface ColorStore {
  currentTheme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  applyTheme: () => void;
}

export const useColorStore = create<ColorStore>()(
  persist(
    (set, get) => ({
      currentTheme: defaultThemes[0],
      setTheme: (theme) => {
        set({ currentTheme: theme });
        get().applyTheme();
      },
      applyTheme: () => {
        const { currentTheme } = get();
        const root = document.documentElement;
        root.style.setProperty('--primary', currentTheme.primary);
        root.style.setProperty('--accent', currentTheme.accent);
        root.style.setProperty('--secondary', currentTheme.secondary);
        root.style.setProperty('--ring', currentTheme.primary);
        root.style.setProperty('--sidebar-primary', currentTheme.primary);
        root.style.setProperty('--sidebar-accent', currentTheme.accent);
      },
    }),
    {
      name: 'color-theme-storage',
    }
  )
);
