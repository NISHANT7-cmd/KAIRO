import React, { createContext, useContext, useState, useEffect } from 'react';

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type ReaderFont = 'sans' | 'serif' | 'mono';

interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: number; // in px, e.g. 18
  lineHeight: number; // e.g. 1.8
  fontFamily: ReaderFont;
  readerWidth: 'narrow' | 'medium' | 'wide';
}

interface ReaderContextType {
  settings: ReaderSettings;
  updateSettings: (updates: Partial<ReaderSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'light',
  fontSize: 18,
  lineHeight: 1.85,
  fontFamily: 'sans',
  readerWidth: 'medium',
};

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export const ReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    try {
      const stored = localStorage.getItem('kairo_reader_settings');
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (updates: Partial<ReaderSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('kairo_reader_settings', JSON.stringify(next));
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('kairo_reader_settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return (
    <ReaderContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ReaderContext.Provider>
  );
};

export function useReader() {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error('useReader must be used within ReaderProvider');
  return ctx;
}
