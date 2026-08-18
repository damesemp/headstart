"use client";

// Outbound links for one manufacturer's card — website (always in Airtable),
// featured link (optional), PDF (optional, permanent Vercel Blob URL).
// Built into the Directory results here per HEADSTART_MASTER_HANDOVER.md
// Step 3 ("also build the manufacturer card's outbound links here") and
// reused on /manufacturers for the full manufacturer directory.
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
    <div className="hs-dir-mlinks">
      {links.map((l) => (
        <a
          key={l.label + l.href}
          className="hs-dir-mlink"
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
