'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/select';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Category selector dropdown for entry forms.
 * Fetches categories from the engine and displays them in a select.
 * Empty string = uncategorized.
 */
export function CategorySelect({ value, onChange, disabled }: CategorySelectProps) {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { getServices } = await import('@/lib/runtime');
      const { engine } = await getServices();
      if (!cancelled) {
        setCategories(engine.getCategories());
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Select
      id="category"
      label="Category"
      description="Organize this entry into a category."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">Uncategorized</option>
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </Select>
  );
}
