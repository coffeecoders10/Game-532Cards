import type { ReactNode } from "react";
import { Emblem532 } from "./532/components/Emblem532";

export interface GameInfo {
  /** Route segment: the game lives at `/games/<slug>`. */
  slug: string;
  title: string;
  /** One line that sells the game on its hub tile. */
  tagline: string;
  /** Short facts shown as chips on the tile, e.g. "3 players". */
  facts: string[];
  /** Small emblem for the hub tile. */
  emblem: ReactNode;
}

/**
 * Every game in the hub. To add a game: build it under `games/<slug>/`, add its routes under
 * `app/games/<slug>/`, and append an entry here. The hub page picks it up automatically.
 */
export const GAMES: GameInfo[] = [
  {
    slug: "532",
    title: "5-3-2",
    tagline: "Win what you promised, then trade for the rest.",
    facts: ["3 players", "Online"],
    emblem: <Emblem532 size="clamp(52px, 14vw, 68px)" />,
  },
];

export const gameHref = (game: GameInfo) => `/games/${game.slug}`;
