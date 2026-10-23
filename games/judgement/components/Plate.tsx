import { PlayingCard } from "@/components/cards/PlayingCard";
import styles from "./Plate.module.css";

interface Props {
  name: string | null;
  connected: boolean;
  isYou?: boolean;
  /** The seat's judgement, once made. */
  judgement: number | null;
  wins: number;
  handCount: number;
  /** Whose move it is: judging or playing. */
  isTurn: boolean;
  /** This seat just won the hand on the table. */
  isWinner: boolean;
  /** Small label on the avatar, such as "Starts" or "Leads". */
  tag: string | null;
  /** A player's own plate sits in a row; opponents' stack on phones. */
  me?: boolean;
}

type Standing = "under" | "met" | "over";

/** Where a player stands against their judgement: still short of it, exactly on it, or past it for good. */
const standing = (wins: number, judgement: number): Standing => (wins < judgement ? "under" : wins === judgement ? "met" : "over");

const STANDING_WORDS: Record<Standing, string> = {
  under: "still short of the call",
  met: "on the call",
  over: "past the call",
};

/** A player's nameplate: who they are, what they called, how many hands they hold, and whose move it is. */
export function Plate({ name, connected, isYou, judgement, wins, handCount, isTurn, isWinner, tag, me }: Props) {
  const empty = name === null;
  const state = judgement === null ? null : standing(wins, judgement);

  return (
    <div
      className={styles.plate}
      data-me={me}
      data-turn={isTurn}
      data-winner={isWinner}
      data-away={!empty && !connected}
      data-empty={empty}
    >
      <div className={styles.avatar} aria-hidden="true">
        {empty ? "?" : name.slice(0, 1).toUpperCase()}
        {tag && <span className={styles.tag}>{tag}</span>}
      </div>

      <div className={styles.info}>
        <span className={styles.name}>
          {empty ? "Empty seat" : name}
          {isYou && <em> (you)</em>}
        </span>

        {judgement === null || state === null ? (
          <span className={styles.stat} data-state="waiting">
            {isTurn ? "Judging…" : "Waiting"}
          </span>
        ) : (
          <span
            className={styles.stat}
            data-state={state}
            role="img"
            aria-label={`Called ${judgement}, won ${wins}: ${STANDING_WORDS[state]}`}
          >
            <b key={wins}>{wins}</b>
            <span aria-hidden="true"> / </span>
            <i key={`j${judgement}`}>{judgement}</i>
          </span>
        )}
      </div>

      {handCount > 0 && (
        <span className={styles.cards} aria-label={`${handCount} cards`}>
          <PlayingCard faceDown className={styles.mini} />
          <b>{handCount}</b>
        </span>
      )}

      {isWinner && (
        <span key={wins} className={styles.pop} aria-hidden="true">
          +1
        </span>
      )}
    </div>
  );
}
