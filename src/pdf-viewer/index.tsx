import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import styles from "./style.module.css";

// Use the bundled worker so there's no CDN dependency
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export function PdfViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(600);

  // Match render width to container width for responsive pages
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={styles.viewer}>
      {loading && !error && <p className={styles.status}>Loading…</p>}
      {error && <p className={styles.status}>Could not load PDF.</p>}

      <Document
        file={url}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          setLoading(false);
        }}
        onLoadError={() => {
          setError(true);
          setLoading(false);
        }}
        loading={null}
      >
        {numPages != null &&
          Array.from({ length: numPages }, (_, i) => (
            <div key={i} className={styles.page}>
              <Page
                pageNumber={i + 1}
                width={width || 600}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </div>
          ))}
      </Document>
    </div>
  );
}
