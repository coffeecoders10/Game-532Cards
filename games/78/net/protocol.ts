import { isCard, isSuit, type Suit } from "@/lib/cards/cards";
import type { CommonAction } from "@/lib/net/wire";
import { STACKS, type Place, type Source } from "../game/engine";

/** What a player asks the host to do. The host decides whether it is allowed. */
export type GameAction =
  | { type: "trump"; suit: Suit }
  | { type: "take"; source: Source }
  | { type: "give"; place: Place }
  | { type: "play"; place: Place }
  | { type: "ready" };

export type Action = GameAction | CommonAction;

const isSlot = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < STACKS;

function parsePlace(raw: unknown): Place | null {
  if (typeof raw !== "object" || raw === null) return null;
  const p = raw as Record<string, unknown>;
  if (p.zone === "hand" && isCard(p.card)) return { zone: "hand", card: { suit: p.card.suit, rank: p.card.rank } };
  if (p.zone === "table" && isSlot(p.slot)) return { zone: "table", slot: p.slot };
  return null;
}

function parseSource(raw: unknown): Source | null {
  if (typeof raw !== "object" || raw === null) return null;
  const s = raw as Record<string, unknown>;
  if (s.zone === "hand") return { zone: "hand" };
  if (s.zone === "table" && isSlot(s.slot)) return { zone: "table", slot: s.slot };
  return null;
}

export function parseGameAction(a: Record<string, unknown>): GameAction | null {
  switch (a.type) {
    case "ready":
      return { type: "ready" };
    case "trump":
      return isSuit(a.suit) ? { type: "trump", suit: a.suit } : null;
    case "take": {
      const source = parseSource(a.source);
      return source ? { type: "take", source } : null;
    }
    case "give":
    case "play": {
      const place = parsePlace(a.place);
      return place ? { type: a.type, place } : null;
    }
    default:
      return null;
  }
}
