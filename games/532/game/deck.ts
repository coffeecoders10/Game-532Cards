import { type Card, type Rank, SUITS } from "@/lib/cards/cards";

/** 8 through Ace in all four suits, plus the 7 of Spades and 7 of Hearts: 30 cards. */
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 8; rank <= 14; rank++) deck.push({ suit, rank: rank as Rank });
  }
  deck.push({ suit: "S", rank: 7 }, { suit: "H", rank: 7 });
  return deck;
}
