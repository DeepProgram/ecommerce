import { create } from 'zustand';

interface CartStore {
  itemCount: number;
  setItemCount: (count: number) => void;
  incrementCount: (amount: number) => void;
  decrementCount: (amount: number) => void;
  resetCount: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: count }),
  incrementCount: (amount) => set((state) => ({ itemCount: state.itemCount + amount })),
  decrementCount: (amount) => set((state) => ({ itemCount: Math.max(0, state.itemCount - amount) })),
  resetCount: () => set({ itemCount: 0 }),
}));
