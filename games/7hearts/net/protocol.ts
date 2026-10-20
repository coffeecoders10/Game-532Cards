import { type Card, isCard } from "@/lib/cards/cards";
import type { CommonAction } from "@/lib/net/wire";

/** What a player asks the host to do. The host decides whether it is allowed. */
export type GameAction = { type: "play"; card: Card } | { type: "pass" } | { type: "ready" };

export type Action = GameAction | CommonAction;

export function parseGameAction(a: Record<string, unknown>): GameAction | null {
  switch (a.type) {
    case "pass":
      return { type: "pass" };
    case "ready":
      return { type: "ready" };
    case "play":
      return isCard(a.card) ? { type: "play", card: { suit: a.card.suit, rank: a.card.rank } } : null;
    default:
      return null;
  }
}
