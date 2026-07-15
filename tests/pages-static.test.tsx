/**
 * Tests for static pages: Security, Privacy, Security Limitations
 * These are Server Components that don't use hooks — can be tested directly.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock layout dependencies
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

describe('Security Page', () => {
  it('renders all security sections as h2 headings', async () => {
    const { default: SecurityPage } = await import('@/app/security/page');
    render(<SecurityPage />);

    const headings = screen.getAllByRole('heading', { level: 2 });
    const headingTexts = headings.map((h) => h.textContent);

    expect(headingTexts).toContain('Encryption');
    expect(headingTexts).toContain('Key Derivation');
    expect(headingTexts).toContain('Vault Format');
    expect(headingTexts).toContain('Memory Protection');
    expect(headingTexts).toContain('No Network Requests');
  });

  it('has at least 2 sentences per section', async () => {
    const { default: SecurityPage } = await import('@/app/security/page');
    const { container } = render(<SecurityPage />);

    // Each section paragraph should contain at least 2 sentence endings
    const paragraphs = container.querySelectorAll('p');
    paragraphs.forEach((p) => {
      const text = p.textContent ?? '';
      // Count periods that end sentences (not abbreviations like "e.g.")
      const sentenceCount = (text.match(/[.!?]\s+[A-Z]|[.!?]$/g) || []).length;
      expect(sentenceCount).toBeGreaterThanOrEqual(2);
    });
  });

  it('does not contain external resource URLs', async () => {
    const { default: SecurityPage } = await import('@/app/security/page');
    const { container } = render(<SecurityPage />);

    const html = container.innerHTML;
    expect(html).not.toMatch(/https?:\/\/[^"']*/);
  });
});

describe('Privacy Page', () => {
  it('renders all privacy sections as h2 headings', async () => {
    const { default: PrivacyPage } = await import('@/app/privacy/page');
    render(<PrivacyPage />);

    const headings = screen.getAllByRole('heading', { level: 2 });
    const headingTexts = headings.map((h) => h.textContent);

    expect(headingTexts).toContain('No Data Collection');
    expect(headingTexts).toContain('Local-Only Storage');
    expect(headingTexts).toContain('No Accounts');
    expect(headingTexts).toContain('No External Resources');
    expect(headingTexts).toContain('Open Source');
  });

  it('has at least 2 sentences per section', async () => {
    const { default: PrivacyPage } = await import('@/app/privacy/page');
    const { container } = render(<PrivacyPage />);

    const paragraphs = container.querySelectorAll('p');
    paragraphs.forEach((p) => {
      const text = p.textContent ?? '';
      const sentenceCount = (text.match(/[.!?]\s+[A-Z]|[.!?]$/g) || []).length;
      expect(sentenceCount).toBeGreaterThanOrEqual(2);
    });
  });

  it('does not contain external resource URLs', async () => {
    const { default: PrivacyPage } = await import('@/app/privacy/page');
    const { container } = render(<PrivacyPage />);

    const html = container.innerHTML;
    expect(html).not.toMatch(/https?:\/\/[^"']*/);
  });
});

describe('Security Limitations Page', () => {
  it('renders all limitation sections as h2 headings', async () => {
    const { default: SecurityLimitationsPage } = await import('@/app/security-limitations/page');
    render(<SecurityLimitationsPage />);

    const headings = screen.getAllByRole('heading', { level: 2 });
    const headingTexts = headings.map((h) => h.textContent);

    expect(headingTexts).toContain('Browser Extensions');
    expect(headingTexts).toContain('Malware');
    expect(headingTexts).toContain('JavaScript Memory');
    expect(headingTexts).toContain('Clipboard Clearing');
    expect(headingTexts).toContain('DevTools Inspection');
    expect(headingTexts).toContain('Recommended Mitigations');
  });

  it('uses proper semantic structure with h2 headings', async () => {
    const { default: SecurityLimitationsPage } = await import('@/app/security-limitations/page');
    render(<SecurityLimitationsPage />);

    // All section headings should be h2
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBe(7);

    // Page title is h1
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s.length).toBe(1);
  });

  it('does not contain external resource URLs', async () => {
    const { default: SecurityLimitationsPage } = await import('@/app/security-limitations/page');
    const { container } = render(<SecurityLimitationsPage />);

    const html = container.innerHTML;
    expect(html).not.toMatch(/https?:\/\/[^"']*/);
  });
});
