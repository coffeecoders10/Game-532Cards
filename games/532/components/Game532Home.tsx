"use client";

import type { Card } from "@/lib/cards/cards";
import { GameHome } from "@/components/table/GameHome";
import { storage532 } from "@/games/532/net/table";
import { Emblem532 } from "./Emblem532";

/** A sample hand that shows off the two odd 7s in the deck. */
const FAN: Card[] = [
  { suit: "S", rank: 7 },
  { suit: "D", rank: 12 },
  { suit: "S", rank: 14 },
  { suit: "H", rank: 13 },
  { suit: "H", rank: 7 },
];

/** Landing page for 5-3-2. */
export function Game532Home() {
  return (
    <GameHome
      slug="532"
      name="5-3-2"
      emblem={<Emblem532 animated />}
      tagline="Three players. Ten hands. Win what you promised, then trade for the rest."
      fan={FAN}
      storage={storage532}
    />
  );
}
