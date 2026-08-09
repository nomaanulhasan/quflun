import type { KeyRound } from 'lucide-react';

export interface PaletteItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: typeof KeyRound;
  shortcut?: string;
  action: () => void;
  section: 'actions' | 'navigation' | 'entries';
}

export interface PaletteSection {
  section: string;
  items: { item: PaletteItem; index: number }[];
}
