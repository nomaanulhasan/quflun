import { memo } from 'react';
import type { PaletteItem } from './types';

interface PaletteItemRowProps {
  item: PaletteItem;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export const PaletteItemRow = memo(function PaletteItemRow({ item, index, isSelected, onSelect }: PaletteItemRowProps) {
  const Icon = item.icon;
  return (
    <div
      id={`palette-item-${item.id}`}
      role="option"
      aria-selected={isSelected}
      data-selected={isSelected}
      onClick={item.action}
      onMouseEnter={() => onSelect(index)}
      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
        isSelected ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.subtitle && <span className="truncate text-xs text-muted-foreground">{item.subtitle}</span>}
      {item.shortcut && (
        <kbd className="ml-auto inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {item.shortcut}
        </kbd>
      )}
    </div>
  );
});
