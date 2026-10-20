import type { CSSProperties } from "react";
import Link from "next/link";
import { PlayingCard } from "./PlayingCard";
import styles from "./StatusScreen.module.css";

interface Props {
  title: string;
  body?: string;
  /** Show the shuffling cards while something is in progress. */
  busy?: boolean;
  action?: "home";
}

/** Full-screen message on the felt: connecting, table not found, table full, and so on. */
export function StatusScreen({ title, body, busy, action }: Props) {
  return (
    <div className={styles.screen}>
      {busy && (
        <div className={styles.shuffle} aria-hidden="true">
          {[0, 1, 2].map((n) => (
            <PlayingCard key={n} faceDown className={styles.flit} style={{ "--cw": "58px", "--n": n } as CSSProperties} />
          ))}
        </div>
      )}
      <h1 className={styles.title}>{title}</h1>
      {body && <p className={styles.body}>{body}</p>}
      {action === "home" && (
        <Link href="/" className={styles.button}>
          Back to start
        </Link>
      )}
    </div>
  );
}
