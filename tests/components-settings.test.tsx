/**
 * Tests for Settings components: SettingsCard, ThemeSettings, SecuritySettings,
 * BackupSettings, AboutSettings, ImportSummary
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpdateSettings = vi.fn();

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
      updateSettings: mockUpdateSettings,
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

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingsCard', () => {
  it('renders title, description, and children', async () => {
    const { SettingsCard } = await import('@/components/settings/settings-card');
    render(
      <SettingsCard title="Test Title" description="Test description">
        <p>Child content</p>
      </SettingsCard>
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test description')).toBeDefined();
    expect(screen.getByText('Child content')).toBeDefined();
  });

  it('renders without description when not provided', async () => {
    const { SettingsCard } = await import('@/components/settings/settings-card');
    const { container } = render(
      <SettingsCard title="No Desc">
        <span>Content</span>
      </SettingsCard>
    );

    expect(screen.getByText('No Desc')).toBeDefined();
    // Title is h2
    expect(container.querySelector('h2')?.textContent).toBe('No Desc');
  });
});

describe('ThemeSettings', () => {
  beforeEach(() => { mockUpdateSettings.mockClear(); });

  it('renders 3 theme buttons', async () => {
    const { ThemeSettings } = await import('@/components/settings/theme-settings');
    render(<ThemeSettings />);

    expect(screen.getByText('System')).toBeDefined();
    expect(screen.getByText('Light')).toBeDefined();
    expect(screen.getByText('Dark')).toBeDefined();
  });

  it('marks active theme button with aria-pressed=true', async () => {
    const { ThemeSettings } = await import('@/components/settings/theme-settings');
    render(<ThemeSettings />);

    const systemBtn = screen.getByText('System');
    expect(systemBtn.getAttribute('aria-pressed')).toBe('true');

    const lightBtn = screen.getByText('Light');
    expect(lightBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('calls updateSettings when theme button is clicked', async () => {
    const { ThemeSettings } = await import('@/components/settings/theme-settings');
    render(<ThemeSettings />);

    fireEvent.click(screen.getByText('Dark'));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'dark' });
  });
});

describe('SecuritySettings', () => {
  beforeEach(() => { mockUpdateSettings.mockClear(); });

  it('renders idle timeout slider with correct range', async () => {
    const { SecuritySettings } = await import('@/components/settings/security-settings');
    render(<SecuritySettings />);

    const idleSlider = document.getElementById('idle-timeout') as HTMLInputElement;
    expect(idleSlider).toBeDefined();
    expect(idleSlider.type).toBe('range');
    expect(idleSlider.min).toBe('1');
    expect(idleSlider.max).toBe('60');
    expect(idleSlider.value).toBe('5');
  });

  it('renders clipboard timeout slider with correct range', async () => {
    const { SecuritySettings } = await import('@/components/settings/security-settings');
    render(<SecuritySettings />);

    const clipSlider = document.getElementById('clipboard-timeout') as HTMLInputElement;
    expect(clipSlider).toBeDefined();
    expect(clipSlider.type).toBe('range');
    expect(clipSlider.min).toBe('5');
    expect(clipSlider.max).toBe('120');
    expect(clipSlider.value).toBe('30');
  });

  it('calls updateSettings when idle timeout changes', async () => {
    const { SecuritySettings } = await import('@/components/settings/security-settings');
    render(<SecuritySettings />);

    const idleSlider = document.getElementById('idle-timeout') as HTMLInputElement;
    fireEvent.change(idleSlider, { target: { value: '15' } });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ idleTimeoutMinutes: 15 });
  });
});

describe('BackupSettings', () => {
  beforeEach(() => { mockUpdateSettings.mockClear(); });

  it('renders reminder interval select with all options', async () => {
    const { BackupSettings } = await import('@/components/settings/backup-settings');
    render(<BackupSettings />);

    const select = document.getElementById('backup-reminder') as HTMLSelectElement;
    expect(select).toBeDefined();

    const options = Array.from(select.options).map((o) => o.textContent);
    expect(options).toContain('Never');
    expect(options).toContain('7 days');
    expect(options).toContain('14 days');
    expect(options).toContain('30 days');
    expect(options).toContain('90 days');
  });

  it('has label associated with select', async () => {
    const { BackupSettings } = await import('@/components/settings/backup-settings');
    render(<BackupSettings />);

    const label = screen.getByText('Reminder interval');
    expect(label.getAttribute('for')).toBe('backup-reminder');
  });
});

describe('AboutSettings', () => {
  it('renders app name, version, and milestone', async () => {
    const { AboutSettings } = await import('@/components/settings/about-settings');
    render(<AboutSettings />);

    expect(screen.getByText('Qufly')).toBeDefined();
    expect(screen.getByText('v1-foundation-complete')).toBeDefined();
  });

  it('renders navigation links', async () => {
    const { AboutSettings } = await import('@/components/settings/about-settings');
    render(<AboutSettings />);

    expect(screen.getByText('Security')).toBeDefined();
    expect(screen.getByText('Privacy')).toBeDefined();
    expect(screen.getByText('Limitations')).toBeDefined();
    expect(screen.getByText('Repository')).toBeDefined();
  });

  it('external link has rel="noopener noreferrer"', async () => {
    const { AboutSettings } = await import('@/components/settings/about-settings');
    render(<AboutSettings />);

    const repoLink = screen.getByText('Repository');
    expect(repoLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(repoLink.getAttribute('target')).toBe('_blank');
  });
});

describe('ImportSummary', () => {
  it('renders imported count', async () => {
    const { ImportSummary } = await import('@/components/import-export/import-summary');
    render(<ImportSummary result={{ imported: 5, skipped: [] }} />);

    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText(/entries imported/)).toBeDefined();
  });

  it('renders skipped entries with reasons', async () => {
    const { ImportSummary } = await import('@/components/import-export/import-summary');
    render(
      <ImportSummary
        result={{
          imported: 3,
          skipped: [
            { identifier: 'entry1', reason: 'missing title' },
            { identifier: 'entry2', reason: 'duplicate' },
          ],
        }}
      />
    );

    expect(screen.getByText(/2 skipped/)).toBeDefined();
    expect(screen.getByText(/entry1: missing title/)).toBeDefined();
    expect(screen.getByText(/entry2: duplicate/)).toBeDefined();
  });

  it('shows truncation indicator for more than 5 skipped', async () => {
    const { ImportSummary } = await import('@/components/import-export/import-summary');
    const skipped = Array.from({ length: 8 }, (_, i) => ({
      identifier: `entry${i}`,
      reason: 'reason',
    }));
    render(<ImportSummary result={{ imported: 2, skipped }} />);

    expect(screen.getByText(/\.\.\.and 3 more/)).toBeDefined();
  });
});
