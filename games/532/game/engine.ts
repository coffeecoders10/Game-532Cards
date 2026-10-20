import {
  type Card,
  type RandomInt,
  type Suit,
  isSuit,
  sameCard,
  shuffle,
} from "@/lib/cards/cards";
import { buildDeck } from "./deck";

/**
 * Authoritative 5-3-2 rules. Everything here is pure: each action takes a Game and
 * returns a new Game, or throws a RuleError. Seats are 0..2 and play proceeds in
 * ascending seat order (wrapping), which the UI renders as clockwise.
 */

export const SEATS = 3;
export const HANDS_PER_ROUND = 10;
const CARDS_PER_DEAL = 5;
const TARGET_ROTATION: Record<number, number> = { 5: 2, 3: 5, 2: 3 };

export type Step = "trump" | "exchange" | "play" | "trickDone" | "summary";

/** `taker` draws a random card from `giver`, then hands back a card of their choice. */
export interface ExchangeRight {
  taker: number;
  giver: number;
}

export interface TrickPlay {
  seat: number;
  card: Card;
}

export interface RoundSummary {
  wins: number[];
  targets: number[];
  /** Exchanges that will be played at the start of the next round. */
  owedNext: ExchangeRight[];
  nextTargets: number[];
}

/** The most recent completed exchange, kept so each side can be told what happened. */
export interface SwapRecord {
  id: number;
  taker: number;
  giver: number;
  taken: Card;
  given: Card;
}

export interface Game {
  round: number;
  /** Target number of hands per seat: some permutation of [5, 3, 2]. */
  targets: number[];
  hands: Card[][];
  /** Undealt cards (second deal), never sent to clients. */
  stock: Card[];
  trump: Suit | null;
  step: Step;
  leader: number;
  turn: number;
  trick: TrickPlay[];
  trickWinner: number | null;
  tricksPlayed: number;
  wins: number[];
  /** Exchanges still to play this round; the first entry is the one in progress. */
  owed: ExchangeRight[];
  /** Card drawn from owed[0].giver, shown only to owed[0].taker. */
  swapCard: Card | null;
  swapCount: number;
  lastSwap: SwapRecord | null;
  summary: RoundSummary | null;
  ready: boolean[];
  /** Rounds in which each seat reached their target. */
  made: number[];
  roundsPlayed: number;
}

export class RuleError extends Error {}

function fail(message: string): never {
  throw new RuleError(message);
}

const range3 = () => [0, 1, 2];
const nextSeat = (seat: number) => (seat + 1) % SEATS;

// ---------------------------------------------------------------- card rules

