"use client";

import { useMemo, useState } from "react";
import ManufacturerLinks from "./ManufacturerLinks";

function hasValue(value) {
  return Array.isArray(value)
    ? value.length > 0
    : Boolean(String(value || "").trim());
}

function Section({ heading, children, value, className = "", count = null }) {
  if (!hasValue(value)) return null;
  return (
    <section className={`hs-card-section${className ? ` ${className}` : ""}`}>
      <div className="hs-card-headingrow">
        <h3 className="hs-card-heading">{heading}</h3>
        {count !== null && <span className="hs-card-count">{count}</span>}
      </div>
      {children || <div className="hs-card-copy">{value}</div>}
    </section>
  );
}

// Airtable joins these formula fields with a "<<>>" token. They were being
// printed raw. Round 5 renders them as tags, which is what the field is for.
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
  // Embedded PC has no subcategory records/fields in Airtable. These are the
  // documented template-only exception until a Subcategories table exists.
  const subcategoryQuestions =
    selection?.kind === "subcategory"
      ? `Which manufacturer within ${selection.subcategory} is being considered?\nIs this requirement driven by performance, availability, lifecycle or cost?`
      : "";
  // REMOVED (5 Oct 2026, Damian): this used to synthesise a fixed "Select a
  // specific franchise..." Next Actions line for every subcategory
  // selection. Dropped outright rather than reworded — Next Actions still
  // renders normally from real data (mappingRow.nextActions /
  // selection.sharedNextActions) wherever that exists.
  const subcategoryNextActions = "";
  const questions =
    mappingRow?.questions ||
    subcategoryQuestions ||
    selection?.sharedQuestions ||
    "";
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
        <span className="hs-card-toolbar-label">Details</span>
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
              heading="Selected Area"
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
              <div className="hs-card-group-label hs-card-span">Target</div>

              <div className="hs-card-col hs-card-col-left">
                {/* FIX (5 Oct 2026, Damian): franchise name, headline and
                    short description used to be three separate
                    hs-card-section blocks, each with its own section
                    spacing — so a single franchise's own text read as three
                    stacked cards instead of one. Same fonts/weights/markup
                    as before (hs-card-title, hs-card-category,
                    hs-card-headline-row/-text, hs-card-copy), just nested
                    inside one section so it reads as a single block: name,
                    headline, description. */}
                <Section
                  heading="Astute Franchise"
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

                <Section
                  heading="Why This Manufacturer Fits"
                  value={whyThisManufacturerFits}
                >
                  <WhyThisFits value={whyThisManufacturerFits} />
                </Section>
                <ManufacturerLinks manufacturer={manufacturer} />
              </div>

              <div className="hs-card-col hs-card-col-right">
                <Section
                  heading="Key Products"
                  value={manufacturer.keyProducts}
                >
                  <Tags value={manufacturer.keyProducts} />
                </Section>
                {/* 1 Sep 2026 — Industries added back for internal sales:
                    seeing a manufacturer's other industries is a cross-sell
                    signal ("attach one franchise to another"). Product
                    Lifecycle added for the same audience — Astute's own
                    lifecycle/obsolescence pitch, in the manufacturer's own
                    words. Applications was considered and deliberately left
                    out: it reads as a second, competing sense of
                    "application" against the engine's own Application
                    Mapping / Application Areas. */}
                <Section
                  heading="Industries"
                  value={manufacturer.industries}
                >
                  <Tags value={manufacturer.industries} />
                </Section>
                <Section
                  heading="Product Lifecycle"
                  value={manufacturer.productLifecycle}
                >
                  <Tags value={manufacturer.productLifecycle} />
                </Section>
                {/* REMOVED (5 Oct 2026, Damian): Quality & Certifications
                    section dropped from the card entirely — not required
                    for the overview information. manufacturer.
                    qualityCertifications is left in the data model/Airtable,
                    just not read here. */}
                {(hasValue(questions) || hasValue(nextActions)) && (
                  <div className="hs-card-group-label">Ask &amp; Act</div>
                )}
                <Section heading="Questions To Ask Now" value={questions}>
                  <NumberedLines value={questions} />
                </Section>
                <Section heading="Next Actions" value={nextActions}>
                  <NumberedLines value={nextActions} />
                </Section>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
