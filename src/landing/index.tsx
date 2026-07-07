import * as React from "react";
import styles from "./style.module.css";

export function Landing({ onEnter }: { onEnter: () => void }) {
  const [clicked, setClicked] = React.useState(false);

  return (
    <button
      className={`${styles.button} ${clicked ? styles.clicked : ""}`}
      onClick={() => {
        if (clicked) return;
        setClicked(true);
        onEnter();
      }}
    >
      {clicked ? "···" : "enter"}
    </button>
  );
}
