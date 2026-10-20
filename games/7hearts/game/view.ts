import type { Card } from "@/lib/cards/cards";
import type { TableViewOf } from "@/lib/net/view";
import type { Board, Game, Move, RoundSummary, Step } from "./engine";

/**
 * What one player is allowed to see. The host builds one per seat and sends it encrypted to
 * that seat only: other hands never leave the host until a round ends and they are revealed.
 */
export interface GameView {
  round: number;
  players: number;
  step: Step;
  board: Board;
  turn: number;
  lastMove: Move | null;
  handCounts: number[];
  hand: Card[];
  scores: number[];
  history: number[][];
  summary: RoundSummary | null;
  ready: boolean[];
}

export type TableView = TableViewOf<GameView>;

export function gameViewFor(g: Game, seat: number): GameView {
  return {
    round: g.round,
    players: g.players,
    step: g.step,
    board: g.board,
    turn: g.turn,
    lastMove: g.lastMove,
    handCounts: g.hands.map((h) => h.length),
    hand: g.hands[seat],
    scores: g.scores,
    history: g.history,
    summary: g.summary,
    ready: g.ready,
  };
}
