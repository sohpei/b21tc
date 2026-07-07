import * as React from "react";
import artworks from "virtual:artworks";
import { Artifacts } from "~/src/artifacts";
import { HeroLetter } from "~/src/content";
import { Frame } from "~/src/frame";
import { InfiniteCanvas } from "~/src/infinite-canvas";
import type { MediaItem } from "~/src/infinite-canvas/types";
import { Landing } from "~/src/landing";
import { PageLoader } from "~/src/loader";
import styles from "./style.module.css";

export function App() {
  const [media] = React.useState<MediaItem[]>(artworks);
  const [textureProgress, setTextureProgress] = React.useState(0);
  const [entered, setEntered] = React.useState(false);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // Fade the canvas out as the user scrolls into the artifacts section.
  // Direct DOM mutation — no React state, no re-renders.
  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onScroll = () => {
      const vh = window.innerHeight;
      // Start fading at 50% of first viewport, fully gone at 130%
      const t = Math.max(0, Math.min(1, (window.scrollY - vh * 0.5) / (vh * 0.8)));
      el.style.opacity = String(1 - t);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!media.length) {
    return <PageLoader progress={0} />;
  }

  return (
    <>
      {/* Canvas: fixed in background, fades on scroll */}
      <div ref={canvasRef} className={styles.canvasWrapper}>
        <InfiniteCanvas
          media={media}
          onTextureProgress={setTextureProgress}
          scattered={entered}
        />
      </div>

      <Frame />
      <PageLoader progress={textureProgress} />

      {/* Scrollable page */}
      <div className={styles.page}>
        {/* ── Section 1: hero (full viewport) ── */}
        <div className={styles.hero}>
          <div className={styles.heroCenter}>
            {entered ? (
              <HeroLetter />
            ) : (
              <Landing onEnter={() => setEntered(true)} />
            )}
          </div>
        </div>

        {/* ── Section 2: artifacts (rendered after entering, below the fold) ── */}
        {entered && <Artifacts />}
      </div>
    </>
  );
}
