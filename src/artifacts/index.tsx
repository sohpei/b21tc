import * as React from "react";
import { type CapsuleItem, CAPSULE_ITEMS } from "~/src/capsule-data";
import { PdfViewer } from "~/src/pdf-viewer";
import styles from "./style.module.css";

function ArtifactCard({ item, onClick }: { item: CapsuleItem; onClick: () => void }) {
  return (
    <button className={styles.card} onClick={onClick} type="button">
      <div className={styles.iconWrap}>
        {item.icon ? (
          <img src={item.icon} alt={item.title} className={styles.icon} />
        ) : (
          <div className={styles.iconPlaceholder} />
        )}
      </div>
      <span className={styles.cardTitle}>{item.title}</span>
    </button>
  );
}

function ArtifactDetail({ item, onBack }: { item: CapsuleItem; onBack: () => void }) {
  return (
    <div className={styles.detail}>
      <button className={styles.backButton} onClick={onBack} type="button">
        ← back
      </button>
      <h2 className={styles.detailTitle}>{item.title}</h2>

      {/* HTML content (text, images, lists, etc.) — shown as a caption above the PDF */}
      {item.content && (
        <div
          className={styles.detailContent}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: user-authored content
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      )}

      {/* Headless PDF — rendered page-by-page with no viewer chrome */}
      {item.pdfUrl && <PdfViewer url={item.pdfUrl} />}
    </div>
  );
}

export function Artifacts() {
  const [active, setActive] = React.useState<CapsuleItem | null>(null);

  return (
    <section className={styles.section}>
      {/* Gradient fade between hero and this section */}
      <div className={styles.topFade} aria-hidden />

      <div className={styles.body}>
        {active ? (
          <ArtifactDetail item={active} onBack={() => setActive(null)} />
        ) : (
          <>
            <header className={styles.header}>
              {/* ── Edit the heading and description below ── */}
              <h2 className={styles.heading}>Time Capsule</h2>
              <p className={styles.description}>
                A collection of artifacts, letters, and memories from Building
                21. Click any artifact to read more.
              </p>
            </header>

            <div className={styles.grid}>
              {CAPSULE_ITEMS.map((item) => (
                <ArtifactCard key={item.id} item={item} onClick={() => setActive(item)} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
