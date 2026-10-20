"use client";

import type { Card } from "@/lib/cards/cards";
import { GameHome } from "@/components/table/GameHome";
import { storage78 } from "@/games/78/net/table";
import { Emblem78 } from "./Emblem78";

/** A sample hand: the two odd 7s, with an 8 and a pair of high cards. */
const FAN: Card[] = [
  { suit: "S", rank: 7 },
  { suit: "D", rank: 8 },
  { suit: "C", rank: 14 },
  { suit: "H", rank: 12 },
  { suit: "H", rank: 7 },
];

/** Landing page for 7-8. */
export function Game78Home() {
  return (
    <GameHome
      slug="78"
      name="7-8"
      emblem={<Emblem78 animated />}
      tagline="Two players. Fifteen hands. Win your number, and take the rest from the other side."
      fan={FAN}
      storage={storage78}
    />
  );
}
