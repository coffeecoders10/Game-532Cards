import {
  type Card,
  type RandomInt,
  type Suit,
  isSuit,
  sameCard,
  shuffle,
} from "@/lib/cards/cards";
import { fail } from "@/lib/cards/rules";
import { buildDeck } from "./deck";

/**
 * Authoritative 7-8 rules. Everything here is pure: each action takes a Game and returns a
 * new Game, or throws a RuleError. Two seats, fixed roles: one player is the 8 (picks trump,
 * leads the first hand) and the other is the 7.
 */

export const SEATS = 2;
export const STACKS = 5;
export const HANDS_PER_DEAL = 15;
const FIRST_DEAL = 5;

export type Role = 7 | 8;
export type Step = "trump" | "exchange" | "play" | "trickDone" | "summary";

/** One of the five columns in front of a player: a face-up card lying on a face-down one. */
export interface Stack {
  up: Card | null;
  down: Card | null;
}

/** A card's spot: somewhere in the hand, or the face-up card of a table column. */
export type Place = { zone: "hand"; card: Card } | { zone: "table"; slot: number };

/** Where a swap takes its card from: a random hand card, or a chosen face-up card. */
export type Source = { zone: "hand" } | { zone: "table"; slot: number };

export interface TrickPlay {
  seat: number;
  card: Card;
  /** Table column it came from, or null if played from the hand. */
  slot: number | null;
}

/** Hands owed from the previous deal: `taker` swaps cards with `giver`, one swap per hand. */
export interface Debt {
  taker: number;
  giver: number;
  count: number;
}

export interface DealSummary {
  wins: number[];
  targets: number[];
  /** What the next deal owes: set when someone won more than their target. */
  debt: Debt | null;
}

export interface Pending {
  source: Source;
  card: Card;
}

/** The most recent completed swap, kept so each side can be told what happened. */
export interface SwapRecord {
  id: number;
  taker: number;
  giver: number;
  taken: Card;
  given: Card;
  takenFrom: Source;
  givenFrom: Source;
}

export interface Game {
  deal: number;
  /** Role (7 or 8) of each seat; fixed for the whole session. */
  roles: number[];
  hands: Card[][];
  table: Stack[][];
  /** Undealt cards (the table cards), never sent to clients. */
  stock: Card[];
  trump: Suit | null;
  step: Step;
  leader: number;
  turn: number;
  trick: TrickPlay[];
  trickWinner: number | null;
  tricksPlayed: number;
  wins: number[];
  /** Swaps still to play this deal (`count` is how many are left). */
  debt: Debt | null;
  swapsTotal: number;
  pending: Pending | null;
  swapCount: number;
  lastSwap: SwapRecord | null;
  summary: DealSummary | null;
  ready: boolean[];
  /** Deals in which each seat reached their target. */
  made: number[];
  dealsPlayed: number;
}

const otherSeat = (seat: number) => 1 - seat;
const emptyTable = (): Stack[][] =>
  [0, 1].map(() => Array.from({ length: STACKS }, () => ({ up: null, down: null })));

export const eightSeat = (g: Pick<Game, "roles">) => g.roles.indexOf(8);

// ---------------------------------------------------------------- card rules

export interface PlayOption {
  place: Place;
  card: Card;
}

/** Every card a player could put down: their hand, plus the face-up card of each table column. */
export function availableCards(hand: readonly Card[], table: readonly Pick<Stack, "up">[]): PlayOption[] {
  const options: PlayOption[] = hand.map((card) => ({ place: { zone: "hand", card }, card }));
  table.forEach((stack, slot) => {
    if (stack.up) options.push({ place: { zone: "table", slot }, card: stack.up });
  });
  return options;
}

/** What may legally be played now: the led suit if the player has it anywhere, otherwise anything. */
export function legalPlays(
  hand: readonly Card[],
  table: readonly Pick<Stack, "up">[],
  trick: readonly TrickPlay[],
): PlayOption[] {
  const options = availableCards(hand, table);
  if (trick.length === 0) return options;
  const led = trick[0].card.suit;
  const following = options.filter((o) => o.card.suit === led);
  return following.length > 0 ? following : options;
}

/** Seat of the winning play: trump beats a plain card, otherwise the led suit wins, higher rank breaking ties. */
export function trickWinnerSeat(trick: readonly TrickPlay[], trump: Suit): number {
  const [lead, reply] = trick;
  const a = lead.card;
  const b = reply.card;
  if (a.suit === b.suit) return b.rank > a.rank ? reply.seat : lead.seat;
  if (b.suit === trump) return reply.seat;
  return lead.seat;
}

