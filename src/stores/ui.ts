import { create } from "zustand";

type UiState = {
  menuOpen: boolean;
  cartOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  menuOpen: false,
  cartOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
}));
