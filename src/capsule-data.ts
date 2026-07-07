// ─────────────────────────────────────────────────────────────────────────────
// Time capsule items — add new entries by appending to CAPSULE_ITEMS.
//
// Fields:
//   id       – unique slug, no spaces
//   title    – shown on the card and at the top of the detail view
//   date     – ISO date string
//   excerpt  – one-sentence preview shown on the card
//   icon     – (optional) URL to an image shown on the artifact card
//   content  – (optional) raw HTML rendered in the detail view
//   pdfUrl   – (optional) path to a PDF served from public/; renders headless
//   audioUrl – (optional) path to an audio file (future use)
//
// At least one of `content`, `pdfUrl`, or `audioUrl` should be provided.
// HTML tip: any valid HTML works inside `content` — <p>, <strong>, <ul>,
//           <img src="…">, <blockquote>, etc.
// ─────────────────────────────────────────────────────────────────────────────

export type CapsuleItem = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  icon?: string;
  content?: string;
  pdfUrl?: string;
  audioUrl?: string;
};

export const CAPSULE_ITEMS: CapsuleItem[] = [
  // ── PDF example ────────────────────────────────────────────────────────────
  {
    id: "rashalama-space-design",
    title: "Rasha Lama - Space Design Proposal",
    date: "2026-05-29",
    excerpt: "Rasha Lama's design proposal for the Building 21 space.",
    content:"<p>Hello!</p><p>This was such a special time in my life. I had a crazy idea centred on a secret bathroom library and a cloud room within the B21 haven, and somehow Anita, Jhave, and Ollivier got on board with it.</p><p>While the whole vision never got completed because of COVID and my naïveté getting in the way, some elements of it live on in the space.</p><p>Personally, this was the first project I ever worked on that had to do with design and creativity in a spatial and fun way, and it led me to where I am now as a landscape designer and researcher!</p><p>Thank you B21, Anita, Jhave, Ollivier, and the extended community that shall continue with all these treasured memories.</p><p>x Rasha</p>",
    icon: "capsuleitems/icon_rashalama.png",
    pdfUrl: "capsuleitems/rashalama_spacedesign.pdf",
  },

  {
    id: "tycary-ethnography",
    title: "Ty Cary - Ethnography of Building 21",
    date: "2026-05-29",
    excerpt: "Ty Cary's ethnography of Building 21.",
    content:"Ty Cary's ethnography of Building 21.",
    icon: "capsuleitems/icon_tycary.png",
    pdfUrl: "capsuleitems/tycary_ethnography.pdf",
  },

  {
    id: "christiandenis-reflections",
    title: "Christian Denis - Reflections",
    date: "2026-05-29",
    excerpt: "Christian Denis's reflections on Building 21.",
    content:"Christian Denis's reflections on Building 21.",
    icon: "capsuleitems/icon_christian.png",
    pdfUrl: "capsuleitems/christiandenis_reflections.pdf",
  },

  {
    id: "barryyu-journal",
    title: "Barry Yu - Journal Entries",
    date: "2026-05-29",
    excerpt: "Barry Yu's journal entries about Building 21.",
    content:"Journal Entries: transcript of personal journal excerpts from November 2025 to April 2026 mentioning/relating to Building 21. ",
    // icon: "capsuleitems/icon_barry.png",
    pdfUrl: "capsuleitems/barryyu_journal.pdf",
  },

];
