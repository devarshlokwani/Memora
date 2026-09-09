"use client";

import { useEffect } from "react";

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

/**
 * Single-key shortcuts for drilling. Keys are ignored while the student is
 * typing into a field, so answering a fill-in-the-blank never grades the card.
 */
export function useKeys(handlers: Record<string, () => void>, active = true) {
  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;

      const handler = handlers[event.key];
      if (!handler) return;

      event.preventDefault();
      handler();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers, active]);
}

/** Ctrl/Cmd+Enter, for the modes where plain Enter belongs to a textarea. */
export function useSubmitKey(handler: () => void, active = true) {
  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      handler();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handler, active]);
}
