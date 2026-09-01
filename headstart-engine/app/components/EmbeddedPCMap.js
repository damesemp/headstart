"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const frameRef = useRef(null);
  // Holds a { category, subcategory } target set the moment a manufacturer
  // is selected from outside this component (search, the flyout's
  // manufacturer list). The layout effect below reads it once the anchor
  // category's subboxes have actually painted, then clears it.
  const pendingCenterRef = useRef(null);

  useEffect(() => {
    setAnchor(null);
    setSelectedSubcategory(null);
    setView({ scale: 1, tx: 0, ty: 0 });
    pendingCenterRef.current = null;
  }, [resetSignal]);

  // Centre the view on a given box/subbox element, the same "smart zoom"
  // math selectSubcategory has always used for a click. Factored out so the
  // search/flyout path (below) can drive the same zoom a manual click does.
  function centerOn(element) {
    const frame = frameRef.current;
    if (!frame || !element) return;
    const target = element.closest(".hs-pc-subbox") || element;
    let x = target.offsetWidth / 2;
    let y = target.offsetHeight / 2;
    let node = target;
    while (node && node !== frame) {
      x += node.offsetLeft || 0;
      y += node.offsetTop || 0;
      node = node.offsetParent;
    }
    if (node !== frame) return;
    const scale = 1.55;
    setView({
      scale,
      tx: -(x - frame.offsetWidth / 2) * scale,
      ty: -(y - frame.offsetHeight / 2) * scale,
    });
  }

  // Search and the flyout's manufacturer list both select a manufacturer by
  // setting the same `selectedManufacturer` prop — previously that only
  // populated the cards panel; the map itself never moved, so the result
  // was correct data with no visible link back to where it lives on the
  // diagram (Damian, 1 Sep 2026). Expand that manufacturer's category and
  // queue a centre-on-it zoom exactly like clicking its subcategory would.
  useEffect(() => {
    if (!selectedManufacturer) return;
    const cat = selectedManufacturer.linecardCategory || "Uncategorised";
    const subs =
      selectedManufacturer.subcategory && selectedManufacturer.subcategory.length
        ? selectedManufacturer.subcategory
        : ["Other"];
    const sub = subs[0];
    setSelectedSubcategory(null);
    pendingCenterRef.current = { category: cat, subcategory: sub };
    setAnchor(cat);
  }, [selectedManufacturer]);

  // Runs after the anchor's expanded subboxes have committed to the DOM
  // (useLayoutEffect, not useEffect, so the browser paints already
  // centred rather than flashing the old view first).
  useLayoutEffect(() => {
    const pending = pendingCenterRef.current;
    if (!pending || pending.category !== anchor) return;
    pendingCenterRef.current = null;
    const frame = frameRef.current;
    if (!frame) return;
    const el = frame.querySelector(
      `[data-pc-cat="${CSS.escape(pending.category)}"][data-pc-sub="${CSS.escape(pending.subcategory)}"]`
    );
    if (el) centerOn(el);
  }, [anchor]);

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
    Object.values(cats).forEach((category) => {
      Object.values(category.subs).forEach((manufacturers) => {
        manufacturers.sort(
          (a, b) => (a.tier ?? Number.MAX_SAFE_INTEGER) - (b.tier ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name)
        );
      });
    });
    return cats;
  }, [data]);

  const companions = anchor ? PC_ATTACH[anchor] || [] : [];

  function resetView() {
    onSelectManufacturer(null);
    setAnchor(null);
    setSelectedSubcategory(null);
  }

  function selectSubcategory(categoryName, subcategoryName, manufacturers, element) {
    onSelectManufacturer(null);
    setSelectedSubcategory({ category: categoryName, subcategory: subcategoryName, manufacturers });
    centerOn(element);
  }

  function clearSelection() {
    onSelectManufacturer(null);
    setSelectedSubcategory(null);
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
          clearSelection();
          setAnchor(isAnchor ? null : name);
        }}
      >
        <div className="hs-pc-box-head">
          <h3>{name}</h3>
          <p>{c ? c.count : 0} franchises</p>
        </div>
        <div className="hs-pc-chips">
          {shown.map((sub) => (
            <button
              type="button"
              className={
                "hs-pc-chip" +
                (selectedSubcategory?.category === name && selectedSubcategory?.subcategory === sub ? " hs-on" : "")
              }
              key={sub}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                selectSubcategory(name, sub, c.subs[sub], event.currentTarget);
              }}
            >
              {sub}
            </button>
          ))}
          {remaining > 0 && <span className="hs-pc-chip hs-pc-chip-more">+{remaining} more</span>}
        </div>
        {isAnchor && (
          <div className="hs-pc-full">
            {subNames.map((sub) => (
              <div
                className={
                  "hs-pc-subbox" +
                  (selectedSubcategory?.category === name && selectedSubcategory?.subcategory === sub ? " hs-on" : "")
                }
                key={sub}
                data-pc-cat={name}
                data-pc-sub={sub}
              >
                <button
                  type="button"
                  className="hs-pc-subbox-title"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectSubcategory(name, sub, c.subs[sub], event.currentTarget);
                  }}
                >
                  {sub}
                </button>
                <div className="hs-pc-subbox-names">
                  {c.subs[sub].map((m, i) => (
                    <span key={m.id}>
                      <button
                        type="button"
                        className="hs-pc-mfrlink"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubcategory(null);
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
                {/* 1 Sep 2026 — block-diagram feel restored around the
                    processing pair, kept flat/square/monochrome to match
                    the rest of the D1 redesign rather than the old
                    prototype's colourful rounded version. */}
                <div className="hs-pc-core-wrap">
                  <div className="hs-pc-core-label">Applications Processing</div>
                  <div className="hs-pc-row hs-pc-core-row">{PC_LAYOUT.brain.map(renderBox)}</div>
                </div>
                <div className="hs-pc-row">{PC_LAYOUT.centreBelow.map(renderBox)}</div>
                <div className="hs-pc-row">{PC_LAYOUT.centreRow2.map(renderBox)}</div>
              </div>
              <div className="hs-pc-stack">{PC_LAYOUT.rightStack.map(renderBox)}</div>
            </div>
          </div>
        </ZoomPanStage>
      </div>

      <CardsPanel
        selection={
          selectedSubcategory
            ? { kind: "subcategory", ...selectedSubcategory }
            : selectedManufacturer
            ? { kind: "manufacturer", manufacturer: selectedManufacturer }
            : null
        }
        onResetSelection={clearSelection}
      />
    </div>
  );
}
