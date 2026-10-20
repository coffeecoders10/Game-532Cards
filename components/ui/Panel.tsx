import type { HTMLAttributes } from "react";
import styles from "./Panel.module.css";

/** The frosted dark-green card that holds forms and secondary content on the felt. */
export function Panel({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={[styles.panel, className].filter(Boolean).join(" ")} {...rest} />;
}
