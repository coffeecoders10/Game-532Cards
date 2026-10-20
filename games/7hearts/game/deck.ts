import { type Card, type Rank, SUITS } from "@/lib/cards/cards";

/** The full 52-card deck: Ace through King in every suit, no jokers. Ace is stored as rank 14. */
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) deck.push({ suit, rank: rank as Rank });
  }
  return deck;
}
