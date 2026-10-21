import type { CSSProperties } from "react";
import Link from "next/link";
import { PlayingCard } from "@/components/cards/PlayingCard";
import { type GameInfo, gameHref } from "@/games/registry";
import styles from "./GameTile.module.css";

/** A game on the hub: emblem, name, one-line pitch, and quick facts. The whole tile is the link. */
export function GameTile({ game }: { game: GameInfo }) {
  return (
    <Link href={gameHref(game)} className={styles.tile}>
      <span className={styles.stage} aria-hidden="true">
        {game.cards.map((card, i) => (
          <PlayingCard
            key={i}
            card={card}
            className={styles.stageCard}
            style={{ "--d": i - (game.cards.length - 1) / 2 } as CSSProperties}
          />
        ))}
      </span>
      <span className={styles.name}>{game.title}</span>
      <span className={styles.tagline}>{game.tagline}</span>
      <span className={styles.foot}>
        <span className={styles.facts}>
          {game.facts.map((fact) => (
            <span key={fact} className={styles.chip}>
              {fact}
            </span>
          ))}
        </span>
        <span className={styles.play}>
          Play <span aria-hidden="true">›</span>
        </span>
      </span>
    </Link>
  );
}

/** Placeholder that tells people more games are on the way. Not a link. */
export function ComingSoonTile() {
  return (
    <div className={`${styles.tile} ${styles.soon}`}>
      <span className={styles.name}>More tables soon</span>
      <span className={styles.tagline}>New card games are being dealt. Check back for the next one.</span>
    </div>
  );
}