/** Cards a player may legally play: they must follow the led suit when they can. */
export function legalCards(hand: readonly Card[], trick: readonly TrickPlay[]): Card[] {
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

/**
 * Who owes whom after a round. A player who won more than their target takes cards
 * from players who fell short, one exchange per hand of difference.
 */
export function computeExchanges(wins: readonly number[], targets: readonly number[]): ExchangeRight[] {
  const surplus = range3().map((s) => Math.max(0, wins[s] - targets[s]));
  const deficit = range3().map((s) => Math.max(0, targets[s] - wins[s]));
  const rights: ExchangeRight[] = [];
  for (const taker of range3()) {
    for (const giver of range3()) {
      if (taker === giver) continue;
      const n = Math.min(surplus[taker], deficit[giver]);
      for (let i = 0; i < n; i++) rights.push({ taker, giver });
      surplus[taker] -= n;
      deficit[giver] -= n;
    }
  }
  return rights;
}

// ------------------------------------------------------------------- set-up

function randomTargets(randomInt: RandomInt): number[] {
  return shuffle([5, 3, 2], randomInt);
}

export function newGame(randomInt: RandomInt): Game {
  const game: Game = {
    round: 0,
    targets: randomTargets(randomInt),
    hands: [[], [], []],
    stock: [],
    trump: null,
    step: "trump",
    leader: 0,
    turn: 0,
    trick: [],
    trickWinner: null,
    tricksPlayed: 0,
    wins: [0, 0, 0],
    owed: [],
    swapCard: null,
    swapCount: 0,
    lastSwap: null,
    summary: null,
    ready: [false, false, false],
    made: [0, 0, 0],
    roundsPlayed: 0,
  };
  dealRound(game, game.targets, [], randomInt);
  return game;
}

/** Seats in deal order, starting with whoever holds the 5. */
function dealOrder(targets: readonly number[]): number[] {
  const first = targets.indexOf(5);
  return [first, nextSeat(first), nextSeat(nextSeat(first))];
}

/** Starts a round in place: shuffle and deal the first five cards to each player. */
function dealRound(g: Game, targets: number[], owed: ExchangeRight[], randomInt: RandomInt) {
  const deck = shuffle(buildDeck(), randomInt);
  const order = dealOrder(targets);
  g.round += 1;
  g.targets = targets;
  g.hands = [[], [], []];
  order.forEach((seat, i) => {
    g.hands[seat] = deck.slice(i * CARDS_PER_DEAL, (i + 1) * CARDS_PER_DEAL);
  });
  g.stock = deck.slice(SEATS * CARDS_PER_DEAL);
  g.trump = null;
  g.step = "trump";
  g.leader = order[0];
  g.turn = order[0];
  g.trick = [];
  g.trickWinner = null;
  g.tricksPlayed = 0;
  g.wins = [0, 0, 0];
  g.owed = owed;
  g.swapCard = null;
  g.lastSwap = null;
  g.summary = null;
  g.ready = [false, false, false];
}

function drawSwapCard(g: Game, randomInt: RandomInt) {
  const giverHand = g.hands[g.owed[0].giver];
  g.swapCard = giverHand[randomInt(giverHand.length)];
}

// ------------------------------------------------------------------ actions

export function chooseTrump(game: Game, seat: number, suit: unknown, randomInt: RandomInt): Game {
  const g = structuredClone(game);
  if (g.step !== "trump") fail("Trump has already been chosen.");
  if (seat !== g.targets.indexOf(5)) fail("Only the player holding the 5 chooses trump.");
  if (!isSuit(suit)) fail("Unknown suit.");

  g.trump = suit;
  const order = dealOrder(g.targets);
  order.forEach((s, i) => {
    g.hands[s].push(...g.stock.slice(i * CARDS_PER_DEAL, (i + 1) * CARDS_PER_DEAL));
  });
  g.stock = [];

  if (g.owed.length > 0) {
    g.step = "exchange";
    drawSwapCard(g, randomInt);
  } else {
    g.step = "play";
  }
  return g;
}

/** The player who earned the exchange picks the card they hand back. */
export function giveCard(game: Game, seat: number, card: Card, randomInt: RandomInt): Game {
  const g = structuredClone(game);
  if (g.step !== "exchange" || !g.swapCard) fail("No exchange is in progress.");
  const { taker, giver } = g.owed[0];
  if (seat !== taker) fail("It isn't your exchange.");
  const givenIndex = g.hands[taker].findIndex((c) => sameCard(c, card));
  if (givenIndex < 0) fail("That card isn't in your hand.");

  const taken = g.swapCard;
  const takenIndex = g.hands[giver].findIndex((c) => sameCard(c, taken));
  const [given] = g.hands[taker].splice(givenIndex, 1);
  g.hands[giver].splice(takenIndex, 1);
  g.hands[taker].push(taken);
  g.hands[giver].push(given);

  g.swapCount += 1;
  g.lastSwap = { id: g.swapCount, taker, giver, taken, given };
  g.owed.shift();
  g.swapCard = null;
  if (g.owed.length > 0) {
    drawSwapCard(g, randomInt);
  } else {
    g.step = "play";
  }
  return g;
}

export function playCard(game: Game, seat: number, card: Card): Game {
  const g = structuredClone(game);
  if (g.step !== "play") fail("Cards can't be played right now.");
  if (g.turn !== seat) fail("It isn't your turn.");
  const hand = g.hands[seat];
  const index = hand.findIndex((c) => sameCard(c, card));
  if (index < 0) fail("That card isn't in your hand.");
  if (!legalCards(hand, g.trick).some((c) => sameCard(c, card))) {
    fail("You must follow the suit that was led.");
  }

  const [played] = hand.splice(index, 1);
  g.trick.push({ seat, card: played });
  if (g.trick.length < SEATS) {
    g.turn = nextSeat(seat);
    return g;
  }
  const winner = trickWinnerSeat(g.trick, g.trump as Suit);
  g.trickWinner = winner;
  g.wins[winner] += 1;
  g.step = "trickDone";
  return g;
}

/** Clears a finished trick; the winner leads next, or the round ends after the tenth hand. */
export function collectTrick(game: Game): Game {
  const g = structuredClone(game);
  if (g.step !== "trickDone" || g.trickWinner === null) fail("No hand to collect.");
  g.tricksPlayed += 1;
  const winner = g.trickWinner;
  g.trick = [];
  g.trickWinner = null;
  if (g.tricksPlayed < HANDS_PER_ROUND) {
    g.leader = winner;
    g.turn = winner;
    g.step = "play";
    return g;
  }

  g.step = "summary";
  g.summary = {
    wins: g.wins.slice(),
    targets: g.targets.slice(),
    owedNext: computeExchanges(g.wins, g.targets),
    nextTargets: g.targets.map((t) => TARGET_ROTATION[t]),
  };
  g.made = g.made.map((m, s) => m + (g.wins[s] >= g.targets[s] ? 1 : 0));
  g.roundsPlayed += 1;
  return g;
}

/** Marks a player ready for the next round; deals it once all three are. */
export function markReady(game: Game, seat: number, randomInt: RandomInt): Game {
  const g = structuredClone(game);
  if (g.step !== "summary" || !g.summary) fail("The round isn't finished.");
  g.ready[seat] = true;
  if (g.ready.every(Boolean)) {
    dealRound(g, g.summary.nextTargets, g.summary.owedNext, randomInt);
  }
  return g;
}
