"use client";

import { useMemo, useState } from "react";
import ManufacturerLinks from "./ManufacturerLinks";

function hasValue(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim());
}

function Section({ heading, children, value, className = "" }) {
  if (!hasValue(value)) return null;
  return (
    <section className={`hs-card-section${className ? ` ${className}` : ""}`}>
      <h3 className="hs-card-heading">{heading}</h3>
      {children || <div className="hs-card-copy">{value}</div>}
    </section>
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
          <span className="hs-card-number">{String(index + 1).padStart(2, "0")}</span>
          <span>{line}</span>
        </li>
      ))}
    </ol>
  );
}

export default function CardsPanel({ selection, onResetSelection }) {
  const [chipSelection, setChipSelection] = useState({ selectionKey: null, manufacturerId: null });

  const manufacturerEntries = useMemo(() => {
    if (!selection) return [];
    if (selection.kind === "manufacturer") {
      return [{ manufacturer: selection.manufacturer, row: null }];
    }
    if (selection.kind === "subcategory") {
      return selection.manufacturers.map((manufacturer) => ({ manufacturer, row: null }));
    }
    const seen = new Map();
    selection.rows.forEach((row) => {
      row.relevantAstuteLine.forEach((manufacturerId) => {
        const manufacturer = selection.manufacturerById[manufacturerId];
        if (manufacturer && !seen.has(manufacturerId)) seen.set(manufacturerId, { manufacturer, row });
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
    manufacturerEntries.some((entry) => entry.manufacturer.id === chipSelection.manufacturerId);
  const activeManufacturerId = validChipSelection
    ? chipSelection.manufacturerId
    : manufacturerEntries[0]?.manufacturer.id || null;
  const activeEntry =
    manufacturerEntries.find((entry) => entry.manufacturer.id === activeManufacturerId) || manufacturerEntries[0] || null;
  const manufacturer = activeEntry?.manufacturer || null;
  const mappingRow = activeEntry?.row || null;
  // Embedded PC has no subcategory records/fields in Airtable. These are the
  // documented template-only exception until a Subcategories table exists.
  const subcategoryQuestions = selection?.kind === "subcategory"
    ? `Which manufacturer within ${selection.subcategory} is being considered?\nIs this requirement driven by performance, availability, lifecycle or cost?`
    : "";
  const subcategoryNextActions = selection?.kind === "subcategory"
    ? "Select a specific franchise below to show its positioning and product data."
    : "";
  const questions = mappingRow?.questions || subcategoryQuestions || selection?.sharedQuestions || "";
  const nextActions = mappingRow?.nextActions || subcategoryNextActions || selection?.sharedNextActions || "";
  const categoryLine = manufacturer
    ? selection?.kind === "subcategory"
      ? [selection.category, selection.subcategory].join(" · ")
      : [manufacturer.linecardCategory, ...(manufacturer.subcategory || [])].filter(Boolean).join(" · ")
    : "";
  const details = manufacturer
    ? [manufacturer.shortDescription, manufacturer.longDescription].filter(hasValue)
    : [];
  const whyThisManufacturerFits = mappingRow?.whyThisLineFits || manufacturer?.coreAdvantages || "";

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
          <div className="hs-hsmap-empty-title">NOTHING SELECTED</div>
          <div className="hs-hsmap-empty-sub">
            Click a hotspot or manufacturer to see its live Airtable details.
          </div>
        </div>
      ) : (
        <div className="hs-card-content">
          {(selection.kind === "hotspot" || selection.kind === "subcategory") && (
            <Section
              heading="Selected Area"
              value={selection.kind === "hotspot" ? selection.hotspot.label : selection.subcategory}
              className="hs-card-selected-area"
            >
              <div className="hs-card-title">
                {selection.kind === "hotspot" ? selection.hotspot.label : selection.subcategory}
              </div>
            </Section>
          )}

          {selection.kind === "hotspot" && manufacturerEntries.length === 0 && (
            // A hotspot with no Application Mapping rows yet. Normal for
            // anything just placed in the hotspot mapper — say so plainly
            // rather than rendering an empty card.
            <div className="hs-card-unmapped">
              No manufacturers are mapped to this area yet.
            </div>
          )}

          {manufacturerEntries.length > 0 && (
            <Section heading="Relevant Astute Lines" value={manufacturerEntries}>
              {selection.kind === "subcategory" ? (
                <div className="hs-card-copy">
                  {manufacturerEntries.map((entry) => entry.manufacturer.name).join(", ")}
                </div>
              ) : (
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
              )}
            </Section>
          )}

          {manufacturer && (
            <>
              <div className="hs-card-group-label">Target</div>

              {selection.kind === "subcategory" && (
                <Section
                  heading={selection.subcategory}
                  value={`${manufacturerEntries.length} franchises found under ${selection.category}.`}
                />
              )}

              <Section heading="Astute Franchise" value={manufacturer.name}>
                <div className="hs-card-title">{manufacturer.name}</div>
                {categoryLine && <div className="hs-card-category">{categoryLine}</div>}
                {selection.kind === "subcategory" && (
                  <div className="hs-card-chips hs-card-franchise-chips">
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
                )}
              </Section>

              {selection.kind === "subcategory" ? (
                <>
                  <Section heading="Manufacturer Details" value={details}>
                    <div className="hs-card-copy">
                      {details.map((paragraph, index) => (
                        <p key={`${index}-${paragraph}`}>{paragraph}</p>
                      ))}
                    </div>
                  </Section>
                  <Section heading="Manufacturer Headline" value={manufacturer.headline} />
                </>
              ) : (
                <>
                  <Section heading="Manufacturer Headline" value={manufacturer.headline} />
                  <Section heading="Manufacturer Details" value={details}>
                    <div className="hs-card-copy">
                      {details.map((paragraph, index) => (
                        <p key={`${index}-${paragraph}`}>{paragraph}</p>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              <Section heading="Why This Manufacturer Fits" value={whyThisManufacturerFits} />
              <Section heading="Key Products" value={manufacturer.keyProducts} />
              <Section heading="Applications" value={manufacturer.applications} />
              <Section heading="Quality & Certifications" value={manufacturer.qualityCertifications} />

              {(hasValue(questions) || hasValue(nextActions)) && (
                <div className="hs-card-group-label">Ask &amp; Act</div>
              )}
              <Section heading="Questions To Ask Now" value={questions}>
                <NumberedLines value={questions} />
              </Section>
              <Section heading="Next Actions" value={nextActions}>
                <NumberedLines value={nextActions} />
              </Section>

              <ManufacturerLinks manufacturer={manufacturer} />
            </>
          )}
        </div>
      )}
    </aside>
  );
}
