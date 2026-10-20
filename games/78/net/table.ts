import { createStorage } from "@/lib/net/storage";
import type { TableAdapter } from "@/lib/net/useTable";
import {
  type Game,
  chooseTrump,
  collectTrick,
  giveCard,
  markReady,
  newGame,
  playCard,
  takeCard,
} from "../game/engine";
import { type GameView, gameViewFor } from "../game/view";
import { roomIdFor } from "./config";
import { type GameAction, parseGameAction } from "./protocol";

/** How long a finished hand stays on the table before it is swept to the winner. */
export const TRICK_PAUSE_MS = 2300;

export const storage78 = createStorage("78cards");

/** Plugs the 7-8 rules into the shared host/guest sessions. */
export const adapter78: TableAdapter<Game, GameView, GameAction> = {
  roomId: roomIdFor,
  storage: storage78,
  engine: {
    seats: 2,
    startError: "Two players are needed.",
    newGame,
    act(game, seat, action, randomInt) {
      switch (action.type) {
        case "trump":
          return chooseTrump(game, seat, action.suit);
        case "take":
          return takeCard(game, seat, action.source, randomInt);
        case "give":
          return giveCard(game, seat, action.place);
        case "play":
          return playCard(game, seat, action.place);
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
