import { Fragment } from "react";
import styles from "./english-founder.module.css";

// Sets a heading in fixed phrases so lines break between ideas, not inside
// them. The words are the copy itself; if the copy changes and no longer
// matches the phrases, the text is rendered as it is.
export function Phrases({ text, phrases }: { text: string; phrases: readonly string[] }) {
  if (phrases.join(" ") !== text) return <>{text}</>;
  return (
    <>
      {phrases.map((phrase, index) => (
        <Fragment key={phrase}>{index > 0 ? " " : null}<span className={styles.phrase}>{phrase}</span></Fragment>
      ))}
    </>
  );
}
