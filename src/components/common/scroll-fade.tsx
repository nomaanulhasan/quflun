'use client';

import { useRef, useState, useEffect, type RefObject } from 'react';

interface ScrollFadeProps {
  direction: 'vertical' | 'horizontal';
  className?: string;
  children: React.ReactNode;
  /** Exposes the scroll container ref externally (e.g. for IntersectionObserver root) */
  scrollRef?: RefObject<HTMLDivElement | null>;
}

/**
 * Container that shows fade hints only on sides where content overflows.
 * No overflow = no fade. At start = no leading fade. At end = no trailing fade.
 */
export function ScrollFade({ direction, className = '', children, scrollRef }: ScrollFadeProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = scrollRef ?? internalRef;
  const [fadeStart, setFadeStart] = useState(false);
  const [fadeEnd, setFadeEnd] = useState(false);

  function update() {
    const el = ref.current;
    if (!el) return;
    if (direction === 'vertical') {
      setFadeStart(el.scrollTop > 2);
      setFadeEnd(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
    } else {
      setFadeStart(el.scrollLeft > 2);
      setFadeEnd(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }
  }

  useEffect(() => {
    requestAnimationFrame(update);
  });

  const fadeClass =
    direction === 'vertical'
      ? fadeStart && fadeEnd
        ? 'mask-fade-y'
        : fadeStart
          ? 'mask-fade-top'
          : fadeEnd
            ? 'mask-fade-bottom'
            : ''
      : fadeStart && fadeEnd
        ? 'mask-fade-x'
        : fadeStart
          ? 'mask-fade-left'
          : fadeEnd
            ? 'mask-fade-right'
            : '';

  return (
    <div ref={ref} onScroll={update} className={`${className} ${fadeClass}`}>
      {children}
    </div>
  );
}
