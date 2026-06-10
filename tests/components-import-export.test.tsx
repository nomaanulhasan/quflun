/**
 * Tests for Import/Export components: ExportCard, ImportCard, BackupStatusCard
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
        lastBackupDate: '2024-06-01T00:00:00.000Z',
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
  usePathname: () => '/import-export',
}));

vi.mock('@/lib/backup-reminder', () => ({
  timeSinceLastBackup: (date: string | null) => date ? '14 days ago' : 'Never',
  shouldShowBackupReminder: () => true,
}));

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ExportCard', () => {
  const mockExportKdbx = vi.fn().mockResolvedValue(new ArrayBuffer(8));
  const mockExportCsv = vi.fn().mockResolvedValue('title,username\ntest,user');
  const mockBackupComplete = vi.fn();

  beforeEach(() => {
    mockExportKdbx.mockClear();
    mockExportCsv.mockClear();
    mockBackupComplete.mockClear();
    // Mock URL and anchor click for download
    global.URL.createObjectURL = vi.fn(() => 'blob:fake');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders KDBX and CSV export buttons', async () => {
    const { ExportCard } = await import('@/components/import-export/export-card');
    render(
      <ExportCard
        onExportKdbx={mockExportKdbx}
        onExportCsv={mockExportCsv}
        vaultName="TestVault"
      />
    );

    expect(screen.getByText('Export KDBX')).toBeDefined();
    expect(screen.getByText('Export CSV')).toBeDefined();
  });

  it('calls onBackupComplete after successful KDBX export', async () => {
    const { ExportCard } = await import('@/components/import-export/export-card');
    render(
      <ExportCard
        onExportKdbx={mockExportKdbx}
        onExportCsv={mockExportCsv}
        vaultName="TestVault"
        onBackupComplete={mockBackupComplete}
      />
    );

    fireEvent.click(screen.getByText('Export KDBX'));

    await waitFor(() => {
      expect(mockExportKdbx).toHaveBeenCalled();
      expect(mockBackupComplete).toHaveBeenCalled();
    });
  });

  it('calls onBackupComplete after successful CSV export', async () => {
    const { ExportCard } = await import('@/components/import-export/export-card');
    render(
      <ExportCard
        onExportKdbx={mockExportKdbx}
        onExportCsv={mockExportCsv}
        vaultName="TestVault"
        onBackupComplete={mockBackupComplete}
      />
    );

    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(mockExportCsv).toHaveBeenCalled();
      expect(mockBackupComplete).toHaveBeenCalled();
    });
  });
});

describe('ImportCard', () => {
  const mockImportKdbx = vi.fn().mockResolvedValue({ imported: 3, skipped: [] });
  const mockImportCsv = vi.fn().mockResolvedValue({ imported: 5, skipped: [] });

  beforeEach(() => {
    mockImportKdbx.mockClear();
    mockImportCsv.mockClear();
  });

  it('renders file picker and import button', async () => {
    const { ImportCard } = await import('@/components/import-export/import-card');
    render(<ImportCard onImportKdbx={mockImportKdbx} onImportCsv={mockImportCsv} />);

    // Import button should be present but disabled (no file selected)
    const importButtons = screen.getAllByText('Import');
    const button = importButtons.find((el) => el.closest('button'));
    expect(button).toBeDefined();
    expect(button!.closest('button')?.disabled).toBe(true);
  });

  it('shows overwrite warning text', async () => {
    const { ImportCard } = await import('@/components/import-export/import-card');
    render(<ImportCard onImportKdbx={mockImportKdbx} onImportCsv={mockImportCsv} />);

    expect(screen.getByText(/Importing may overwrite existing entries/)).toBeDefined();
  });

  it('renders the file input with correct accept types', async () => {
    const { ImportCard } = await import('@/components/import-export/import-card');
    const { container } = render(
      <ImportCard onImportKdbx={mockImportKdbx} onImportCsv={mockImportCsv} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();
    expect(fileInput.accept).toBe('.kdbx,.csv');
  });
});

describe('BackupStatusCard', () => {
  it('renders warning banner', async () => {
    const { BackupStatusCard } = await import('@/components/import-export/backup-status-card');
    render(<BackupStatusCard />);

    expect(screen.getByText(/Regular backups are strongly recommended/)).toBeDefined();
  });

  it('renders last backup info', async () => {
    const { BackupStatusCard } = await import('@/components/import-export/backup-status-card');
    render(<BackupStatusCard />);

    expect(screen.getByText(/Last backup:/)).toBeDefined();
    expect(screen.getByText(/14 days ago/)).toBeDefined();
  });

  it('renders recovery warning text', async () => {
    const { BackupStatusCard } = await import('@/components/import-export/backup-status-card');
    render(<BackupStatusCard />);

    expect(screen.getByText(/cannot be recovered/)).toBeDefined();
  });
});
