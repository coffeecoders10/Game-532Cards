import { type Card, type Rank, SUITS, type Suit } from "@/lib/cards/cards";

/**
 * The deck for a given number of players, trimmed so everyone is dealt the same number of cards:
 * 3 and 6 players lose all four 2s, 5 players lose the 2 of Clubs and the 2 of Diamonds, 4 keep all 52.
 * Ace is stored as rank 14.
 */
export function buildDeck(players: number): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      if (rank === 2 && dropsTwo(players, suit)) continue;
      deck.push({ suit, rank: rank as Rank });
    }
  }
  return deck;
}

function dropsTwo(players: number, suit: Suit) {
  if (players === 3 || players === 6) return true;
  return players === 5 && (suit === "C" || suit === "D");
}
