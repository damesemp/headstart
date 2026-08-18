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
  const [chipSelection, setChipSelection] = useState({ hotspotId: null, manufacturerId: null });

  const manufacturerEntries = useMemo(() => {
    if (!selection) return [];
    if (selection.kind === "manufacturer") {
      return [{ manufacturer: selection.manufacturer, row: null }];
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
  const validChipSelection =
    hotspotId &&
    chipSelection.hotspotId === hotspotId &&
    manufacturerEntries.some((entry) => entry.manufacturer.id === chipSelection.manufacturerId);
  const activeManufacturerId = validChipSelection
    ? chipSelection.manufacturerId
    : manufacturerEntries[0]?.manufacturer.id || null;
  const activeEntry =
    manufacturerEntries.find((entry) => entry.manufacturer.id === activeManufacturerId) || manufacturerEntries[0] || null;
  const manufacturer = activeEntry?.manufacturer || null;
  const mappingRow = activeEntry?.row || null;
  const questions = mappingRow?.questions || selection?.sharedQuestions || "";
  const nextActions = mappingRow?.nextActions || selection?.sharedNextActions || "";
  const categoryLine = manufacturer
    ? [manufacturer.linecardCategory, ...(manufacturer.subcategory || [])].filter(Boolean).join(" · ")
    : "";
  const details = manufacturer
    ? [manufacturer.shortDescription, manufacturer.longDescription].filter(hasValue)
    : [];
  const whyThisManufacturerFits = mappingRow?.whyThisLineFits || manufacturer?.coreAdvantages || "";

  function resetSelection() {
    setChipSelection({ hotspotId: null, manufacturerId: null });
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
          {selection.kind === "hotspot" && (
            <Section heading="Selected Area" value={selection.hotspot.label} className="hs-card-selected-area">
              <div className="hs-card-title">{selection.hotspot.label}</div>
            </Section>
          )}

          {manufacturerEntries.length > 0 && (
            <Section heading="Relevant Astute Lines" value={manufacturerEntries}>
              <div className="hs-card-chips">
                {manufacturerEntries.map((entry) => (
                  <button
                    key={entry.manufacturer.id}
                    type="button"
                    className={`hs-card-chip${entry.manufacturer.id === activeManufacturerId ? " hs-on" : ""}`}
                    onClick={() =>
                      setChipSelection({
                        hotspotId,
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
              <div className="hs-card-group-label">Target</div>

              <Section heading="Astute Franchise" value={manufacturer.name}>
                <div className="hs-card-title">{manufacturer.name}</div>
                {categoryLine && <div className="hs-card-category">{categoryLine}</div>}
              </Section>

              <Section heading="Manufacturer Headline" value={manufacturer.headline} />

              <Section heading="Manufacturer Details" value={details}>
                <div className="hs-card-copy">
                  {details.map((paragraph, index) => (
                    <p key={`${index}-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
              </Section>

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
