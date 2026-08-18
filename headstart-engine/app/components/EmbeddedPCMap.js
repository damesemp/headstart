"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORY_COLORS, PC_LAYOUT, PC_ATTACH } from "../lib/pcCategories";

// Step 4 — Embedded PC diagram. Architecturally separate from the hotspot
// map (HotspotMap.js) per HEADSTART_MASTER_HANDOVER.md Section 3 — no
// hotspots, no Segment record, no device image. The reference file
// synthesises this at runtime from all manufacturer records grouped by
// category/subcategory; this component does the same against live
// /api/reference-data, using the same fixed spatial layout and colour
// system as the offline file (app/lib/pcCategories.js).
//
// Scope decision, written down rather than silently simplified: the
// offline reference file renders this as a large pan/zoomable canvas with
// mouse-drag panning and zoom controls, because it was built for a fixed
// full-screen stage. On a responsive web page the categories fit as an
// ordinary CSS grid without needing pan/zoom — so that mechanic is not
// ported. Click-to-expand a category (showing every subcategory's real
// manufacturer list, and highlighting companion categories) is the actual
// functional value and IS ported.
export default function EmbeddedPCMap() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [anchor, setAnchor] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reference-data")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
        return json;
      })
      .then((json) => {
        if (!cancelled) setState({ status: "ready", data: json, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", data: null, error: String(err.message || err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Group every manufacturer by its real Linecard Category / Subcategory —
  // computed live, not a hardcoded subset.
  const categories = useMemo(() => {
    const cats = {};
    (state.data?.manufacturers || []).forEach((m) => {
      const cat = m.linecardCategory || "Uncategorised";
      const subs = m.subcategory && m.subcategory.length ? m.subcategory : ["Other"];
      if (!cats[cat]) cats[cat] = { count: 0, subs: {} };
      cats[cat].count++;
      subs.forEach((sub) => {
        if (!cats[cat].subs[sub]) cats[cat].subs[sub] = [];
        cats[cat].subs[sub].push(m.name);
      });
    });
    return cats;
  }, [state.data]);

  if (state.status === "loading") {
    return <div className="hs-state-msg">Loading Embedded PC categories…</div>;
  }
  if (state.status === "error") {
    return (
      <div className="hs-state-msg">
        Could not load live data from Airtable: {state.error}
      </div>
    );
  }

  const companions = anchor ? PC_ATTACH[anchor] || [] : [];

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
        onClick={() => setAnchor(isAnchor ? null : name)}
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
                <div className="hs-pc-subbox-names">{c.subs[sub].join(", ")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="hs-app-shell" style={{ display: "block", padding: "0" }}>
      <div className="hs-topbar">
        <div className="orange-bar" />
        <span className="headstart-word">Headstart</span>
        <nav className="hs-topbar-nav">
          <Link href="/" className="hs-topbar-navlink">
            Directory
          </Link>
          <Link href="/manufacturers" className="hs-topbar-navlink">
            Manufacturers
          </Link>
        </nav>
        <span className="app-tag">Embedded PC</span>
      </div>

      <div className="hs-pc-wrap">
        <div className="hs-pc-note">
          Click a category to see every subcategory and the real manufacturers in it. Companion
          categories highlight automatically.
        </div>

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

        <div className="hs-hsmap-backrow">
          <Link href="/" className="hs-dir-openmap">
            ‹ Back to Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
