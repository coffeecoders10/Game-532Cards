import type { InputHTMLAttributes } from "react";
import styles from "./TextField.module.css";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  /** Keep the label for screen readers only. */
  hideLabel?: boolean;
  /** `code` is the big spaced-out style for short join codes. */
  variant?: "text" | "code";
}

export function TextField({ id, label, hideLabel, variant = "text", className, ...rest }: Props) {
  return (
    <>
      <label htmlFor={id} className={hideLabel ? styles.srOnly : styles.label}>
        {label}
      </label>
      <input
        id={id}
        className={[styles.input, variant === "code" ? styles.code : "", className].filter(Boolean).join(" ")}
        {...rest}
      />
    </>
  );
}
