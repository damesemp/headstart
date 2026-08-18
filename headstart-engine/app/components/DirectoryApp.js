"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ManufacturerLinks from "./ManufacturerLinks";

// Step 3 — Shell and Directory, reading live Airtable data via
// /api/reference-data. Ported from headstart_video_nav_preview.html's
// #hsRail / #hsDirectoryOverlay / #hsVideoMockOverlay, with two deliberate
// differences from that reference, both written down here rather than
// guessed at silently:
//
// 1. No hotspot stage/background exists yet (that's Step 4), so the
//    Directory is rendered as the page itself rather than as an overlay
//    over an empty map. "Open map" shows an honest "not built yet" note
//    instead of linking to a page that doesn't exist.
// 2. The reference mockup's four-vertical Industry filter (Defence /
//    Industrial / Medical / Computing) was hardcoded (CAT_MAP) and has no
//    live Airtable source of truth — AI_HANDOVER_ASTUTE_HEADSTART_v8.md
//    Section 6 already flags reconciling this against the Segments table
//    as unresolved housekeeping. Rather than re-hardcode a guess, this
//    build skips the Industry column for now: Applications, Areas, Results.
//
// Step 4 — "Open map" now links to a real hotspot map page for
// applications that have one built. Only Robotics & Automation exists so
// far (first build target, 18 August 2026); the rest fall back to the
// existing in-page drill-down until their maps are built.
const HOTSPOT_MAP_ROUTES = {
  "Robotics & Automation": "/applications/robotics-automation",
};

function buildDirData(mapping) {
  const dir = {};
  mapping.forEach((row) => {
    const app = row.applicationModel || "Unspecified";
    const area = row.hotspotLabel || "General";
    if (!dir[app]) dir[app] = {};
    if (!dir[app][area]) dir[app][area] = [];
    row.relevantAstuteLine.forEach((mfrId) => {
      const already = dir[app][area].some((x) => x.id === mfrId);
      if (!already) dir[app][area].push({ id: mfrId });
    });
  });
  return dir;
}

