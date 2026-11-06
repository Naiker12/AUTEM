import { useEffect, useRef } from "react";

type ScrollCallback = () => void;

const callbacks = new Set<ScrollCallback>();
let frameId = 0;
let listening = false;

function flush() {
  frameId = 0;
  callbacks.forEach((callback) => callback());
}

function schedule() {
  if (!frameId) frameId = window.requestAnimationFrame(flush);
}

function startListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
}

function stopListening() {
  if (callbacks.size || !listening) return;
  listening = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  if (frameId) window.cancelAnimationFrame(frameId);
  frameId = 0;
}

/** Runs registered scroll work once per animation frame through one global listener. */
export function useScrollFrame(callback: ScrollCallback, dependencies: unknown[] = []) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const registeredCallback = () => callbackRef.current();
    callbacks.add(registeredCallback);
    startListening();
    registeredCallback();

    return () => {
      callbacks.delete(registeredCallback);
      stopListening();
    };
    // The caller controls re-registration for values that affect the callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
