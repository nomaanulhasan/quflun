/**
 * Tests for HealthResult component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { HealthCheckResult } from '@/lib/vault-engine';

// Mock lucide-react icons to just render their name
vi.mock('lucide-react', () => ({
  CheckCircle: (props: Record<string, unknown>) => <svg data-testid="check-circle" {...props} />,
  XCircle: (props: Record<string, unknown>) => <svg data-testid="x-circle" {...props} />,
  AlertTriangle: (props: Record<string, unknown>) => (
    <svg data-testid="alert-triangle" {...props} />
  ),
}));

describe('HealthResult', () => {
  async function renderHealthResult(result: HealthCheckResult) {
    const { HealthResult } = await import('@/components/health-check/health-result');
    return render(<HealthResult result={result} />);
  }

  it('renders "Healthy" status with check icon for healthy vault', async () => {
    await renderHealthResult({
      status: 'healthy',
      entryCount: 10,
      groupCount: 3,
      errors: [],
      timestamp: '2024-06-15T10:00:00.000Z',
    });

    expect(screen.getByText('Healthy')).toBeDefined();
    expect(screen.getByTestId('check-circle')).toBeDefined();
  });

  it('renders "Issues Detected" with x-circle icon for corrupted vault', async () => {
    await renderHealthResult({
      status: 'corrupted',
      entryCount: 5,
      groupCount: 2,
      errors: ['Duplicate entry UUID: abc123'],
      timestamp: '2024-06-15T10:00:00.000Z',
    });

    expect(screen.getByText('Issues Detected')).toBeDefined();
    expect(screen.getByTestId('x-circle')).toBeDefined();
  });

  it('renders "Error" with alert icon for error status', async () => {
    await renderHealthResult({
      status: 'error',
      entryCount: 0,
      groupCount: 0,
      errors: ['Unexpected error: db is null'],
      timestamp: '2024-06-15T10:00:00.000Z',
    });

    expect(screen.getByText('Error')).toBeDefined();
    expect(screen.getByTestId('alert-triangle')).toBeDefined();
  });

  it('shows entry and group counts', async () => {
    await renderHealthResult({
      status: 'healthy',
      entryCount: 42,
      groupCount: 7,
      errors: [],
      timestamp: '2024-06-15T10:00:00.000Z',
    });

    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('Entries')).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
    expect(screen.getByText('Categories')).toBeDefined();
  });

  it('renders error messages as list items', async () => {
    const { container } = await renderHealthResult({
      status: 'corrupted',
      entryCount: 3,
      groupCount: 1,
      errors: ['Missing Title field', 'Duplicate UUID'],
      timestamp: '2024-06-15T10:00:00.000Z',
    });

    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(2);
    expect(listItems[0].textContent).toBe('Missing Title field');
    expect(listItems[1].textContent).toBe('Duplicate UUID');
  });

  it('shows backup recommendation for corrupted vaults', async () => {
    await renderHealthResult({
      status: 'corrupted',
      entryCount: 5,
      groupCount: 2,
      errors: ['Some error'],
      timestamp: '2024-06-15T10:00:00.000Z',
    });

    expect(screen.getByText(/Export a backup immediately/)).toBeDefined();
  });

  it('does NOT show backup recommendation for healthy vaults', async () => {
    await renderHealthResult({
      status: 'healthy',
      entryCount: 5,
      groupCount: 2,
      errors: [],
      timestamp: '2024-06-15T10:00:00.000Z',
    });

    expect(screen.queryByText(/Export a backup immediately/)).toBeNull();
  });

  it('shows timestamp', async () => {
    await renderHealthResult({
      status: 'healthy',
      entryCount: 1,
      groupCount: 1,
      errors: [],
      timestamp: '2024-06-15T10:00:00.000Z',
    });

    expect(screen.getByText(/Checked:/)).toBeDefined();
  });
});
