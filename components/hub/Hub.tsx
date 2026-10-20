import type { CSSProperties } from "react";
import type { Card } from "@/lib/cards/cards";
import { PlayingCard } from "@/components/cards/PlayingCard";
import Image from "next/image";
import { FeltPage } from "@/components/ui/FeltPage";
import { Watermark } from "@/components/ui/Watermark";
import { GAMES } from "@/games/registry";
import { ComingSoonTile, GameTile } from "./GameTile";
import styles from "./Hub.module.css";

/** A royal-flush-ish fan to set the mood. Purely decorative. */
const FAN: Card[] = [
  { suit: "S", rank: 10 },
  { suit: "H", rank: 11 },
  { suit: "C", rank: 12 },
  { suit: "D", rank: 13 },
  { suit: "S", rank: 14 },
];

/** The landing page: a title, a fan of cards, and a tile for every game. */
export function Hub() {
  return (
    <FeltPage className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.copy}>
          <div className={styles.brand}>
            <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/cardgames_logo.png`} alt="" width={44} height={44} priority className={styles.logo} />
            <p className={styles.eyebrow}>Coffee Coders</p>
          </div>
          <h1 className={styles.title}>Card Games</h1>
          <p className={styles.tagline}>Pull up a chair. Pick a game, send a code to your friends, and deal.</p>
        </div>
        <div className={styles.fan} aria-hidden="true">
          {FAN.map((card, i) => (
            <PlayingCard key={i} card={card} style={{ "--d": i - 2, "--k": i } as CSSProperties} className={styles.fanCard} />
          ))}
        </div>
      </header>

      <section className={styles.games} aria-label="Games">
        {GAMES.map((game) => (
          <GameTile key={game.slug} game={game} />
        ))}
        <ComingSoonTile />
      </section>

      <Watermark />
    </FeltPage>
  );
}
