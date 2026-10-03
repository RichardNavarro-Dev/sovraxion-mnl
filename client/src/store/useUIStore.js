import { create } from 'zustand';

let toastId = 0;

export const useUIStore = create((set, get) => ({
  menuOpen: false,
  cartOpen: false,
  searchOpen: false,
  checkoutOpen: false,
  auth: { open: false, mode: 'login', reason: '' },
  toasts: [],

  setMenu: (menuOpen) => set({ menuOpen, cartOpen: false, searchOpen: false }),
  setCart: (cartOpen) => set({ cartOpen, menuOpen: false, searchOpen: false }),
  setSearch: (searchOpen) => set({ searchOpen, menuOpen: false, cartOpen: false }),
  setCheckout: (checkoutOpen) => set({ checkoutOpen, cartOpen: false }),
  openAuth: (mode = 'login', reason = '') => set({ auth: { open: true, mode, reason }, menuOpen: false }),
  closeAuth: () => set({ auth: { ...get().auth, open: false, reason: '' } }),
  setAuthMode: (mode) => set({ auth: { ...get().auth, mode } }),

  toast(message, tone = 'default') {
    toastId += 1;
    const id = toastId;
    set({ toasts: [...get().toasts, { id, message, tone }] });
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 3800);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
