import type { Card, Suit } from "./cards";

/** One card played into a trick, by the seat that played it. */
export interface TrickPlay {
  seat: number;
  card: Card;
}

/** Cards a player may play into a trick: they must follow the led suit when they can. */
export function followCards(hand: readonly Card[], trick: readonly TrickPlay[]): Card[] {
  if (trick.length === 0) return hand.slice();
  const led = trick[0].card.suit;
  const following = hand.filter((c) => c.suit === led);
  return following.length > 0 ? following : hand.slice();
}

/** Seat of the winning play: highest trump if any trump was played, else highest of the led suit. */
export function trickWinnerSeat(trick: readonly TrickPlay[], trump: Suit): number {
  const led = trick[0].card.suit;
  const beats = (a: Card, b: Card) => {
    const aTrump = a.suit === trump;
    const bTrump = b.suit === trump;
    if (aTrump !== bTrump) return aTrump;
    if (a.suit !== b.suit) return a.suit === led;
    return a.rank > b.rank;
  };
  let best = trick[0];
  for (const play of trick.slice(1)) {
    if (beats(play.card, best.card)) best = play;
  }
  return best.seat;
}
