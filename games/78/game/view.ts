import type { Card, Suit } from "@/lib/cards/cards";
import type { TableViewOf } from "@/lib/net/view";
import type { DealSummary, Game, Source, Step, TrickPlay } from "./engine";

/**
 * What one player is allowed to see. The host builds one per seat and sends it encrypted to
 * that seat only: the opponent's hand, everyone's face-down cards and the undealt cards never
 * leave the host.
 */

/** A table column as anyone may see it: the face-up card, and whether a card lies beneath. */
export interface StackView {
  up: Card | null;
  hasDown: boolean;
}

export interface SwapStep {
  taker: number;
  giver: number;
  /** Swaps still to play, including this one. */
  remaining: number;
  total: number;
  /** What the taker has chosen to take. A random hand card is shown to the taker only. */
  pending: { source: Source; card: Card | null } | null;
}

export interface SwapNotice {
  id: number;
  taker: number;
  giver: number;
  takenFrom: Source;
  givenFrom: Source;
  /** Only the two players involved see the cards: what they received and what they gave away. */
  received: Card | null;
  gave: Card | null;
}

export interface GameView {
  deal: number;
  step: Step;
  trump: Suit | null;
  /** Role (7 or 8) of each seat: also the number of hands that player is after. */
  roles: number[];
  wins: number[];
  handCounts: number[];
  table: StackView[][];
  leader: number;
  turn: number;
  trick: TrickPlay[];
  trickWinner: number | null;
  tricksPlayed: number;
  hand: Card[];
  swap: SwapStep | null;
  lastSwap: SwapNotice | null;
  summary: DealSummary | null;
  ready: boolean[];
  made: number[];
  dealsPlayed: number;
}

export type TableView = TableViewOf<GameView>;

export function gameViewFor(g: Game, seat: number): GameView {
  const debt = g.step === "exchange" ? g.debt : null;
  const swap = g.lastSwap;
  const involved = swap !== null && (swap.taker === seat || swap.giver === seat);
  return {
    deal: g.deal,
    step: g.step,
    trump: g.trump,
    roles: g.roles,
    wins: g.wins,
    handCounts: g.hands.map((h) => h.length),
    table: g.table.map((stacks) => stacks.map((s) => ({ up: s.up, hasDown: s.down !== null }))),
    leader: g.leader,
    turn: g.turn,
    trick: g.trick,
    trickWinner: g.trickWinner,
    tricksPlayed: g.tricksPlayed,
    hand: g.hands[seat],
    swap: debt
      ? {
          taker: debt.taker,
          giver: debt.giver,
          remaining: debt.count,
          total: g.swapsTotal,
          pending: g.pending
            ? {
                source: g.pending.source,
                // Face-up cards are public; a card drawn blind from a hand is for the taker's eyes only.
                card: g.pending.source.zone === "table" || debt.taker === seat ? g.pending.card : null,
              }
            : null,
        }
      : null,
    lastSwap: swap
      ? {
          id: swap.id,
          taker: swap.taker,
          giver: swap.giver,
          takenFrom: swap.takenFrom,
          givenFrom: swap.givenFrom,
          received: involved ? (swap.taker === seat ? swap.taken : swap.given) : null,
          gave: involved ? (swap.taker === seat ? swap.given : swap.taken) : null,
        }
      : null,
    summary: g.summary,
    ready: g.ready,
    made: g.made,
    dealsPlayed: g.dealsPlayed,
  };
}
