import type { ReactNode, RefObject } from "react";
import styles from "./RulesDialog.module.css";

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  /** Heading, e.g. "How 5-3-2 plays". */
  title: string;
  /** Tells a second dialog on the same page (a scoreboard beside the rules) apart for assistive tech. */
  id?: string;
  /** An `<ol>` of rules. */
  children: ReactNode;
}

/** Modal rules sheet shared by every game. Open it with `dialogRef.current?.showModal()`. */
export function RulesDialog({ dialogRef, title, id = "rules-title", children }: Props) {
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={id}
      onClick={(e) => {
        // Clicking the backdrop (the dialog element itself) closes it.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className={styles.body}>
        <h2 id={id}>{title}</h2>
        {children}
        <form method="dialog">
          <button type="submit" className={styles.close}>
            Back to the table
          </button>
        </form>
      </div>
    </dialog>
  );
}
