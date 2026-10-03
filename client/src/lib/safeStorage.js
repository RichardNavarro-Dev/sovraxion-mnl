const memory = new Map();

function probe() {
  try {
    const store = window.localStorage;
    const key = '__sovx_probe__';
    store.setItem(key, '1');
    store.removeItem(key);
    return store;
  } catch {
    return null;
  }
}

let backing;

function getBacking() {
  if (backing === undefined) backing = typeof window === 'undefined' ? null : probe();
  return backing;
}

export const safeStorage = {
  getItem(name) {
    const store = getBacking();
    if (store) {
      try {
        return store.getItem(name);
      } catch {
        return memory.get(name) ?? null;
      }
    }
    return memory.get(name) ?? null;
  },
  setItem(name, value) {
    const store = getBacking();
    if (store) {
      try {
        store.setItem(name, value);
        return;
      } catch {
        memory.set(name, value);
        return;
      }
    }
    memory.set(name, value);
  },
  removeItem(name) {
    const store = getBacking();
    if (store) {
      try {
        store.removeItem(name);
      } catch {
        memory.delete(name);
      }
    }
    memory.delete(name);
  },
};
