/** Per-tab persistence (sessionStorage) so a refresh rejoins the same table. All access is best effort. */

const hostingKey = (code: string) => `532cards:hosting:${code}`;
const snapshotKey = (code: string) => `532cards:snapshot:${code}`;

function safely<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const markHosting = (code: string) =>
  safely(() => sessionStorage.setItem(hostingKey(code), "1"), undefined);

export const isHosting = (code: string) =>
  safely(() => sessionStorage.getItem(hostingKey(code)) === "1", false);

export const saveSnapshot = (code: string, snapshot: unknown) =>
  safely(() => sessionStorage.setItem(snapshotKey(code), JSON.stringify(snapshot)), undefined);

export const loadSnapshot = (code: string): unknown =>
  safely(() => {
    const raw = sessionStorage.getItem(snapshotKey(code));
    return raw ? JSON.parse(raw) : null;
  }, null);

export const clearTable = (code: string) =>
  safely(() => {
    sessionStorage.removeItem(hostingKey(code));
    sessionStorage.removeItem(snapshotKey(code));
  }, undefined);

const NAME_KEY = "532cards:name";
export const loadName = () => safely(() => localStorage.getItem(NAME_KEY) ?? "", "");
export const saveName = (name: string) => safely(() => localStorage.setItem(NAME_KEY, name), undefined);
