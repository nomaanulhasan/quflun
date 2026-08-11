'use client';

import { useRef, useEffect, useCallback } from 'react';

const DRAG_THRESHOLD = 5; // px — movement below this is a click, not a drag

/**
 * useHorizontalScroll — enables smooth horizontal scrolling on a container via:
 * 1. Mouse wheel → horizontal scroll (non-passive, prevents vertical scroll)
 * 2. Click-and-drag scrolling with momentum (only activates after threshold)
 *
 * Clicks on child buttons work normally — drag only engages after 5px movement.
 */
export function useHorizontalScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const isPointerDown = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animFrame = useRef(0);

  // Wheel → horizontal scroll (non-passive to allow preventDefault)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      if (!el || el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (e.button !== 0) return;

    cancelAnimationFrame(animFrame.current);
    isPointerDown.current = true;
    isDragging.current = false;
    startX.current = e.clientX;
    scrollStart.current = el.scrollLeft;
    lastX.current = e.clientX;
    lastTime.current = Date.now();
    velocity.current = 0;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPointerDown.current || !ref.current) return;

    const dx = e.clientX - startX.current;

    // Activate drag only after threshold
    if (!isDragging.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      isDragging.current = true;
      ref.current.style.cursor = 'grabbing';
    }

    // Prevent clicks on children while dragging
    e.preventDefault();
    ref.current.scrollLeft = scrollStart.current - dx;

    // Track velocity for momentum
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = (e.clientX - lastX.current) / dt;
    }
    lastX.current = e.clientX;
    lastTime.current = now;
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;

    const el = ref.current;
    if (el) el.style.cursor = '';

    // Only apply momentum if we were actually dragging
    if (!isDragging.current || !el) {
      isDragging.current = false;
      return;
    }
    isDragging.current = false;

    let v = velocity.current * 15;
    if (Math.abs(v) < 0.5) return;

    function animate() {
      if (!el || Math.abs(v) < 0.5) return;
      el.scrollLeft -= v;
      v *= 0.92;
      animFrame.current = requestAnimationFrame(animate);
    }
    animate();
  }, []);

  return { ref, onPointerDown, onPointerMove, onPointerUp };
}
