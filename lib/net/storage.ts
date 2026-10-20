/** Per-tab persistence (sessionStorage) so a refresh rejoins the same table. All access is best effort. */

function safely<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export interface TableStorage {
  markHosting(code: string): void;
  isHosting(code: string): boolean;
  saveSnapshot(code: string, snapshot: unknown): void;
  loadSnapshot(code: string): unknown;
  clearTable(code: string): void;
  loadName(): string;
  saveName(name: string): void;
}

/** Storage keys are namespaced per game (`"<slug>cards:..."`), see DESIGN.md §8. */
export function createStorage(prefix: string): TableStorage {
  const hostingKey = (code: string) => `${prefix}:hosting:${code}`;
  const snapshotKey = (code: string) => `${prefix}:snapshot:${code}`;
  const nameKey = `${prefix}:name`;
  return {
    markHosting: (code) => safely(() => sessionStorage.setItem(hostingKey(code), "1"), undefined),
    isHosting: (code) => safely(() => sessionStorage.getItem(hostingKey(code)) === "1", false),
    saveSnapshot: (code, snapshot) =>
      safely(() => sessionStorage.setItem(snapshotKey(code), JSON.stringify(snapshot)), undefined),
    loadSnapshot: (code) =>
      safely(() => {
        const raw = sessionStorage.getItem(snapshotKey(code));
        return raw ? JSON.parse(raw) : null;
      }, null),
    clearTable: (code) =>
      safely(() => {
        sessionStorage.removeItem(hostingKey(code));
        sessionStorage.removeItem(snapshotKey(code));
      }, undefined),
    loadName: () => safely(() => localStorage.getItem(nameKey) ?? "", ""),
    saveName: (name) => safely(() => localStorage.setItem(nameKey, name), undefined),
  };
}
