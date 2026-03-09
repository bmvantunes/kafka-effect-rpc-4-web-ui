"use client";

import { useSyncExternalStore } from "react";

class TickStore {
  private now = Date.now();
  private readonly listeners = new Set<() => void>();
  private timer: number | null = null;

  getSnapshot = () => this.now;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);

    if (this.listeners.size === 1) {
      this.timer = window.setInterval(() => {
        this.now = Date.now();

        for (const currentListener of this.listeners) {
          currentListener();
        }
      }, 1_000);
    }

    return () => {
      this.listeners.delete(listener);

      if (this.listeners.size === 0 && this.timer !== null) {
        window.clearInterval(this.timer);
        this.timer = null;
      }
    };
  };
}

const tickStore = new TickStore();

export const useTick = () =>
  useSyncExternalStore(
    tickStore.subscribe,
    tickStore.getSnapshot,
    tickStore.getSnapshot
  );
