"use client";

import { useEffect, useMemo, useState } from "react";
import ManufacturerLinks from "./ManufacturerLinks";

// Manufacturer directory — plain feature list item (HEADSTART_MASTER_HANDOVER.md
// Section 7): "Manufacturer directory, searchable, linked to the applications
// they appear in. Each manufacturer's card shows its website, an optional
// featured link... and an optional downloadable PDF." Reads live Airtable
// data via the same /api/reference-data route the Directory uses.
export default function ManufacturerDirectory() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [search, setSearch] = useState("");

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

  const appsByManufacturer = useMemo(() => {
    const map = {};
    (state.data?.applicationMapping || []).forEach((row) => {
      row.relevantAstuteLine.forEach((mfrId) => {
        if (!map[mfrId]) map[mfrId] = new Set();
        if (row.applicationModel) map[mfrId].add(row.applicationModel);
      });
    });
    return map;
  }, [state.data]);

  const manufacturers = useMemo(() => {
    const list = state.data?.manufacturers || [];
    const q = search.trim().toLowerCase();
    const filtered = q ? list.filter((m) => m.name.toLowerCase().includes(q)) : list;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [state.data, search]);

  if (state.status === "loading") {
    return <div className="hs-state-msg">Loading manufacturers…</div>;
  }
  if (state.status === "error") {
    return (
      <div className="hs-state-msg">
        Could not load live data from Airtable: {state.error}
      </div>
    );
  }

  return (
    <div className="hs-app-shell" style={{ display: "block", padding: "0" }}>
      <div className="hs-topbar">
        <div className="orange-bar" />
        <span className="headstart-word">Headstart</span>
        <span className="app-tag">Manufacturers</span>
      </div>
      <div className="hs-dir-searchrow">
        <div className="hs-dir-search">
          <input
            placeholder="Search manufacturer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div style={{ padding: "18px 24px", maxWidth: 780 }}>
        {manufacturers.length === 0 && (
          <div className="hs-dir-empty">No manufacturers found</div>
        )}
        {manufacturers.map((m) => {
          const apps = Array.from(appsByManufacturer[m.id] || []);
          return (
            <div className="hs-dir-mrow" key={m.id} style={{ alignItems: "flex-start" }}>
              <div>
                <div className="hs-dir-mname">{m.name}</div>
                {m.linecardCategory && (
                  <div className="hs-dir-msub">{m.linecardCategory}</div>
                )}
                {apps.length > 0 && (
                  <div className="hs-dir-msub">Appears in: {apps.join(", ")}</div>
                )}
                <ManufacturerLinks manufacturer={m} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
