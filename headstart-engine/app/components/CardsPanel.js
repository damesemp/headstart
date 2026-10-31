"use client";

import { useMemo, useState } from "react";
import ManufacturerLinks from "./ManufacturerLinks";

function hasValue(value) {
  return Array.isArray(value)
    ? value.length > 0
    : Boolean(String(value || "").trim());
}

// Round 8 (31 Oct 2026, Damian): "Selected Area" and "Astute Franchise" are
// redundant with the big title/name sitting right below them, and the card
// reads cramped with every section prefixed by a small label on top of its
// content. `heading` is now optional — pass "" (or omit it) to drop the
// label row entirely while keeping the title/content underneath. Sections
// that still want the label (e.g. "Relevant Astute Lines") are unaffected.
function Section({ heading, children, value, className = "", count = null }) {
  if (!hasValue(value)) return null;
  return (
    <section className={`hs-card-section${className ? ` ${className}` : ""}`}>
      {(heading || count !== null) && (
        <div className="hs-card-headingrow">
          {heading && <h3 className="hs-card-heading">{heading}</h3>}
          {count !== null && <span className="hs-card-count">{count}</span>}
        </div>
      )}
      {children || <div className="hs-card-copy">{value}</div>}
    </section>
  );
}

// Airtable joins these formula fields with a "<<>>" token. They were being
// printed raw. Round 5 renders them as tags, which is what the field is for.
// Round 7 (31 Oct 2026, Damian — rev05 colour/typography pass) stopped using
// this for Key Products/Industries (see PlainList/JoinedList below, matching
// the rev05 reference's ".products"/plain-Industries-line exactly) — kept
// here in case another part of the app still wants the chip treatment.
function Tags({ value }) {
  const items = String(value || "")
    .split("<<>>")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!items.length) return null;
  return (
    <ul className="hs-card-tags">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}

// Round 7 — Key Products: a plain vertical list, one product per line, no
// chip background (rev05 reference's ".products li"). Same "<<>>" split as
// Tags above.
function PlainList({ value }) {
  const items = String(value || "")
    .split("<<>>")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!items.length) return null;
  return (
    <ul className="hs-card-plainlist">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}

// Round 7 — Industries: a single comma-separated line (rev05 reference
// markup: <p>Automotive, Defence, Industrial, Medical, Rail</p>), not chips.
function JoinedList({ value }) {
  const items = String(value || "")
    .split("<<>>")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!items.length) return null;
  return <p className="hs-card-copy">{items.join(", ")}</p>;
}

// 1 Sep 2026 — every one of the 157 Core Advantages records follows this
// exact "Best Deployed When: ... Solves problems in: ..." convention
// (confirmed against the live base, not assumed). Bolding the two labels
// needs no Airtable change — it's a fixed phrasing, not per-record data.
function WhyThisFits({ value }) {
  const text = String(value || "");
  if (!text) return null;
  const parts = text.split(/(Best Deployed When:|Solves problems in:)/);
  return (
    <div className="hs-card-copy">
      {parts.map((part, index) =>
        part === "Best Deployed When:" || part === "Solves problems in:" ? (
          <strong key={index}>{part}</strong>
        ) : (
          part
        ),
      )}
    </div>
  );
}

function NumberedLines({ value }) {
  const lines = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return (
    <ol className="hs-card-numbered">
      {lines.map((line, index) => (
        <li key={`${index}-${line}`}>
          <span className="hs-card-number">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{line}</span>
        </li>
      ))}
    </ol>
  );
}

// Round 6 (31 Oct 2026, Damian — right-side panel rev05 redesign) — Next
// Steps is a disclosure, closed by default, named "Follow-Up Questions" on
// the summary. The "Questions To Ask Now" half of the old "Ask & Act" card
// is dropped per Damian's explicit instruction ("remove questions to ask
// from Follow-Up Questions box"); only the Next Actions data renders here
// now (relabelled "Next Steps" on the summary body, not the field itself —
// mappingRow.nextActions / selection.sharedNextActions is unchanged).
function FollowUpQuestions({ nextActions }) {
  if (!hasValue(nextActions)) return null;
  return (
    <details className="hs-card-disclosure">
      <summary className="hs-card-heading">
        Follow-Up Questions
      </summary>
      <div className="hs-card-disclosure-body">
        <h3 className="hs-card-heading" style={{ marginTop: 0 }}>
          Next Steps
        </h3>
        <NumberedLines value={nextActions} />
      </div>
    </details>
  );
}

