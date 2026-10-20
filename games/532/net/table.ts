import type { TableAdapter } from "@/lib/net/useTable";
import { createStorage } from "@/lib/net/storage";
import {
  type Game,
  chooseTrump,
  collectTrick,
  giveCard,
  markReady,
  newGame,
  playCard,
} from "../game/engine";
import { type GameView, gameViewFor } from "../game/view";
import { roomIdFor } from "./config";
import { type GameAction, parseGameAction } from "./protocol";

/** How long a finished hand stays on the table before it is swept to the winner. */
export const TRICK_PAUSE_MS = 2300;

export const storage532 = createStorage("532cards");

/** Plugs the 5-3-2 rules into the shared host/guest sessions. */
export const adapter532: TableAdapter<Game, GameView, GameAction> = {
  roomId: roomIdFor,
  storage: storage532,
  engine: {
    seats: 3,
    startError: "Three players are needed.",
    newGame,
    act(game, seat, action, randomInt) {
      switch (action.type) {
        case "trump":
          return chooseTrump(game, seat, action.suit, randomInt);
        case "give":
          return giveCard(game, seat, action.card, randomInt);
        case "play":
          return playCard(game, seat, action.card);
        case "ready":
          return markReady(game, seat, randomInt);
      }
    },
    view: gameViewFor,
    parseAction: parseGameAction,
    auto: (game) =>
      game.step === "trickDone" ? { delayMs: TRICK_PAUSE_MS, run: collectTrick } : null,
  },
};
