export const MAX_NAME_LENGTH = 16;

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH) || "Player";
}

/** Appends a number when another seat already uses the name. */
export function uniqueName(name: string, taken: readonly (string | null)[]): string {
  if (!taken.includes(name)) return name;
  for (let n = 2; ; n++) {
    const candidate = `${name.slice(0, MAX_NAME_LENGTH - 2)} ${n}`;
    if (!taken.includes(candidate)) return candidate;
  }
}
