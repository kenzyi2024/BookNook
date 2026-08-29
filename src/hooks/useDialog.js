import { useEffect, useRef } from 'react';

/**
 * Accessibility plumbing for modal dialogs. Attach the returned ref to the modal
 * card. It:
 *   - moves focus into the dialog on open (unless a child auto-focused already),
 *   - closes on Escape,
 *   - traps Tab focus within the dialog,
 *   - restores focus to the previously-focused element on close.
 *
 * Pair with `role="dialog" aria-modal="true"` on the same element.
 */
export function useDialog(onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const previouslyFocused = document.activeElement;

    const focusables = () =>
      Array.from(
        node.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);

    // Make the card itself focusable and move focus in (unless a child grabbed it).
    node.setAttribute('tabindex', '-1');
    if (!node.contains(document.activeElement)) {
      (focusables()[0] || node).focus();
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (e.key === 'Tab') {
        const list = focusables();
        if (!list.length) { e.preventDefault(); return; }
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return ref;
}
