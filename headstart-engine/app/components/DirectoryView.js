"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ManufacturerLinks from "./ManufacturerLinks";
import { viewForApplicationModel } from "../lib/segmentAppMap";

// Embedded PC has no Application Mapping rows or hotspots at all — it's
// synthesised at runtime from all manufacturers grouped by category
// instead, so it can't be discovered from dirData/videosByApp like every
// other application. Added to the Directory's app list explicitly here.
const EXTRA_DIRECTORY_APPS = ["Embedded PC"];

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

// The Directory itself — now rendered as the shell's default/home view
// rather than its own page. Content and behaviour are unchanged from Step
// 3; only the wrapper (rail, single-page state) moved up into EngineShell.
export default function DirectoryView({ data, onOpenMap }) {
  const [curApp, setCurApp] = useState("");
  const [curArea, setCurArea] = useState("");
  const [search, setSearch] = useState("");
  const [videoModal, setVideoModal] = useState(null);

  const manufacturerById = useMemo(() => {
    const map = {};
    (data.manufacturers || []).forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, [data]);

  const dirData = useMemo(() => buildDirData(data.applicationMapping || []), [data]);

  const videosByApp = useMemo(() => {
    const map = {};
    (data.videos || []).forEach((v) => {
      if (v.applicationModel) map[v.applicationModel] = v;
    });
    return map;
  }, [data]);

  const apps = useMemo(() => {
    const names = new Set([...Object.keys(dirData), ...Object.keys(videosByApp), ...EXTRA_DIRECTORY_APPS]);
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

  function openMapFor(app) {
    const view = viewForApplicationModel(app);
    if (view) onOpenMap(view);
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
          {apps.length === 0 && <div className="hs-dir-note">No applications are mapped yet.</div>}
          {apps.map((app) => {
            const groups = dirData[app] || {};
            const total = Object.values(groups).reduce((s, v) => s + v.length, 0);
            const hasVideo = !!videosByApp[app]?.fileUrl;
            const on = !searching && app === curApp;
            const view = viewForApplicationModel(app);
            return (
              <div key={app} className={"hs-dir-acard" + (on ? " hs-on" : "")} onClick={() => selectApp(app)}>
                <div className="hs-dir-acard-name">{app}</div>
                <div className="hs-dir-acard-ct">
                  {app === "Embedded PC"
                    ? "All Astute categories"
                    : total > 0
                    ? `${total} manufacturer${total === 1 ? "" : "s"}`
                    : hasVideo
                    ? "No hotspot map yet"
                    : "0 manufacturers"}
                </div>
                <div className="hs-dir-acard-actions">
                  {view && (total > 0 || app === "Embedded PC") && (
                    <button
                      type="button"
                      className="hs-dir-openmap"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMapFor(app);
                      }}
                    >
                      Open map ↗
                    </button>
                  )}
                  {total > 0 && !view && (
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
            <div className="hs-dir-note">No hotspot map is wired up for this application yet.</div>
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
              {searchResults.length === 0 && <div className="hs-dir-empty">No manufacturers found</div>}
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
              {areaRows.length === 0 && <div className="hs-dir-empty">No manufacturers found</div>}
              {areaRows.map((r) => {
                const m = manufacturerById[r.id];
                if (!m) return null;
                return (
                  <div className="hs-dir-mrow" key={r.id}>
                    <div>
                      <div className="hs-dir-mname">{m.name}</div>
                      {m.linecardCategory && <div className="hs-dir-msub">{m.linecardCategory}</div>}
                      <ManufacturerLinks manufacturer={m} />
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="hs-dir-empty">Select an application and area to see manufacturers</div>
          )}
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
              {videoModal?.description || "Plays straight through — no chapter list, no manufacturer panel."}
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
