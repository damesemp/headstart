"use client";

// Round 5 — not buttons. Three buttons were three competing shapes for what is
// a list of three destinations. A stacked, hairline-separated list instead,
// with a glyph on the left saying what will happen: arrow out for a new tab,
// arrow down for a download. See HEADSTART_BUILD_INSTRUCTIONS_5.md 7.4.
//
// Round 6 (31 Oct 2026, Damian — rev05 redesign): the single PDF "Line card"
// download row is removed from this list. It duplicated the new Documents
// disclosure in CardsPanel.js, which now reads the same pdfUrl (plus any
// additional entries in Manufacturers.Documents) and can show more than one
// document. manufacturer.pdfUrl is read there, not here, to avoid rendering
// the same link twice.
export default function ManufacturerLinks({ manufacturer }) {
  const links = [];

  if (manufacturer.website) {
    links.push({
      href: manufacturer.website,
      text: String(manufacturer.website)
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, ""),
      meta: "Website",
      kind: "out",
    });
  }
  if (manufacturer.featuredLinkUrl) {
    links.push({
      href: manufacturer.featuredLinkUrl,
      text: manufacturer.featuredLinkLabel || "Featured link",
      meta: "Astute",
      kind: "out",
    });
  }

  if (!links.length) return null;

  return (
    <section className="hs-card-section">
      <h3 className="hs-card-heading">Links</h3>
      <div className="hs-linklist">
        {links.map((link) => (
          <a
            key={link.meta + link.href}
            className="hs-linkrow"
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            {...(link.kind === "down" ? { download: "" } : {})}
          >
            <span className="hs-linkrow-glyph" aria-hidden="true">
              {link.kind === "down" ? "↓" : "↗"}
            </span>
            <span className="hs-linkrow-text">{link.text}</span>
            <span className="hs-linkrow-meta">{link.meta}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
