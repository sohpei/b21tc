import styles from "./style.module.css";

export function HeroLetter() {
  return (
    <div className={styles.letter}>
      {/* ── Edit this paragraph to change the intro letter ── */}
      <p className={styles.text}>
        Dear Building 21,
        <br />
        <br />
        You were a building, a community, the warmth of an old friend, the
        electricity of new ideas, haphazardly trailing potted plants, the smell
        of soup served in a mug, three bathtubs, a fridge that always contained
        leftovers, walking around in socks, potlucks filled with existential
        conversation. You were a big green door, beyond which anything could
        happen. We miss you.
        <br />
        <br />
        From,
        <br />
        <em>Those who have closed the door, but not forgotten.</em>
      </p>

      <div className={styles.scrollHint}>
        <span>explore the time capsule</span>
        <span>↓</span>
      </div>
    </div>
  );
}
