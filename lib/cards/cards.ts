export const SUITS = ["S", "H", "D", "C"] as const;
export type Suit = (typeof SUITS)[number];

/** 2 is the lowest rank, 14 is the Ace. Games use the subset they need. */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  suit: Suit;
  rank: Rank;
}

/** Returns a random integer in [0, n). Injected so the engine stays deterministic under test. */
export type RandomInt = (n: number) => number;

export const SUIT_NAMES: Record<Suit, string> = {
  S: "Spades",
  H: "Hearts",
  D: "Diamonds",
  C: "Clubs",
};

export const RANK_LABELS: Record<Rank, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

export const cardKey = (c: Card) => `${c.rank}${c.suit}`;
export const sameCard = (a: Card, b: Card) => a.suit === b.suit && a.rank === b.rank;
export const cardName = (c: Card) => `${RANK_LABELS[c.rank]} of ${SUIT_NAMES[c.suit]}`;

export function isSuit(value: unknown): value is Suit {
  return typeof value === "string" && (SUITS as readonly string[]).includes(value);
}

export function isCard(value: unknown): value is Card {
  if (typeof value !== "object" || value === null) return false;
  const { suit, rank } = value as Record<string, unknown>;
  return isSuit(suit) && typeof rank === "number" && Number.isInteger(rank) && rank >= 2 && rank <= 14;
}

/** Fisher-Yates; returns a new array. */
export function shuffle<T>(items: readonly T[], randomInt: RandomInt): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Display order for a hand: trump first, then by suit, high to low. */
export function sortHand(hand: readonly Card[], trump: Suit | null): Card[] {
  const order: Suit[] = ["S", "H", "C", "D"];
  const suitRank = (s: Suit) => (s === trump ? -1 : order.indexOf(s));
  return hand
    .slice()
    .sort((a, b) => suitRank(a.suit) - suitRank(b.suit) || b.rank - a.rank);
}

export const isRed = (suit: Suit) => suit === "H" || suit === "D";
