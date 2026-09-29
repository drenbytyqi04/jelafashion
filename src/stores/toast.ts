import { create } from "zustand";

export type ToastTone = "neutral" | "success" | "error";
export type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };

type ToastState = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id" | "tone"> & { tone?: ToastTone }) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((s) => ({ toasts: [...s.toasts.slice(-2), { tone: "neutral", ...toast, id: nextId++ }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Show a toast from anywhere on the client. */
export const toast = (t: Parameters<ToastState["push"]>[0]) => useToastStore.getState().push(t);