export default function DirectoryApp() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [curApp, setCurApp] = useState("");
  const [curArea, setCurArea] = useState("");
  const [search, setSearch] = useState("");
  const [videoModal, setVideoModal] = useState(null);

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

  const dirData = useMemo(() => {
    if (!state.data) return {};
    return buildDirData(state.data.applicationMapping || []);
  }, [state.data]);

  const videosByApp = useMemo(() => {
    const map = {};
    (state.data?.videos || []).forEach((v) => {
      if (v.applicationModel) map[v.applicationModel] = v;
    });
    return map;
  }, [state.data]);

  const apps = useMemo(() => {
    const names = new Set([...Object.keys(dirData), ...Object.keys(videosByApp)]);
    return Array.from(names).sort();
  }, [dirData, videosByApp]);

  function resetDirectory() {
    setCurApp("");
    setCurArea("");
    setSearch("");
    setVideoModal(null);
  }

  function selectApp(app) {
    setCurApp(app);
    setCurArea("");
    setSearch("");
  }

  function openVideo(app) {
    const v = videosByApp[app];
    if (!v) return;
    setVideoModal({ title: v.title || app, description: v.description || "" });
  }

  if (state.status === "loading") {
    return <div className="hs-state-msg">Loading Headstart…</div>;
  }
  if (state.status === "error") {
    return (
      <div className="hs-state-msg">
        Could not load live data from Airtable: {state.error}
      </div>
    );
  }

  const searching = search.trim().length > 0;
  const searchResults = [];
  if (searching) {
    const q = search.trim().toLowerCase();
    apps.forEach((app) => {
      Object.entries(dirData[app] || {}).forEach(([area, rows]) => {
        rows.forEach((r) => {
          const m = manufacturerById[r.id];
          if (!m) return;
          if (m.name.toLowerCase().includes(q)) {
            searchResults.push({ app, area, m });
          }
        });
      });
    });
  }

  const areaEntries = curApp ? Object.entries(dirData[curApp] || {}) : [];
  const areaRows = curArea ? dirData[curApp]?.[curArea] || [] : [];

  return (
    <div className="hs-app-shell">
      <aside className="hs-rail">
        <div className="hs-rail-logo" aria-hidden="true">
          A
        </div>
        <button
          type="button"
          className={"hs-rail-btn" + (!curApp && !searching ? " hs-rail-active" : "")}
          title="Directory"
          aria-label="Directory"
          onClick={() => setCurApp("")}
        >
          ▤
        </button>
        <button
          type="button"
          className="hs-rail-btn"
          title="Reset selection"
          aria-label="Reset selection"
          onClick={resetDirectory}
        >
          ↺
        </button>
      </aside>

      <div className="hs-main">
        <div className="hs-topbar">
          <div className="orange-bar" />
          <span className="headstart-word">Headstart</span>
          <nav className="hs-topbar-nav">
            <span className="hs-topbar-navlink hs-on">Directory</span>
            <Link href="/manufacturers" className="hs-topbar-navlink">
              Manufacturers
            </Link>
          </nav>
          <span className="app-tag">{curApp || "Directory"}</span>
        </div>

        <div className="hs-dir-searchrow">
          <div className="hs-dir-search">
            <input
              placeholder="Search manufacturer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className="hs-dir-reset-btn" onClick={resetDirectory}>
            RESET
          </button>
        </div>

        <div className="hs-dir">
          <div className="hs-dir-col">
            <span className="hs-dir-sec-lbl">Applications</span>
            {apps.length === 0 && (
              <div className="hs-dir-note">No applications are mapped yet.</div>
            )}
            {apps.map((app) => {
              const groups = dirData[app] || {};
              const total = Object.values(groups).reduce((s, v) => s + v.length, 0);
              const hasVideo = !!videosByApp[app]?.fileUrl;
              const on = !searching && app === curApp;
              return (
                <div
                  key={app}
                  className={"hs-dir-acard" + (on ? " hs-on" : "")}
                  onClick={() => selectApp(app)}
                >
                  <div className="hs-dir-acard-name">{app}</div>
                  <div className="hs-dir-acard-ct">
                    {total > 0
                      ? `${total} manufacturer${total === 1 ? "" : "s"}`
                      : hasVideo
                      ? "No hotspot map yet"
                      : "0 manufacturers"}
                  </div>
                  <div className="hs-dir-acard-actions">
                    {total > 0 && HOTSPOT_MAP_ROUTES[app] && (
                      <Link
                        href={HOTSPOT_MAP_ROUTES[app]}
                        className="hs-dir-openmap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open map ↗
                      </Link>
                    )}
                    {total > 0 && !HOTSPOT_MAP_ROUTES[app] && (
                      <button
                        type="button"
                        className="hs-dir-openmap"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectApp(app);
                        }}
                      >
                        Open map ↗
                      </button>
                    )}
                    {hasVideo && (
                      <button
                        type="button"
                        className="hs-dir-watchintro"
                        onClick={(e) => {
                          e.stopPropagation();
                          openVideo(app);
                        }}
                      >
                        ▶ Watch introduction
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hs-dir-col">
            <span className="hs-dir-sec-lbl">Area / Type</span>
            {!curApp && <div className="hs-dir-note">Select an application.</div>}
            {curApp &&
              areaEntries.map(([area, rows]) => (
                <div
                  key={area}
                  className={"hs-dir-arow" + (area === curArea ? " hs-on" : "")}
                  onClick={() => setCurArea(area)}
                >
                  <span>{area}</span>
                  <div className="hs-dir-arow-ct">{rows.length} manufacturers</div>
                </div>
              ))}
            {curApp && areaEntries.length === 0 && (
              <div className="hs-dir-note">
                No hotspot map is wired up for this application yet.
              </div>
            )}
          </div>

          <div className="hs-dir-col">
            {searching ? (
              <>
                <div className="hs-dir-rhead">
                  <div className="hs-dir-rtitle">Results for &ldquo;{search}&rdquo;</div>
                  <div className="hs-dir-rsub">
                    {searchResults.length} match{searchResults.length === 1 ? "" : "es"}
                  </div>
                </div>
                {searchResults.length === 0 && (
                  <div className="hs-dir-empty">No manufacturers found</div>
                )}
                {searchResults.map(({ app, area, m }) => (
                  <div className="hs-dir-mrow" key={app + area + m.id}>
                    <div>
                      <div className="hs-dir-mname">{m.name}</div>
                      <div className="hs-dir-msub">
                        {app} · {area}
                      </div>
                      <ManufacturerLinks manufacturer={m} />
                    </div>
                  </div>
                ))}
              </>
            ) : curArea ? (
              <>
                <div className="hs-dir-rhead">
                  <div className="hs-dir-rtitle">{curArea}</div>
                  <div className="hs-dir-rsub">{areaRows.length} Astute lines featured</div>
                </div>
                {areaRows.length === 0 && (
                  <div className="hs-dir-empty">No manufacturers found</div>
                )}
                {areaRows.map((r) => {
                  const m = manufacturerById[r.id];
                  if (!m) return null;
                  return (
                    <div className="hs-dir-mrow" key={r.id}>
                      <div>
                        <div className="hs-dir-mname">{m.name}</div>
                        {m.linecardCategory && (
                          <div className="hs-dir-msub">{m.linecardCategory}</div>
                        )}
                        <ManufacturerLinks manufacturer={m} />
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="hs-dir-empty">
                Select an application and area to see manufacturers
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={"hs-vm-overlay" + (videoModal ? " hs-open" : "")}>
        <div className="hs-vm-card">
          <div className="hs-vm-frame">
            <div className="hs-vm-play">▶</div>
          </div>
          <div className="hs-vm-body">
            <div className="hs-vm-eyebrow">Introduction video</div>
            <div className="hs-vm-title">{videoModal?.title || ""}</div>
            <div className="hs-vm-sub">
              {videoModal?.description ||
                "Plays straight through — no chapter list, no manufacturer panel."}
            </div>
            <button type="button" className="hs-vm-back" onClick={() => setVideoModal(null)}>
              ‹ Back to Directory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