// Round 6 — Documents section, replacing the old single "Line card" PDF
// download row in ManufacturerLinks. Airtable: Manufacturers.Documents
// (fldxR3dVZqGKlBzyU, multilineText) — one document per line, formatted
// "Label | https://permanent-url". Empty today on every record; falls back
// to the existing single PDF_URL field (populated with the placeholder
// https://www.astutegroup.com on all 157 records, 31 Oct 2026) so the
// section renders meaningfully before Damian uploads real PDFs and
// replaces the Documents field per manufacturer. Permanent URLs only
// (Vercel Blob), same rule as PDF_URL/Featured Link — never a raw Airtable
// attachment URL, which expires after a few hours (see LOGO field note in
// api/reference-data/route.js).
function parseDocuments(documentsRaw, fallbackLabel, fallbackUrl) {
  const lines = String(documentsRaw || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const docs = lines
    .map((line) => {
      if (line.includes("|")) {
        const [label, url] = line.split("|").map((part) => part.trim());
        return { label: label || `${fallbackLabel} overview`, url };
      }
      return { label: `${fallbackLabel} overview`, url: line };
    })
    .filter((doc) => hasValue(doc.url));
  if (docs.length) return docs;
  if (hasValue(fallbackUrl)) {
    return [{ label: `${fallbackLabel} overview`, url: fallbackUrl }];
  }
  return [];
}

function Documents({ manufacturer }) {
  const docs = parseDocuments(
    manufacturer.documentsRaw,
    manufacturer.name,
    manufacturer.pdfUrl,
  );
  if (!docs.length) return null;
  return (
    <details className="hs-card-disclosure">
      <summary className="hs-card-heading">More Information</summary>
      <div className="hs-card-disclosure-body hs-card-doclist">
        {docs.map((doc, index) => (
          <div className="hs-card-docbox" key={`${index}-${doc.url}`}>
            <div className="hs-card-docicon" aria-hidden="true">
              PDF
            </div>
            <div className="hs-card-doccopy">
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                {doc.label}
              </a>
              <div className="hs-card-docmeta">
                {doc.url === "https://www.astutegroup.com"
                  ? "PDF · placeholder — update in Airtable"
                  : "PDF"}
              </div>
            </div>
            <span className="hs-card-docarrow" aria-hidden="true">
              &#8599;
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function CardsPanel({
  selection,
  onResetSelection,
  hotspotCount = null,
}) {
  const [chipSelection, setChipSelection] = useState({
    selectionKey: null,
    manufacturerId: null,
  });

  const manufacturerEntries = useMemo(() => {
    if (!selection) return [];
    if (selection.kind === "manufacturer") {
      return [{ manufacturer: selection.manufacturer, row: null }];
    }
    if (selection.kind === "subcategory") {
      return selection.manufacturers.map((manufacturer) => ({
        manufacturer,
        row: null,
      }));
    }
    const seen = new Map();
    selection.rows.forEach((row) => {
      row.relevantAstuteLine.forEach((manufacturerId) => {
        const manufacturer = selection.manufacturerById[manufacturerId];
        if (manufacturer && !seen.has(manufacturerId))
          seen.set(manufacturerId, { manufacturer, row });
      });
    });
    return Array.from(seen.values());
  }, [selection]);

  const hotspotId = selection?.kind === "hotspot" ? selection.hotspot.id : null;
  const selectionKey =
    selection?.kind === "hotspot"
      ? `hotspot:${hotspotId}`
      : selection?.kind === "subcategory"
        ? `subcategory:${selection.category}:${selection.subcategory}`
        : selection?.kind === "manufacturer"
          ? `manufacturer:${selection.manufacturer.id}`
          : null;
  const validChipSelection =
    selectionKey &&
    chipSelection.selectionKey === selectionKey &&
    manufacturerEntries.some(
      (entry) => entry.manufacturer.id === chipSelection.manufacturerId,
    );
  const activeManufacturerId = validChipSelection
    ? chipSelection.manufacturerId
    : manufacturerEntries[0]?.manufacturer.id || null;
  const activeEntry =
    manufacturerEntries.find(
      (entry) => entry.manufacturer.id === activeManufacturerId,
    ) ||
    manufacturerEntries[0] ||
    null;
  const manufacturer = activeEntry?.manufacturer || null;
  const mappingRow = activeEntry?.row || null;
  // REMOVED (31 Oct 2026, Damian — rev05 redesign): the "Questions To Ask
  // Now" half of Ask & Act is dropped from the panel entirely. The
  // subcategoryQuestions synthesis and mappingRow.questions /
  // selection.sharedQuestions read are gone with it — Questions is left
  // untouched in Airtable/the data model, just not rendered.
  // REMOVED (5 Oct 2026, Damian): this used to synthesise a fixed "Select a
  // specific franchise..." Next Actions line for every subcategory
  // selection. Dropped outright rather than reworded — Next Actions still
  // renders normally from real data (mappingRow.nextActions /
  // selection.sharedNextActions) wherever that exists.
  const subcategoryNextActions = "";
  const nextActions =
    mappingRow?.nextActions ||
    subcategoryNextActions ||
    selection?.sharedNextActions ||
    "";
  // FIX (5 Oct 2026): for a subcategory selection, the subcategory name is
  // already shown as the card's own "Selected Area" heading above. Repeating
  // "category · subcategory" here just restated the same subcategory a
  // second time in smaller type. Show only the parent category on this
  // line; the direct-manufacturer path (no "Selected Area" heading above
  // it) keeps the full category · subcategory breadcrumb, since nothing
  // else on the card states the subcategory there.
  const categoryLine = manufacturer
    ? selection?.kind === "subcategory"
      ? selection.category
      : [manufacturer.linecardCategory, ...(manufacturer.subcategory || [])]
          .filter(Boolean)
          .join(" · ")
    : "";
  // 1 Sep 2026 — card shows the short description only. Long Description is
  // no longer pulled in; kept in Airtable/the data model, just not rendered.
  const details = manufacturer
    ? [manufacturer.shortDescription].filter(hasValue)
    : [];
  const whyThisManufacturerFits =
    mappingRow?.whyThisLineFits || manufacturer?.coreAdvantages || "";

  function resetSelection() {
    setChipSelection({ selectionKey: null, manufacturerId: null });
    onResetSelection();
  }

  return (
    <aside className="hs-hsmap-panel" aria-label="Selection details">
      <div className="hs-card-toolbar">
        {/* Round 8 (31 Oct 2026, Damian): "Details" label removed — the
            card's own content already says what it is. */}
        <button
          type="button"
          className="hs-card-reset"
          onClick={resetSelection}
          disabled={!selection}
        >
          RESET SELECTION
        </button>
      </div>

      {!selection ? (
        <div className="hs-hsmap-empty">
          <div className="hs-hsmap-empty-title">Nothing selected</div>
          <div className="hs-hsmap-empty-sub">
            {typeof hotspotCount === "number" && hotspotCount > 0
              ? `${hotspotCount} marked ${hotspotCount === 1 ? "area" : "areas"} on this view. Select one to see the Astute lines mapped to it.`
              : "Select a marked area on the image, or a manufacturer, to see the Astute lines mapped to it."}
          </div>
        </div>
      ) : (
        <div className="hs-card-content hs-card-grid">
          {(selection.kind === "hotspot" ||
            selection.kind === "subcategory") && (
            <Section
              heading=""
              value={
                selection.kind === "hotspot"
                  ? selection.hotspot.label
                  : selection.subcategory
              }
              className="hs-card-selected-area hs-card-span"
            >
              <div className="hs-card-title">
                {selection.kind === "hotspot"
                  ? selection.hotspot.label
                  : selection.subcategory}
              </div>
            </Section>
          )}

          {selection.kind === "hotspot" && manufacturerEntries.length === 0 && (
            // A hotspot with no Application Mapping rows yet. Normal for
            // anything just placed in the hotspot mapper — say so plainly
            // rather than rendering an empty card.
            <div className="hs-card-unmapped hs-card-span">
              No manufacturers are mapped to this area yet.
            </div>
          )}

          {manufacturerEntries.length > 0 && (
            <Section
              heading="Relevant Astute Lines"
              value={manufacturerEntries}
              count={manufacturerEntries.length}
              className="hs-card-span"
            >
              {/* 1 Sep 2026 — Embedded PC's subcategory selection used to
                  render this as a plain comma-separated line while every
                  hotspot map rendered clickable chips. Same section, same
                  data shape (a list of manufacturers to switch between) —
                  it must behave the same way everywhere. One chip list,
                  every selection kind — including a single entry: a
                  consistent, always-clickable list beats a layout that
                  changes shape depending on count (Damian, 5 Oct 2026). */}
              <div className="hs-card-chips">
                {manufacturerEntries.map((entry) => (
                  <button
                    key={entry.manufacturer.id}
                    type="button"
                    className={`hs-card-chip${entry.manufacturer.id === activeManufacturerId ? " hs-on" : ""}`}
                    onClick={() =>
                      setChipSelection({
                        selectionKey,
                        manufacturerId: entry.manufacturer.id,
                      })
                    }
                  >
                    {entry.manufacturer.name}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {manufacturer && (
            <>
              {/* Round 8 (31 Oct 2026, Damian): "Target" group label removed
                  — the manufacturer card right below it makes the grouping
                  obvious without it. */}

              {/* Round 6 (31 Oct 2026, Damian — rev05 redesign): single
                  continuous column, not the old col-left/col-right split.
                  `key={manufacturer.id}` remounts the disclosures below on
                  every manufacturer/selection change, so Key Products
                  always re-opens and Industries/Follow-Up
                  Questions/Documents always re-close — native <details> is
                  uncontrolled, so a fresh mount is what resets it. */}
              <div className="hs-card-col hs-card-span" key={manufacturer.id}>
                {/* Round 7 (31 Oct 2026, Damian — rev05 colour pass): the
                    whole manufacturer profile (name through the website
                    link) is now ONE continuous white card with thin
                    dividers between its parts, matching the rev05
                    reference's single ".profile" box — not a stack of
                    separate white tiles with grey gaps. See
                    .hs-card-profile / .hs-card-profile .hs-card-section in
                    globals.css. Sections/content inside are unchanged from
                    Round 6, styling only. */}
                <div className="hs-card-profile">
                  {/* FIX (5 Oct 2026, Damian): franchise name, headline and
                      short description used to be three separate
                      hs-card-section blocks, each with its own section
                      spacing — so a single franchise's own text read as
                      three stacked cards instead of one. Same
                      fonts/weights/markup as before (hs-card-title,
                      hs-card-category, hs-card-headline-row/-text,
                      hs-card-copy), just nested inside one section so it
                      reads as a single block: name, headline, description. */}
                  <Section
                    heading=""
                    value={manufacturer.name}
                    className="hs-card-franchise"
                  >
                    <div className="hs-card-title">{manufacturer.name}</div>
                    {categoryLine && (
                      <div className="hs-card-category">{categoryLine}</div>
                    )}
                    {hasValue(manufacturer.headline) && (
                      <div className="hs-card-headline-row">
                        {manufacturer.logoUrl && (
                          <div className="hs-card-headline-logo">
                            <img src={manufacturer.logoUrl} alt={`${manufacturer.name} logo`} />
                          </div>
                        )}
                        <div className="hs-card-headline-text">{manufacturer.headline}</div>
                      </div>
                    )}
                    {hasValue(details) && (
                      <div className="hs-card-copy">
                        {details.map((paragraph, index) => (
                          <p key={`${index}-${paragraph}`}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                  </Section>

                  {/* Round 6 (31 Oct 2026, Damian): "Why This Manufacturer
                      Fits" -> "Why This Manufacturer May Fit" — softer,
                      non-definitive phrasing. No data change, heading only.
                      Round 7: rendered as the cream callout box with the
                      orange left rule (rev05's ".fit"), via
                      hs-card-fitbox. */}
                  <Section
                    heading="Why This Manufacturer May Fit"
                    value={whyThisManufacturerFits}
                    className="hs-card-fitbox"
                  >
                    <WhyThisFits value={whyThisManufacturerFits} />
                  </Section>

                  {/* Round 6 — Key Products and Industries are native
                      <details> disclosures sharing one `name` group, so
                      opening either one closes the other (rev05 reference
                      behaviour). Key Products starts open; Industries
                      starts closed. Product Lifecycle is removed from the
                      card per Damian's instruction — left untouched in
                      Airtable/the data model (manufacturer.productLifecycle),
                      just not read here, same convention as Quality &
                      Certifications below. Round 7: Key Products renders as
                      a plain vertical list (PlainList), not chips. */}
                  {hasValue(manufacturer.keyProducts) && (
                    <details
                      className="hs-card-disclosure"
                      name={`mfg-${manufacturer.id}`}
                      open
                    >
                      <summary className="hs-card-heading">
                        Key Products
                      </summary>
                      <div className="hs-card-disclosure-body">
                        <PlainList value={manufacturer.keyProducts} />
                      </div>
                    </details>
                  )}

                  {/* Round 6 — Follow-Up Questions (was "Ask & Act"), moved
                      above Industries per Damian's instruction. Only Next
                      Steps (ex-Next Actions) renders; Questions To Ask Now
                      is dropped. */}
                  <FollowUpQuestions nextActions={nextActions} />

                  {/* Round 7: Industries renders as a single comma-separated
                      line (JoinedList), not chips, matching the rev05
                      reference markup exactly. */}
                  {hasValue(manufacturer.industries) && (
                    <details
                      className="hs-card-disclosure"
                      name={`mfg-${manufacturer.id}`}
                    >
                      <summary className="hs-card-heading">
                        Industries
                      </summary>
                      <div className="hs-card-disclosure-body">
                        <JoinedList value={manufacturer.industries} />
                      </div>
                    </details>
                  )}

                  {/* REMOVED (5 Oct 2026, Damian): Quality & Certifications
                      section dropped from the card entirely — not required
                      for the overview information. manufacturer.
                      qualityCertifications is left in the data model/Airtable,
                      just not read here. */}

                  {/* Round 6 — Documents, own disclosure, supports multiple
                      PDFs (see Documents component above). Replaces the old
                      single "Line card" download row in ManufacturerLinks. */}
                  <Documents manufacturer={manufacturer} />

                  <ManufacturerLinks manufacturer={manufacturer} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