/**
 * Who owes whom after a deal. A player who won more hands than their target has taken them
 * from the other, who earns one card swap per hand taken in the next deal.
 */
export function computeDebt(wins: readonly number[], targets: readonly number[]): Debt | null {
  for (const giver of [0, 1]) {
    const extra = wins[giver] - targets[giver];
    if (extra > 0) return { taker: otherSeat(giver), giver, count: extra };
  }
  return null;
}

// -------------------------------------------------------------------- set-up

export function newGame(randomInt: RandomInt): Game {
  const eight = randomInt(2);
  const game: Game = {
    deal: 0,
    roles: eight === 0 ? [8, 7] : [7, 8],
    hands: [[], []],
    table: emptyTable(),
    stock: [],
    trump: null,
    step: "trump",
    leader: eight,
    turn: eight,
    trick: [],
    trickWinner: null,
    tricksPlayed: 0,
    wins: [0, 0],
    debt: null,
    swapsTotal: 0,
    pending: null,
    swapCount: 0,
    lastSwap: null,
    summary: null,
    ready: [false, false],
    made: [0, 0],
    dealsPlayed: 0,
  };
  dealHands(game, null, randomInt);
  return game;
}

/** Starts a deal in place: shuffle, and give each player the first five cards. */
function dealHands(g: Game, debt: Debt | null, randomInt: RandomInt) {
  const deck = shuffle(buildDeck(), randomInt);
  const eight = eightSeat(g);
  const order = [eight, otherSeat(eight)];
  g.deal += 1;
  g.hands = [[], []];
  order.forEach((seat, i) => {
    g.hands[seat] = deck.slice(i * FIRST_DEAL, (i + 1) * FIRST_DEAL);
  });
  g.stock = deck.slice(SEATS * FIRST_DEAL);
  g.table = emptyTable();
  g.trump = null;
  g.step = "trump";
  g.leader = eight;
  g.turn = eight;
  g.trick = [];
  g.trickWinner = null;
  g.tricksPlayed = 0;
  g.wins = [0, 0];
  g.debt = debt;
  g.swapsTotal = debt?.count ?? 0;
  g.pending = null;
  g.lastSwap = null;
  g.summary = null;
  g.ready = [false, false];
}

/** Five face-down cards each, then five face-up cards on top of them. */
function dealTable(g: Game) {
  const eight = eightSeat(g);
  const order = [eight, otherSeat(eight)];
  order.forEach((seat, i) => {
    for (let slot = 0; slot < STACKS; slot++) {
      g.table[seat][slot].down = g.stock[i * STACKS + slot];
      g.table[seat][slot].up = g.stock[(SEATS + i) * STACKS + slot];
    }
  });
  g.stock = [];
}

function startPlay(g: Game) {
  g.step = "play";
  g.leader = eightSeat(g);
  g.turn = g.leader;
}

// ------------------------------------------------------------------- actions

export function chooseTrump(game: Game, seat: number, suit: unknown): Game {
  const g = structuredClone(game);
  if (g.step !== "trump") fail("Trump has already been chosen.");
  if (seat !== eightSeat(g)) fail("Only the 8 chooses trump.");
  if (!isSuit(suit)) fail("Unknown suit.");

  g.trump = suit;
  dealTable(g);
  if (g.debt && g.debt.count > 0) g.step = "exchange";
  else startPlay(g);
  return g;
}

function stackAt(g: Game, seat: number, slot: unknown): Stack {
  if (typeof slot !== "number" || !Number.isInteger(slot) || slot < 0 || slot >= STACKS) {
    fail("There's no such column.");
  }
  return g.table[seat][slot];
}

/** The player owed a swap chooses where to take a card from: a face-up card, or a random one from the hand. */
export function takeCard(game: Game, seat: number, source: Source, randomInt: RandomInt): Game {
  const g = structuredClone(game);
  if (g.step !== "exchange" || !g.debt) fail("No swap is in progress.");
  const { taker, giver } = g.debt;
  if (seat !== taker) fail("It isn't your swap.");
  if (g.pending) fail("You've already chosen a card to take.");

  if (source.zone === "hand") {
    const hand = g.hands[giver];
    g.pending = { source: { zone: "hand" }, card: hand[randomInt(hand.length)] };
  } else {
    const card = stackAt(g, giver, source.slot).up;
    if (!card) fail("That column is empty.");
    g.pending = { source: { zone: "table", slot: source.slot }, card };
  }
  return g;
}

