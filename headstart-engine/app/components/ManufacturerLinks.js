"use client";

// Outbound links for one manufacturer's card — website (always in Airtable),
// featured link (optional), PDF (optional, permanent Vercel Blob URL).
// Shared by the live Airtable-driven cards panel for hotspot and Embedded
// PC manufacturer selections.
export default function ManufacturerLinks({ manufacturer }) {
  const links = [];
  if (manufacturer.website) {
    links.push({ href: manufacturer.website, label: "Website" });
  }
  if (manufacturer.featuredLinkUrl) {
    links.push({
      href: manufacturer.featuredLinkUrl,
      label: manufacturer.featuredLinkLabel || "Featured link",
    });
  }
  if (manufacturer.pdfUrl) {
    links.push({ href: manufacturer.pdfUrl, label: "PDF" });
  }

  if (!links.length) return null;

  return (
    <div className="hs-card-links">
      {links.map((l) => (
        <a
          key={l.label + l.href}
          className="hs-card-link"
          href={l.href}
          target="_blank"
          rel="noreferrer noopener"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
