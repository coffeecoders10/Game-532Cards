import { isPublicKey } from "./crypto";

/** Messages as they cross the shared room. Anything private is inside a sealed `box`. */
export type Wire =
  | { t: "hello"; id: string; name: string; pk: JsonWebKey }
  | { t: "host"; id: string; pk: JsonWebKey; to?: string }
  | { t: "full"; to: string }
  | { t: "box"; from: string; to: string; iv: string; ct: string };

/** Actions every game has: the rest belong to the game itself. */
export type CommonAction =
  | { type: "start" }
  | { type: "leave" }
  /** Ask the host to resend the current view, in case a message was lost. */
  | { type: "sync" };

/** Sealed payload, guest to host. */
export interface ToHost<A> {
  k: "act";
  action: A;
}

/** Sealed payload, host to guest. */
export type ToGuest<V> = { k: "view"; view: V } | { k: "error"; message: string } | { k: "closed" };

const isString = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length < 64;

export function parseWire(data: unknown): Wire | null {
  if (typeof data !== "object" || data === null) return null;
  const w = data as Record<string, unknown>;
  switch (w.t) {
    case "hello":
      if (isString(w.id) && typeof w.name === "string" && isPublicKey(w.pk)) {
        return { t: "hello", id: w.id, name: w.name, pk: w.pk };
      }
      return null;
    case "host":
      if (isString(w.id) && isPublicKey(w.pk) && (w.to === undefined || isString(w.to))) {
        return { t: "host", id: w.id, pk: w.pk, to: w.to as string | undefined };
      }
      return null;
    case "full":
      return isString(w.to) ? { t: "full", to: w.to } : null;
    case "box":
      if (isString(w.from) && isString(w.to) && typeof w.iv === "string" && typeof w.ct === "string") {
        return { t: "box", from: w.from, to: w.to, iv: w.iv, ct: w.ct };
      }
      return null;
    default:
      return null;
  }
}

/** Reads the actions common to every game, and hands anything else to the game's own parser. */
export function parseToHost<A>(
  data: unknown,
  parseGameAction: (action: Record<string, unknown>) => A | null,
): ToHost<A | CommonAction> | null {
  if (typeof data !== "object" || data === null) return null;
  const m = data as { k?: unknown; action?: unknown };
  if (m.k !== "act" || typeof m.action !== "object" || m.action === null) return null;
  const a = m.action as Record<string, unknown>;
  if (a.type === "start" || a.type === "leave" || a.type === "sync") {
    return { k: "act", action: { type: a.type } };
  }
  const action = parseGameAction(a);
  return action ? { k: "act", action } : null;
}

export function parseToGuest<V>(data: unknown): ToGuest<V> | null {
  if (typeof data !== "object" || data === null) return null;
  const m = data as Record<string, unknown>;
  if (m.k === "view" && typeof m.view === "object" && m.view !== null) return { k: "view", view: m.view as V };
  if (m.k === "error" && typeof m.message === "string") return { k: "error", message: m.message };
  if (m.k === "closed") return { k: "closed" };
  return null;
}
