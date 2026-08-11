import {
  KeyRound,
  ArrowLeftRight,
  HeartPulse,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Settings,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: typeof KeyRound;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: 'Vault',
    items: [{ href: '/vault', label: 'Vault', icon: KeyRound }],
  },
  {
    label: 'Tools',
    items: [
      { href: '/import-export', label: 'Import/Export', icon: ArrowLeftRight },
      { href: '/password-health', label: 'Vault Health', icon: HeartPulse },
    ],
  },
  {
    label: 'Information',
    items: [
      { href: '/security', label: 'Security', icon: ShieldCheck },
      { href: '/privacy', label: 'Privacy', icon: FileText },
      { href: '/security-limitations', label: 'Limitations', icon: AlertTriangle },
    ],
  },
  {
    label: 'Settings',
    items: [{ href: '/settings', label: 'Settings', icon: Settings }],
  },
];
