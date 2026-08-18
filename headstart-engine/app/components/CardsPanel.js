"use client";

import ManufacturerLinks from "./ManufacturerLinks";

// Shared right-hand cards panel — used by every application map. Per the
// nav rearchitecture spec Section 8: always visible, fixed size, blank
// "nothing selected" placeholder by default. A hotspot click populates it
// (selection.kind === "hotspot"); on Embedded PC, clicking a manufacturer
// name populates it exactly the same way (selection.kind === "manufacturer")
// instead of linking out to a separate page.
export default function CardsPanel({ selection }) {
  if (!selection) {
    return (
      <div className="hs-hsmap-panel">
        <div className="hs-hsmap-empty">
          <div className="hs-hsmap-empty-title">NOTHING SELECTED</div>
          <div className="hs-hsmap-empty-sub">
            Click a hotspot on the diagram to see the manufacturers, fit and talking points for
            that area.
          </div>
        </div>
      </div>
    );
  }

  if (selection.kind === "manufacturer") {
    const m = selection.manufacturer;
    return (
      <div className="hs-hsmap-panel">
        <div className="hs-dir-rhead">
          <div className="hs-dir-rtitle">{m.name}</div>
          {m.linecardCategory && <div className="hs-dir-rsub">{m.linecardCategory}</div>}
        </div>
        {m.subcategory?.length > 0 && (
          <div className="hs-pc-chips" style={{ marginBottom: 12 }}>
            {m.subcategory.map((s) => (
              <span className="hs-pc-chip" key={s}>
                {s}
              </span>
            ))}
          </div>
        )}
        {(m.shortDescription || m.coreAdvantages) && (
          <div className="hs-hsmap-mfrtext">{m.shortDescription || m.coreAdvantages}</div>
        )}
        {m.longDescription && <div className="hs-hsmap-mfrtext">{m.longDescription}</div>}
        <ManufacturerLinks manufacturer={m} />
      </div>
    );
  }

  // selection.kind === "hotspot"
  const { hotspot, rows, manufacturerById, sharedQuestions, sharedNextActions } = selection;
  return (
    <div className="hs-hsmap-panel">
      <div className="hs-dir-rhead">
        <div className="hs-dir-rtitle">{hotspot.label}</div>
        <div className="hs-dir-rsub">
          {rows.length} Astute line{rows.length === 1 ? "" : "s"} featured
        </div>
      </div>

      <div className="hs-hsmap-col-title">Target</div>
      {rows.map((row) => {
        const m = manufacturerById[row.relevantAstuteLine[0]];
        if (!m) return null;
        return (
          <div className="hs-hsmap-mfrcard" key={row.id}>
            <div className="hs-hsmap-mfrhead">
              <span className="hs-dir-mname">{m.name}</span>
              {row.fitType && (
                <span
                  className={"hs-hsmap-badge hs-badge-" + row.fitType.replace(/\s+/g, "-").toLowerCase()}
                >
                  {row.fitType}
                </span>
              )}
            </div>
            {(row.whyThisLineFits || m.coreAdvantages) && (
              <div className="hs-hsmap-mfrtext">{row.whyThisLineFits || m.coreAdvantages}</div>
            )}
          </div>
        );
      })}

      <div className="hs-hsmap-col-title">Ask &amp; Act</div>
      <div className="hs-hsmap-askact">
        {sharedQuestions && (
          <>
            <div className="hs-hsmap-asklbl">Questions to ask now</div>
            <div className="hs-hsmap-asktext">
              {sharedQuestions.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </>
        )}
        {sharedNextActions && (
          <>
            <div className="hs-hsmap-asklbl">Next actions</div>
            <div className="hs-hsmap-asktext">
              {sharedNextActions.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
