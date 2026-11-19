import { useEffect, useRef } from "react";

/** True while typing in a field, so plain-key shortcuts stay out of the way. */
export const isEditable = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
};

/** True while a dialog or alert dialog is open. */
export const isDialogOpen = (): boolean =>
  document.querySelector("[role='dialog'], [role='alertdialog']") !== null;

interface HotkeyOptions {
  /** Require ⌘ (macOS) or Ctrl (elsewhere). */
  mod?: boolean;
  enabled?: boolean;
}

/**
 * Runs `handler` when `key` is pressed. Plain keys are ignored while typing,
 * with modifiers held or while a dialog is open, so they never steal input.
 */
export const useHotkey = (
  key: string,
  handler: () => void,
  { enabled = true, mod = false }: HotkeyOptions = {}
): void => {
  const latest = useRef(handler);

  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !enabled ||
        event.repeat ||
        event.key.toLowerCase() !== key.toLowerCase()
      ) {
        return;
      }

      const modHeld = event.metaKey || event.ctrlKey;

      if (mod) {
        if (!modHeld) {
          return;
        }
      } else if (
        modHeld ||
        event.altKey ||
        isEditable(event.target) ||
        document.querySelector("[role='dialog'], [role='alertdialog']") !== null
      ) {
        return;
      }

      event.preventDefault();
      latest.current();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, key, mod]);
};
