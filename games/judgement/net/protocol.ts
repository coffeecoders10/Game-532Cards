import { type Card, isCard } from "@/lib/cards/cards";
import type { CommonAction } from "@/lib/net/wire";

/** What a player asks the host to do. The host decides whether it is allowed. */
export type GameAction =
  | { type: "judge"; count: number }
  | { type: "play"; card: Card }
  | { type: "ready" }
  | { type: "end" };

export type Action = GameAction | CommonAction;

export function parseGameAction(a: Record<string, unknown>): GameAction | null {
  switch (a.type) {
    case "ready":
      return { type: "ready" };
    case "end":
      return { type: "end" };
    case "judge":
      return typeof a.count === "number" ? { type: "judge", count: a.count } : null;
    case "play":
      return isCard(a.card) ? { type: "play", card: { suit: a.card.suit, rank: a.card.rank } } : null;
    default:
      return null;
  }
}
