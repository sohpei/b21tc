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

function useIsNarrowScreen() {
  const [isNarrowScreen, setIsNarrowScreen] = React.useState(() => window.innerWidth < 768);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const handleChange = () => {
      setIsNarrowScreen(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isNarrowScreen;
}

export function App() {
  const [media] = React.useState<MediaItem[]>(artworks);
  const [textureProgress, setTextureProgress] = React.useState(0);
  const [entered, setEntered] = React.useState(false);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const isNarrowScreen = useIsNarrowScreen();

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
      {isNarrowScreen && (
        <div className={styles.narrowScreenOverlay} role="alert" aria-live="polite">
          <p className={styles.narrowScreenText}>Please open this site on desktop, not mobile.</p>
        </div>
      )}

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
