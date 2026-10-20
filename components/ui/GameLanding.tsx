import type { CSSProperties, ReactNode } from "react";
import type { Card } from "@/lib/cards/cards";
import { PlayingCard } from "@/components/cards/PlayingCard";
import { BackLink } from "./BackLink";
import { FeltPage } from "./FeltPage";
import { Watermark } from "./Watermark";
import styles from "./GameLanding.module.css";

interface Props {
  /** Accessible game name, read in place of the visual emblem. */
  name: string;
  /** The game's visual emblem: brass tokens, a monogram, whatever fits. */
  emblem: ReactNode;
  tagline: string;
  /** Cards fanned under the tagline. */
  fan?: Card[];
  /** The start-playing panel (name field, create or join controls). */
  children: ReactNode;
}

/** The shared front door for every game: hero on the left, a start panel on the right. */
export function GameLanding({ name, emblem, tagline, fan, children }: Props) {
  const mid = fan ? (fan.length - 1) / 2 : 0;
  return (
    <FeltPage className={styles.page}>
      <BackLink href="/" className={styles.back}>
        All games
      </BackLink>
      <section className={styles.hero}>
        <h1 className={styles.title} aria-label={name}>
          {emblem}
        </h1>
        <p className={styles.tagline}>{tagline}</p>
        {fan && (
          <div className={styles.fan} aria-hidden="true">
            {fan.map((card, i) => (
              <PlayingCard
                key={i}
                card={card}
                style={{ "--d": i - mid, "--k": i } as CSSProperties}
                className={styles.fanCard}
              />
            ))}
          </div>
        )}
      </section>
      {children}
      <Watermark className={styles.watermark} />
    </FeltPage>
  );
}