/** The card that `seat` really owns at `place`, throwing if it isn't there. */
function ownedCard(g: Game, seat: number, place: Place): Card {
  if (place.zone === "hand") {
    const card = g.hands[seat].find((c) => sameCard(c, place.card));
    if (!card) fail("That card isn't in your hand.");
    return card;
  }
  const card = stackAt(g, seat, place.slot).up;
  if (!card) fail("That column is empty.");
  return card;
}

/** Removes `card` from a hand, or the face-up card from a column. */
function lift(g: Game, seat: number, where: Place | Source, card: Card) {
  if (where.zone === "hand") {
    const hand = g.hands[seat];
    hand.splice(
      hand.findIndex((c) => sameCard(c, card)),
      1,
    );
  } else {
    g.table[seat][where.slot].up = null;
  }
}

function lay(g: Game, seat: number, where: Place | Source, card: Card) {
  if (where.zone === "hand") g.hands[seat].push(card);
  else g.table[seat][where.slot].up = card;
}

/**
 * The taker hands back one of their own cards. The two cards trade places: a card taken from
 * a column is replaced by the one given, a card taken from a hand joins that hand.
 */
export function giveCard(game: Game, seat: number, place: Place): Game {
  const g = structuredClone(game);
  if (g.step !== "exchange" || !g.debt || !g.pending) fail("Choose a card to take first.");
  const { taker, giver } = g.debt;
  if (seat !== taker) fail("It isn't your swap.");

  const given = ownedCard(g, taker, place);
  const { card: taken, source } = g.pending;

  lift(g, giver, source, taken);
  lift(g, taker, place, given);
  lay(g, taker, place, taken);
  lay(g, giver, source, given);

  g.swapCount += 1;
  g.lastSwap = {
    id: g.swapCount,
    taker,
    giver,
    taken,
    given,
    takenFrom: source,
    givenFrom: place.zone === "hand" ? { zone: "hand" } : { zone: "table", slot: place.slot },
  };
  g.pending = null;
  g.debt.count -= 1;
  if (g.debt.count === 0) {
    g.debt = null;
    startPlay(g);
  }
  return g;
}

export function playCard(game: Game, seat: number, place: Place): Game {
  const g = structuredClone(game);
  if (g.step !== "play") fail("Cards can't be played right now.");
  if (g.turn !== seat) fail("It isn't your turn.");
  const card = ownedCard(g, seat, place);
  const legal = legalPlays(g.hands[seat], g.table[seat], g.trick);
  if (!legal.some((o) => sameCard(o.card, card))) fail("You must follow the suit that was led.");

  lift(g, seat, place, card);
  if (place.zone === "table") {
    // The face-down card underneath turns over and takes its place.
    const stack = g.table[seat][place.slot];
    stack.up = stack.down;
    stack.down = null;
  }
  g.trick.push({ seat, card, slot: place.zone === "table" ? place.slot : null });
  if (g.trick.length < SEATS) {
    g.turn = otherSeat(seat);
    return g;
  }
  const winner = trickWinnerSeat(g.trick, g.trump as Suit);
  g.trickWinner = winner;
  g.wins[winner] += 1;
  g.step = "trickDone";
  return g;
}

/** Clears a finished hand; the winner leads next, or the deal ends after the fifteenth hand. */
export function collectTrick(game: Game): Game {
  const g = structuredClone(game);
  if (g.step !== "trickDone" || g.trickWinner === null) fail("No hand to collect.");
  g.tricksPlayed += 1;
  const winner = g.trickWinner;
  g.trick = [];
  g.trickWinner = null;
  if (g.tricksPlayed < HANDS_PER_DEAL) {
    g.leader = winner;
    g.turn = winner;
    g.step = "play";
    return g;
  }

  g.step = "summary";
  g.summary = {
    wins: g.wins.slice(),
    targets: g.roles.slice(),
    debt: computeDebt(g.wins, g.roles),
  };
  g.made = g.made.map((m, s) => m + (g.wins[s] >= g.roles[s] ? 1 : 0));
  g.dealsPlayed += 1;
  return g;
}

/** Marks a player ready for the next deal; deals it once both are. */
export function markReady(game: Game, seat: number, randomInt: RandomInt): Game {
  const g = structuredClone(game);
  if (g.step !== "summary" || !g.summary) fail("The deal isn't finished.");
  g.ready[seat] = true;
  if (g.ready.every(Boolean)) dealHands(g, g.summary.debt, randomInt);
  return g;
}
