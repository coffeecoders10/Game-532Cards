import { type Card, type Suit, isCard, isSuit } from "@/lib/cards/cards";
import type { TableView } from "../game/view";
import { isPublicKey } from "./crypto";

/** What a player asks the host to do. The host decides whether it is allowed. */
export type Action =
  | { type: "start" }
  | { type: "trump"; suit: Suit }
  | { type: "give"; card: Card }
  | { type: "play"; card: Card }
  | { type: "ready" }
  | { type: "leave" }
  /** Ask the host to resend the current view, in case a message was lost. */
  | { type: "sync" };

/** Messages as they cross the shared room. Anything private is inside a sealed `box`. */
export type Wire =
  | { t: "hello"; id: string; name: string; pk: JsonWebKey }
  | { t: "host"; id: string; pk: JsonWebKey; to?: string }
  | { t: "full"; to: string }
  | { t: "box"; from: string; to: string; iv: string; ct: string };

/** Sealed payload, guest to host. */
export interface ToHost {
  k: "act";
  action: Action;
}

/** Sealed payload, host to guest. */
export type ToGuest =
  | { k: "view"; view: TableView }
  | { k: "error"; message: string }
  | { k: "closed" };

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

export function parseToHost(data: unknown): ToHost | null {
  if (typeof data !== "object" || data === null) return null;
  const m = data as { k?: unknown; action?: unknown };
  if (m.k !== "act" || typeof m.action !== "object" || m.action === null) return null;
  const a = m.action as Record<string, unknown>;
  switch (a.type) {
    case "start":
    case "ready":
    case "leave":
    case "sync":
      return { k: "act", action: { type: a.type } };
    case "trump":
      return isSuit(a.suit) ? { k: "act", action: { type: "trump", suit: a.suit } } : null;
    case "give":
    case "play":
      return isCard(a.card)
        ? { k: "act", action: { type: a.type, card: { suit: a.card.suit, rank: a.card.rank } } }
        : null;
    default:
      return null;
  }
}

export function parseToGuest(data: unknown): ToGuest | null {
  if (typeof data !== "object" || data === null) return null;
  const m = data as Record<string, unknown>;
  if (m.k === "view" && typeof m.view === "object" && m.view !== null) return { k: "view", view: m.view as TableView };
  if (m.k === "error" && typeof m.message === "string") return { k: "error", message: m.message };
  if (m.k === "closed") return { k: "closed" };
  return null;
}
