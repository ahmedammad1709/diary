const STORAGE_KEY = 'living-ink-diary-memory-v1';
const MAX_ENTRIES = 20;

export function readMemory() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(isMemoryEntry).slice(-MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

export function writeMemory(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.filter(isMemoryEntry).slice(-MAX_ENTRIES)));
}

export function clearMemory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function makeMemoryEntry(role, text, extras = {}) {
  return {
    role,
    text,
    createdAt: new Date().toISOString(),
    ...extras
  };
}

function isMemoryEntry(entry) {
  return (
    entry &&
    (entry.role === 'user' || entry.role === 'diary') &&
    typeof entry.text === 'string' &&
    entry.text.trim().length > 0
  );
}
