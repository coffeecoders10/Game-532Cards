import { type Card, type Suit, isCard, isSuit } from "@/lib/cards/cards";
import type { CommonAction } from "@/lib/net/wire";

/** What a player asks the host to do. The host decides whether it is allowed. */
export type GameAction =
  | { type: "trump"; suit: Suit }
  | { type: "give"; card: Card }
  | { type: "play"; card: Card }
  | { type: "ready" };

export type Action = GameAction | CommonAction;

export function parseGameAction(a: Record<string, unknown>): GameAction | null {
  switch (a.type) {
    case "ready":
      return { type: "ready" };
    case "trump":
      return isSuit(a.suit) ? { type: "trump", suit: a.suit } : null;
    case "give":
    case "play":
      return isCard(a.card) ? { type: a.type, card: { suit: a.card.suit, rank: a.card.rank } } : null;
    default:
      return null;
  }
}
