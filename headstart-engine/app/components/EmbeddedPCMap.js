"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_COLORS, PC_LAYOUT, PC_ATTACH } from "../lib/pcCategories";
import ZoomPanStage from "./ZoomPanStage";
import CardsPanel from "./CardsPanel";

// Embedded PC — the one standalone exception to the Industry/Segment/Type/
// System/Application Area schema (agreed 18 Aug 2026): no hotspots, no
// Application Area records, no device image. Synthesised at runtime from
// every manufacturer record grouped by Linecard Category/Subcategory.
//
// Clicking a manufacturer name populates the same shared cards panel a
// hotspot click does elsewhere — not a separate link-out — per the nav
// rearchitecture spec Section 8. Outbound website/PDF links render inside
// that card via the existing ManufacturerLinks component.
export default function EmbeddedPCMap({ data, selectedManufacturer, onSelectManufacturer, resetSignal }) {
  const [anchor, setAnchor] = useState(null);
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    setAnchor(null);
    setView({ scale: 1, tx: 0, ty: 0 });
  }, [resetSignal]);

  // Group every manufacturer by its real Linecard Category / Subcategory —
  // computed live, not a hardcoded subset. Keeps the full manufacturer
  // object (not just the name) so a click can populate the cards panel.
  const categories = useMemo(() => {
    const cats = {};
    (data.manufacturers || []).forEach((m) => {
      const cat = m.linecardCategory || "Uncategorised";
      const subs = m.subcategory && m.subcategory.length ? m.subcategory : ["Other"];
      if (!cats[cat]) cats[cat] = { count: 0, subs: {} };
      cats[cat].count++;
      subs.forEach((sub) => {
        if (!cats[cat].subs[sub]) cats[cat].subs[sub] = [];
        cats[cat].subs[sub].push(m);
      });
    });
    return cats;
  }, [data]);

  const companions = anchor ? PC_ATTACH[anchor] || [] : [];

  function resetView() {
    onSelectManufacturer(null);
    setAnchor(null);
  }

  function renderBox(name) {
    const c = categories[name];
    const colors = CATEGORY_COLORS[name] || {};
    const isAnchor = anchor === name;
    const isCompanion = companions.includes(name);
    const subNames = c ? Object.keys(c.subs).sort((a, b) => c.subs[b].length - c.subs[a].length) : [];
    const CHIP_LIMIT = 6;
    const shown = subNames.slice(0, CHIP_LIMIT);
    const remaining = subNames.length - shown.length;
    return (
      <div
        key={name}
        className={"hs-pc-box" + (isAnchor ? " hs-pc-anchor" : "") + (isCompanion ? " hs-pc-companion" : "")}
        style={{
          "--pc-accent": colors.accent || "#5F5E5A",
          "--pc-text": colors.text || "#2C2C2A",
          "--pc-bg": colors.bg || "#F1EFE8",
          "--pc-subbg": colors.subBg || "#E7E5DC",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(isAnchor ? null : name);
        }}
      >
        <div className="hs-pc-box-head">
          <h3>{name}</h3>
          <p>{c ? c.count : 0} franchises</p>
        </div>
        <div className="hs-pc-chips">
          {shown.map((sub) => (
            <span className="hs-pc-chip" key={sub}>
              {sub}
            </span>
          ))}
          {remaining > 0 && <span className="hs-pc-chip hs-pc-chip-more">+{remaining} more</span>}
        </div>
        {isAnchor && (
          <div className="hs-pc-full">
            {subNames.map((sub) => (
              <div className="hs-pc-subbox" key={sub}>
                <div className="hs-pc-subbox-title">{sub}</div>
                <div className="hs-pc-subbox-names">
                  {c.subs[sub].map((m, i) => (
                    <span key={m.id}>
                      <button
                        type="button"
                        className="hs-pc-mfrlink"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectManufacturer(m);
                        }}
                      >
                        {m.name}
                      </button>
                      {i < c.subs[sub].length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="hs-hsmap-layout">
      <div className="hs-hsmap-stage hs-pc-stage">
        <div className="hs-pc-note">
          Click a category to see every subcategory and the real manufacturers in it. Click a
          manufacturer's name to see its details. Companion categories highlight automatically.
        </div>
        <ZoomPanStage
          ref={frameRef}
          scale={view.scale}
          tx={view.tx}
          ty={view.ty}
          onChange={setView}
          onReset={resetView}
          min={0.4}
          className="hs-pc-zoomwrap"
        >
          <div className="hs-pc-wrap">
            <div className="hs-pc-band">{PC_LAYOUT.memoryBand.map(renderBox)}</div>
            <div className="hs-pc-mid">
              <div className="hs-pc-stack">{PC_LAYOUT.leftStack.map(renderBox)}</div>
              <div className="hs-pc-centre">
                <div className="hs-pc-row">{PC_LAYOUT.brain.map(renderBox)}</div>
                <div className="hs-pc-row">{PC_LAYOUT.centreBelow.map(renderBox)}</div>
                <div className="hs-pc-row">{PC_LAYOUT.centreRow2.map(renderBox)}</div>
              </div>
              <div className="hs-pc-stack">{PC_LAYOUT.rightStack.map(renderBox)}</div>
            </div>
          </div>
        </ZoomPanStage>
      </div>

      <CardsPanel
        selection={selectedManufacturer ? { kind: "manufacturer", manufacturer: selectedManufacturer } : null}
        onResetSelection={() => onSelectManufacturer(null)}
      />
    </div>
  );
}
