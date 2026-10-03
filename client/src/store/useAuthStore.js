import { create } from 'zustand';
import { api, clearBearerToken, setBearerToken } from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  status: 'idle',

  async init() {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const data = await api.get('/api/auth/me');
      set({ user: data.user, status: 'ready' });
    } catch {
      clearBearerToken();
      set({ user: null, status: 'ready' });
    }
  },

  async login({ email, password }) {
    const data = await api.post('/api/auth/login', { email, password });
    if (data.token) setBearerToken(data.token);
    set({ user: data.user, status: 'ready' });
    return data.user;
  },

  async register({ username, email, password, confirmPassword }) {
    const data = await api.post('/api/auth/register', { username, email, password, confirmPassword });
    if (data.token) setBearerToken(data.token);
    set({ user: data.user, status: 'ready' });
    return data.user;
  },

  async logout() {
    try {
      await api.post('/api/auth/logout', {});
    } finally {
      clearBearerToken();
      set({ user: null, status: 'ready' });
    }
  },

  expireSession() {
    clearBearerToken();
    set({ user: null, status: 'ready' });
  },
}));
