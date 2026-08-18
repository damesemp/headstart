"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// Step 4 — hotspot map. First build target: Robotics & Automation (per
// Damian's instruction to demonstrate online functionality now rather than
// keep polishing the Manufacturers page). Reads live Hotspots + Application
// Mapping + Manufacturers data via /api/reference-data, same as Steps 3/3.1.
//
// Hotspot-to-application membership is resolved the same way DirectoryApp
// already does it: via Application Mapping's own Hotspot link, NOT via
// Hotspots."Application Model" (that field is a linked-record field to a
// separate Application Models table and can't be trusted for this — see
// app/lib/airtable.js FIELDS.HOTSPOTS.APPLICATION_MODEL comment).
//
// Device image(s) are interim embedded base64 data URIs (app/lib/deviceImages.js),
// extracted directly from the offline reference file. This is a known,
// flagged compromise — proper permanent storage (Vercel Blob) is still
// outstanding, see HEADSTART_MASTER_HANDOVER.md.
//
// Some applications have one physical device (Robotics & Automation — pass
// `imageSrc`); others have several device variants, each with its own image
// and its own hotspot set (Wearables: Smart Watch/Ring/Glasses; Military
// Drones - Air: Combat/Surveillance Drone — pass `variantImages`, an object
// keyed by the exact Device Variant string used in Airtable's Hotspots
// table). Variant membership is read live from each hotspot's own Device
// Variant field, not hardcoded here.
export default function HotspotMap({ applicationModel, imageSrc, variantImages, backLabel }) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

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

  const manufacturerById = useMemo(() => {
    const map = {};
    (state.data?.manufacturers || []).forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, [state.data]);

  // Hotspots table rows, keyed by their human hotspotId string (e.g.
  // "base-housing"), which is what Application Mapping rows carry.
  const hotspotByHotspotId = useMemo(() => {
    const map = {};
    (state.data?.hotspots || []).forEach((h) => {
      if (h.hotspotId) map[h.hotspotId] = h;
    });
    return map;
  }, [state.data]);

  const mappingRows = useMemo(
    () => (state.data?.applicationMapping || []).filter((r) => r.applicationModel === applicationModel),
    [state.data, applicationModel]
  );

  // The set of hotspots that actually belong to this application, derived
  // from the mapping rows rather than guessed at.
  const hotspotsForApp = useMemo(() => {
    const seen = new Map();
    mappingRows.forEach((r) => {
      if (!r.hotspotId || seen.has(r.hotspotId)) return;
      const h = hotspotByHotspotId[r.hotspotId];
      if (h) seen.set(r.hotspotId, h);
    });
    return Array.from(seen.values());
  }, [mappingRows, hotspotByHotspotId]);

  // Distinct device variants present, in first-seen order — empty for
  // single-device applications like Robotics & Automation.
  const variants = useMemo(() => {
    const seen = [];
    hotspotsForApp.forEach((h) => {
      if (h.deviceVariant && !seen.includes(h.deviceVariant)) seen.push(h.deviceVariant);
    });
    return seen;
  }, [hotspotsForApp]);

  const activeVariant = variants.length ? selectedVariant || variants[0] : null;

  function chooseVariant(v) {
    setSelectedVariant(v);
    setSelectedHotspotId(null);
  }

  const visibleHotspots = useMemo(() => {
    if (!activeVariant) return hotspotsForApp;
    return hotspotsForApp.filter((h) => h.deviceVariant === activeVariant);
  }, [hotspotsForApp, activeVariant]);

  const activeImageSrc = activeVariant ? variantImages?.[activeVariant] : imageSrc;

  const rowsForSelected = useMemo(
    () => (selectedHotspotId ? mappingRows.filter((r) => r.hotspotId === selectedHotspotId) : []),
    [mappingRows, selectedHotspotId]
  );

  const selectedHotspot = selectedHotspotId ? hotspotByHotspotId[selectedHotspotId] : null;

  // Best Fit first, then Also Relevant / Related Opportunity — matches the
  // Fit Type single-select's intended priority ordering.
  const FIT_ORDER = { "Best Fit": 0, "Also Relevant": 1, "Related Opportunity": 2 };
  const sortedRowsForSelected = useMemo(() => {
    return [...rowsForSelected].sort((a, b) => {
      const oa = FIT_ORDER[a.fitType] ?? 9;
      const ob = FIT_ORDER[b.fitType] ?? 9;
      return oa - ob;
    });
  }, [rowsForSelected]);

  // Questions/Next Actions are set once per hotspot (duplicated across every
  // manufacturer row for that hotspot in the data) — take them from the
  // first row rather than repeating per manufacturer card.
  const sharedQuestions = sortedRowsForSelected[0]?.questions || "";
  const sharedNextActions = sortedRowsForSelected[0]?.nextActions || "";

  if (state.status === "loading") {
    return <div className="hs-state-msg">Loading hotspot map…</div>;
  }
  if (state.status === "error") {
    return (
      <div className="hs-state-msg">
        Could not load live data from Airtable: {state.error}
      </div>
    );
  }

  // Zoom into the selected hotspot by scaling the image around its x/y
  // percentage as the CSS transform-origin. Smart Zoom % from Airtable
  // drives the scale factor.
  const zoomStyle = selectedHotspot
    ? {
        transform: `scale(${(selectedHotspot.smartZoom || 100) / 100})`,
        transformOrigin: `${selectedHotspot.x}% ${selectedHotspot.y}%`,
      }
    : { transform: "scale(1)", transformOrigin: "50% 50%" };

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
        <span className="app-tag">{applicationModel}</span>
      </div>

      <div className="hs-hsmap-layout">
        <div className="hs-hsmap-stage">
          {variants.length > 1 && (
            <div className="hs-hsmap-varrow">
              {variants.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={"hs-hsmap-vartab" + (v === activeVariant ? " hs-on" : "")}
                  onClick={() => chooseVariant(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          <div className="hs-hsmap-imgwrap">
            <img
              src={activeImageSrc}
              alt={activeVariant ? `${applicationModel} — ${activeVariant}` : applicationModel}
              className="hs-hsmap-img"
              style={zoomStyle}
            />
            {visibleHotspots.map((h) => (
              <button
                key={h.hotspotId}
                type="button"
                className={"hs-hsmap-dot" + (h.hotspotId === selectedHotspotId ? " hs-on" : "")}
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                title={h.label}
                onClick={() => setSelectedHotspotId(h.hotspotId)}
              >
                <span className="hs-hsmap-dotlabel">{h.label}</span>
              </button>
            ))}
          </div>
          <div className="hs-hsmap-backrow">
            <Link href="/" className="hs-dir-openmap">
              ‹ Back to {backLabel || "Directory"}
            </Link>
          </div>
        </div>

        <div className="hs-hsmap-panel">
          {!selectedHotspot && (
            <div className="hs-hsmap-empty">
              <div className="hs-hsmap-empty-title">NOTHING SELECTED</div>
              <div className="hs-hsmap-empty-sub">
                Click a hotspot on the diagram to see the manufacturers, fit and
                talking points for that area.
              </div>
            </div>
          )}

          {selectedHotspot && (
            <>
              <div className="hs-dir-rhead">
                <div className="hs-dir-rtitle">{selectedHotspot.label}</div>
                <div className="hs-dir-rsub">
                  {sortedRowsForSelected.length} Astute line
                  {sortedRowsForSelected.length === 1 ? "" : "s"} featured
                </div>
              </div>

              <div className="hs-hsmap-col-title">Target</div>
              {sortedRowsForSelected.map((row) => {
                const m = manufacturerById[row.relevantAstuteLine[0]];
                if (!m) return null;
                return (
                  <div className="hs-hsmap-mfrcard" key={row.id}>
                    <div className="hs-hsmap-mfrhead">
                      <span className="hs-dir-mname">{m.name}</span>
                      {row.fitType && (
                        <span className={"hs-hsmap-badge hs-badge-" + row.fitType.replace(/\s+/g, "-").toLowerCase()}>
                          {row.fitType}
                        </span>
                      )}
                    </div>
                    {(row.whyThisLineFits || m.coreAdvantages) && (
                      <div className="hs-hsmap-mfrtext">
                        {row.whyThisLineFits || m.coreAdvantages}
                      </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
