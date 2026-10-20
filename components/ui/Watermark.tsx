import Image from "next/image";
import styles from "./Watermark.module.css";

export const COFFEECODERS_URL = "https://coffeecoders.cc/";

/** Quiet "Built by CoffeeCoders" credit with the logo, linking to coffeecoders.cc. Sits at the foot of top-level pages. */
export function Watermark({ className }: { className?: string }) {
  return (
    <a
      href={COFFEECODERS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={[styles.mark, className].filter(Boolean).join(" ")}
    >
      <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/coffeecoders_logo.png`} alt="" width={28} height={28} className={styles.logo} />
      <span>
        Built by <strong>CoffeeCoders</strong>
      </span>
    </a>
  );
}
