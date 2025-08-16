
"use client";
import { useCallback, useRef, MouseEvent, TouchEvent } from 'react';

interface LongPressOptions {
  shouldPreventDefault?: boolean;
  delay?: number;
}

interface LongPressResult {
  onMouseDown: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
  onMouseLeave: (e: MouseEvent) => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export const useLongPress = (
  { onLongPress, onClick }: { 
    onLongPress: (event: MouseEvent | TouchEvent) => void, 
    onClick: (event: MouseEvent | TouchEvent) => void 
  },
  { shouldPreventDefault = true, delay = 500 }: LongPressOptions = {}
): LongPressResult => {
  const longPressTimeout = useRef<NodeJS.Timeout>();
  const isLongPressTriggered = useRef(false);

  const start = useCallback(
    (e: MouseEvent | TouchEvent) => {
      isLongPressTriggered.current = false;
      if (shouldPreventDefault && e.target) {
        (e.target as HTMLElement).addEventListener('touchend', preventDefault, { passive: false });
        (e.target as HTMLElement).addEventListener('mouseup', preventDefault, { passive: false });
      }
      longPressTimeout.current = setTimeout(() => {
        onLongPress(e);
        isLongPressTriggered.current = true;
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(
    (e: MouseEvent | TouchEvent, shouldTriggerClick = true) => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
      if (shouldTriggerClick && !isLongPressTriggered.current) {
        onClick(e);
      }
      if (shouldPreventDefault && e.target) {
        (e.target as HTMLElement).removeEventListener('touchend', preventDefault);
        (e.target as HTMLElement).removeEventListener('mouseup', preventDefault);
      }
    },
    [shouldPreventDefault, onClick]
  );

  const preventDefault = (e: Event) => {
    if (!isLongPressTriggered.current) {
        return;
    }
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  return {
    onMouseDown: (e: MouseEvent) => start(e),
    onMouseUp: (e: MouseEvent) => clear(e),
    onMouseLeave: (e: MouseEvent) => clear(e, false),
    onTouchStart: (e: TouchEvent) => start(e),
    onTouchEnd: (e: TouchEvent) => clear(e),
  };
};

export default useLongPress;
