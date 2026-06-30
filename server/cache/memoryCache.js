const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key, value, ttlMs = 30_000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function invalidate(pattern) {
  for (const key of store.keys()) {
    if (key.includes(pattern)) store.delete(key);
  }
}

function clear() {
  store.clear();
}

module.exports = { get, set, invalidate, clear };
