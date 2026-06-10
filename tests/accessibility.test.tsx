/**
 * Accessibility tests for components.
 * Verifies proper label associations, ARIA attributes, heading hierarchy,
 * and external link attributes.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/components/providers', () => ({
  useUIStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = {
      settings: {
        theme: 'system',
        idleTimeoutMinutes: 5,
        clipboardTimeoutSeconds: 30,
        backupReminderDays: 30,
        lastBackupDate: null,
      },
      updateSettings: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
  useVaultStore: vi.fn((selector?: (state: unknown) => unknown) => {
    const state = { status: 'unlocked', lock: vi.fn() };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/settings',
}));

vi.mock('@/components/layout/shell', () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}));

vi.mock('@/components/common/page-header', () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle && <span>{subtitle}</span>}
    </div>
  ),
}));

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Accessibility: Form input labels', () => {
  it('SecuritySettings: idle-timeout input has associated label', async () => {
    const { SecuritySettings } = await import('@/components/settings/security-settings');
    render(<SecuritySettings />);

    const label = document.querySelector('label[for="idle-timeout"]');
    const input = document.getElementById('idle-timeout');
    expect(label).not.toBeNull();
    expect(input).not.toBeNull();
  });

  it('SecuritySettings: clipboard-timeout input has associated label', async () => {
    const { SecuritySettings } = await import('@/components/settings/security-settings');
    render(<SecuritySettings />);

    const label = document.querySelector('label[for="clipboard-timeout"]');
    const input = document.getElementById('clipboard-timeout');
    expect(label).not.toBeNull();
    expect(input).not.toBeNull();
  });

  it('BackupSettings: backup-reminder select has associated label', async () => {
    const { BackupSettings } = await import('@/components/settings/backup-settings');
    render(<BackupSettings />);

    const label = document.querySelector('label[for="backup-reminder"]');
    const select = document.getElementById('backup-reminder');
    expect(label).not.toBeNull();
    expect(select).not.toBeNull();
  });
});

describe('Accessibility: Buttons have accessible text', () => {
  it('ThemeSettings buttons have text content', async () => {
    const { ThemeSettings } = await import('@/components/settings/theme-settings');
    render(<ThemeSettings />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  it('ExportCard buttons have text content', async () => {
    const { ExportCard } = await import('@/components/import-export/export-card');
    render(
      <ExportCard
        onExportKdbx={vi.fn().mockResolvedValue(new ArrayBuffer(0))}
        onExportCsv={vi.fn().mockResolvedValue('')}
        vaultName="Test"
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.textContent?.trim().length).toBeGreaterThan(0);
    });
  });
});

describe('Accessibility: Heading hierarchy', () => {
  it('Security page has h1 followed by h2s (no skipped levels)', async () => {
    const { default: SecurityPage } = await import('@/app/security/page');
    const { container } = render(<SecurityPage />);

    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = Array.from(headings).map((h) => parseInt(h.tagName.substring(1)));

    // First heading should be h1
    expect(levels[0]).toBe(1);
    // Subsequent headings should be h2 (no skipping to h3+)
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
    }
  });

  it('Privacy page has h1 followed by h2s (no skipped levels)', async () => {
    const { default: PrivacyPage } = await import('@/app/privacy/page');
    const { container } = render(<PrivacyPage />);

    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = Array.from(headings).map((h) => parseInt(h.tagName.substring(1)));

    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
    }
  });
});

describe('Accessibility: External links', () => {
  it('AboutSettings external link has rel="noopener noreferrer"', async () => {
    const { AboutSettings } = await import('@/components/settings/about-settings');
    const { container } = render(<AboutSettings />);

    const externalLinks = container.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach((link) => {
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });
});

describe('Accessibility: No duplicate IDs', () => {
  it('SecuritySettings has no duplicate element IDs', async () => {
    const { SecuritySettings } = await import('@/components/settings/security-settings');
    const { container } = render(<SecuritySettings />);

    const allIds = Array.from(container.querySelectorAll('[id]')).map((el) => el.id);
    const uniqueIds = new Set(allIds);
    expect(allIds.length).toBe(uniqueIds.size);
  });

  it('BackupSettings has no duplicate element IDs', async () => {
    const { BackupSettings } = await import('@/components/settings/backup-settings');
    const { container } = render(<BackupSettings />);

    const allIds = Array.from(container.querySelectorAll('[id]')).map((el) => el.id);
    const uniqueIds = new Set(allIds);
    expect(allIds.length).toBe(uniqueIds.size);
  });
});

describe('Accessibility: Interactive elements have aria attributes', () => {
  it('ThemeSettings buttons have aria-pressed', async () => {
    const { ThemeSettings } = await import('@/components/settings/theme-settings');
    render(<ThemeSettings />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.hasAttribute('aria-pressed')).toBe(true);
    });
  });
});
