"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

// Hotspot mapper.
//
// Pick a Type, give it an application image, then click the image to place
// hotspots. Everything placed starts as Draft; the Engine renders only Live,
// so nothing reaches the public site until it is published here.
//
// COORDINATES — the thing to get right. X and Y are percentages OF THE IMAGE,
// not of any container. The Engine reads them that way and the existing
// hotspots are stored that way. So every measurement is taken from the <img>
// element's own bounding rect, which already accounts for letterboxing and
// for any CSS transform. Measuring the wrapper instead would be wrong by the
// letterbox offset — the mirror image of a bug already fixed in the Engine.
//
// LAYOUT — the editor sits ABOVE the image, and the image is capped to a
// scrollable box. A tall application image otherwise pushes every control off
// the bottom of the screen, so you cannot see what you are editing while you
// edit it.

const ACCENT = "#3EC2CF";
const ACCENT_DARK = "#0d838d";
const ORANGE = "#F58220";
const INK = "#212120";

const LABEL_SIDES = ["left", "centre", "right"];
const IMAGE_MAX_HEIGHT = 460;

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: 16 },
  row: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", gap: 6, flex: "1 1 200px", minWidth: 150 },
  label: { fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: "#77746c" },
  input: {
    border: "1px solid #d8d5cd", borderRadius: 8, padding: "9px 11px",
    fontSize: 14, color: INK, background: "#fff", fontFamily: "inherit", width: "100%",
  },
  btn: {
    border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit", background: ACCENT_DARK, color: "#fff",
  },
  btnGhost: {
    border: "1px solid #d8d5cd", borderRadius: 8, padding: "9px 14px", fontSize: 13,
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: INK,
  },
  btnWarn: {
    border: "1px solid #e0b4b0", borderRadius: 8, padding: "9px 14px", fontSize: 13,
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#a1372c",
  },
  // The stage sizes itself to the image so that a percentage of the stage is
  // always a percentage of the image. In "fit" the whole image is visible at
  // once, which is what you want while deciding where a hotspot goes; in
  // "actual" the image runs at full width inside a scrolling box, which is
  // what you want while placing one precisely. Coordinates are identical in
  // both because they are measured from the <img> rect, not from either box.
  stageOuter: {
    position: "relative", background: "#fff", border: "1px solid #e4e2dc",
    borderRadius: 12, maxHeight: IMAGE_MAX_HEIGHT, overflow: "auto",
    display: "flex", justifyContent: "center",
  },
  stage: { position: "relative", lineHeight: 0 },
  imgFit: { display: "block", maxHeight: IMAGE_MAX_HEIGHT, maxWidth: "100%", width: "auto", height: "auto", userSelect: "none" },
  imgActual: { display: "block", width: "100%", height: "auto", userSelect: "none" },
  dot: {
    position: "absolute", width: 16, height: 16, borderRadius: "50%",
    transform: "translate(-50%, -50%)", cursor: "grab", border: "2px solid #fff",
    boxShadow: "0 1px 4px rgba(0,0,0,.45)", padding: 0, zIndex: 2,
  },
  dotLabel: {
    position: "absolute", transform: "translate(-50%, -160%)", whiteSpace: "nowrap",
    background: "rgba(20,20,20,.86)", color: "#fff", fontSize: 11, fontWeight: 700,
    padding: "3px 7px", borderRadius: 5, pointerEvents: "none", zIndex: 1, lineHeight: 1.3,
  },
  hint: { fontSize: 13, color: "#77746c", lineHeight: 1.5 },
  panel: {
    border: "1px solid #e4e2dc", borderRadius: 12, padding: 16,
    background: "#faf9f7", display: "flex", flexDirection: "column", gap: 12,
  },
  banner: {
    borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 8,
  },
  listRow: {
    display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
    borderRadius: 8, border: "1px solid #e4e2dc", background: "#fff",
  },
  pill: {
    fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase",
    borderRadius: 999, padding: "3px 9px", flex: "0 0 auto",
  },
};

function statusPill(status) {
  if (status === "Live") return { ...s.pill, background: "#e3f3e6", color: "#22683a" };
  if (status === "Archived") return { ...s.pill, background: "#ece9e4", color: "#6f6d67" };
  if (status === "Draft") return { ...s.pill, background: "#fdf0dd", color: "#8a5312" };
  return { ...s.pill, background: "#f7e2e0", color: "#a1372c" };
}

function bannerStyle(kind) {
  if (kind === "error") return { ...s.banner, background: "#fae7e5", color: "#8d2f25", border: "1px solid #e9c4bf" };
  if (kind === "ok") return { ...s.banner, background: "#e3f3e6", color: "#1f5c34", border: "1px solid #c2e0ca" };
  if (kind === "busy") return { ...s.banner, background: "#eef1f3", color: "#43535c", border: "1px solid #d6dde1" };
  return { ...s.banner, background: "#fdf0dd", color: "#7a4a10", border: "1px solid #edd6ae" };
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function HotspotsTab() {
  const [types, setTypes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [typeId, setTypeId] = useState("");
  const [type, setType] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draftEdit, setDraftEdit] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState(null); // { kind, text }
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [zoomed, setZoomed] = useState(false); // false = whole image visible

  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const newLabelRef = useRef(null);

  const say = (kind, text) => setMsg({ kind, text });

  useEffect(() => {
    say("busy", "Loading types…");
    fetch("/api/types", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setTypes(d.types || []);
        setAreas(d.applicationAreas || []);
        say("info", "Select a type to begin.");
      })
      .catch((e) => say("error", `Couldn't load types: ${e.message}`));
  }, []);

  const loadHotspots = useCallback((id, quiet) => {
    if (!id) return;
    if (!quiet) say("busy", "Loading hotspots…");
    return fetch(`/api/hotspots?typeId=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setType(d.type || null);
        setHotspots(d.hotspots || []);
        setSelectedId(null);
        setDraftEdit(null);
        setDirty(false);
        if (!quiet) {
          const live = (d.hotspots || []).filter((h) => h.status === "Live").length;
          const draft = (d.hotspots || []).filter((h) => h.status === "Draft").length;
          say("info", `${d.type?.name || "Type"} loaded — ${live} live, ${draft} draft.`);
        }
      })
      .catch((e) => say("error", `Couldn't load hotspots: ${e.message}`));
  }, []);

  useEffect(() => {
    if (typeId) loadHotspots(typeId);
    else {
      setType(null);
      setHotspots([]);
    }
  }, [typeId, loadHotspots]);

  useEffect(() => {
    if (pendingPoint && newLabelRef.current) newLabelRef.current.focus();
  }, [pendingPoint]);

  const areasForSegment = useMemo(
    () => (type ? areas.filter((a) => a.segment === type.segment) : []),
    [areas, type]
  );

  const selected = hotspots.find((h) => h.id === selectedId) || null;
  // Only hotspots that are both un-archived AND actually placed can be drawn.
  // A record with no coordinates would otherwise render at "null%", which CSS
  // discards, stacking every unplaced dot in the top-left corner. Unplaced
  // records still appear in the list below, flagged "not placed".
  const visible = hotspots.filter(
    (h) => h.status !== "Archived" && typeof h.x === "number" && typeof h.y === "number"
  );
  const liveCount = hotspots.filter((h) => h.status === "Live").length;
  const draftCount = hotspots.filter((h) => h.status === "Draft").length;

  // Percentage of the IMAGE, from the image's own rect.
  function pointFromEvent(e) {
    const el = imgRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.min(100, Math.max(0, Math.round(x * 10) / 10)),
      y: Math.min(100, Math.max(0, Math.round(y * 10) / 10)),
    };
  }

  function handleStageClick(e) {
    if (!placing || !type) return;
    const pt = pointFromEvent(e);
    if (!pt) return;
    setPendingPoint(pt);
    setNewLabel("");
    setPlacing(false);
    say("info", `Position ${pt.x}% , ${pt.y}% — now give it a label.`);
  }

  async function confirmNewHotspot() {
    const label = newLabel.trim();
    if (!label) {
      say("error", "A label is required before the hotspot can be created.");
      newLabelRef.current?.focus();
      return;
    }
    setBusy(true);
    say("busy", `Creating "${label}"…`);
    try {
      const res = await fetch("/api/hotspots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeId,
          label,
          hotspotId: slugify(`${type.name}-${label}`),
          x: pendingPoint.x,
          y: pendingPoint.y,
          smartZoom: 150,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Create failed");
      setHotspots((prev) => [...prev, d.hotspot]);
      setSelectedId(d.hotspot.id);
      setDraftEdit(d.hotspot);
      setDirty(false);
      setPendingPoint(null);
      setNewLabel("");
      say("ok", `"${d.hotspot.label}" created as Draft. It is not on the live site yet.`);
    } catch (err) {
      say("error", err.message);
    } finally {
      setBusy(false);
    }
  }

  function cancelNewHotspot() {
    setPendingPoint(null);
    setNewLabel("");
    say("info", "Cancelled — nothing was created.");
  }

  function startDrag(e, hotspot) {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { id: hotspot.id, moved: false };
    setSelectedId(hotspot.id);
    setDraftEdit(hotspot);
    setDirty(false);
  }

  useEffect(() => {
    function move(e) {
      const d = dragRef.current;
      if (!d) return;
      const pt = pointFromEvent(e);
      if (!pt) return;
      d.moved = true;
      d.last = pt;
      setHotspots((prev) => prev.map((h) => (h.id === d.id ? { ...h, ...pt } : h)));
    }
    async function up() {
      const d = dragRef.current;
      dragRef.current = null;
      if (!d || !d.moved || !d.last) return;
      say("busy", "Saving new position…");
      try {
        const res = await fetch("/api/hotspots", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: d.id, x: d.last.x, y: d.last.y }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Move failed");
        setHotspots((prev) => prev.map((h) => (h.id === j.hotspot.id ? j.hotspot : h)));
        setDraftEdit((prev) => (prev && prev.id === j.hotspot.id ? j.hotspot : prev));
        say("ok", `Moved to ${d.last.x}% , ${d.last.y}%.`);
      } catch (err) {
        say("error", `${err.message} — reloading from Airtable.`);
        loadHotspots(typeId, true);
      }
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [typeId, loadHotspots]);

  function edit(patch) {
    setDraftEdit((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }

  async function saveEdit() {
    if (!draftEdit) return;
    if (!String(draftEdit.label || "").trim()) {
      say("error", "A label is required.");
      return;
    }
    setBusy(true);
    say("busy", "Saving…");
    try {
      const res = await fetch("/api/hotspots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftEdit.id,
          label: draftEdit.label,
          smartZoom: draftEdit.smartZoom,
          labelX: draftEdit.labelX,
          labelY: draftEdit.labelY,
          labelSide: draftEdit.labelSide,
          applicationAreaIds: draftEdit.applicationAreaIds,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      setHotspots((prev) => prev.map((h) => (h.id === d.hotspot.id ? d.hotspot : h)));
      setDraftEdit(d.hotspot);
      setDirty(false);
      say("ok", `"${d.hotspot.label}" saved.`);
    } catch (err) {
      say("error", err.message);
    } finally {
      setBusy(false);
    }
  }

  async function setHotspotStatus(hotspot, next) {
    if (
      next === "Archived" &&
      !window.confirm(`Discard "${hotspot.label || "this hotspot"}"? It is archived, not deleted.`)
    )
      return;
    setBusy(true);
    say("busy", next === "Live" ? "Publishing…" : "Updating…");
    try {
      const res = await fetch("/api/hotspots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: hotspot.id, status: next }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      setHotspots((prev) => prev.map((h) => (h.id === d.hotspot.id ? d.hotspot : h)));
      setDraftEdit((prev) => (prev && prev.id === d.hotspot.id ? d.hotspot : prev));
      const name = d.hotspot.label || "Hotspot";
      say(
        "ok",
        next === "Live"
          ? `"${name}" is live — it now shows on the Headstart site.`
          : next === "Draft"
          ? `"${name}" returned to draft — removed from the live site.`
          : `"${name}" archived.`
      );
    } catch (err) {
      say("error", err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleImageUpload(file) {
    if (!file || !type) return;
    setBusy(true);
    setUploadPct(0);
    say("busy", `Uploading ${file.name}…`);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const blob = await upload(`Application Images/${slugify(type.name)}-${Date.now()}-${safe}`, file, {
        access: "public",
        handleUploadUrl: "/api/videos/upload",
        onUploadProgress: ({ percentage }) => setUploadPct(Math.round(percentage)),
      });
      const res = await fetch("/api/types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: type.id, applicationImageUrl: blob.url }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Couldn't save the image URL");
      setType(d.type);
      setTypes((prev) => prev.map((t) => (t.id === d.type.id ? { ...t, ...d.type } : t)));
      say("ok", `Image saved to ${d.type.name}.`);
    } catch (err) {
      say("error", err.message);
    } finally {
      setBusy(false);
      setUploadPct(null);
    }
  }

  return (
    <div style={s.wrap}>
      {/* ---- Type + image ---- */}
      <div style={s.row}>
        <div style={s.field}>
          <span style={s.label}>Type</span>
          <select style={s.input} value={typeId} disabled={busy} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">Select a type…</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.segment} › {t.name}
              </option>
            ))}
          </select>
        </div>
        {type && (
          <div style={{ ...s.field, flex: "0 0 auto" }}>
            <span style={s.label}>Application image</span>
            <label style={{ ...s.btnGhost, display: "inline-block", textAlign: "center", opacity: busy ? 0.5 : 1 }}>
              {type.applicationImageUrl ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept="image/webp,image/png,image/jpeg"
                style={{ display: "none" }}
                disabled={busy}
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
            </label>
          </div>
        )}
      </div>

      {/* ---- One status line, always present ---- */}
      {msg && (
        <div style={bannerStyle(msg.kind)}>
          {uploadPct !== null ? `${msg.text}  ${uploadPct}%` : msg.text}
        </div>
      )}

      {type && !type.applicationImageUrl && (
        <div style={s.hint}>{type.name} has no application image yet. Upload one to start placing hotspots.</div>
      )}

      {type && type.applicationImageUrl && (
        <>
          {/* ---- Naming a newly placed point ---- */}
          {pendingPoint && (
            <div style={s.panel}>
              <span style={s.label}>New hotspot at {pendingPoint.x}% , {pendingPoint.y}%</span>
              <div style={s.row}>
                <div style={s.field}>
                  <input
                    ref={newLabelRef}
                    style={s.input}
                    placeholder="Label, e.g. Shoulder Joint"
                    value={newLabel}
                    disabled={busy}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmNewHotspot();
                      if (e.key === "Escape") cancelNewHotspot();
                    }}
                  />
                </div>
                <button type="button" style={s.btn} disabled={busy || !newLabel.trim()} onClick={confirmNewHotspot}>
                  Create as draft
                </button>
                <button type="button" style={s.btnGhost} disabled={busy} onClick={cancelNewHotspot}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ---- Editor, ABOVE the image ---- */}
          {selected && draftEdit && !pendingPoint && (
            <div style={s.panel}>
              <div style={s.row}>
                <div style={s.field}>
                  <span style={s.label}>Label</span>
                  <input
                    style={s.input}
                    value={draftEdit.label || ""}
                    disabled={busy}
                    onChange={(e) => edit({ label: e.target.value })}
                  />
                </div>
                <div style={{ ...s.field, flex: "0 0 120px" }}>
                  <span style={s.label}>Smart zoom %</span>
                  <input
                    style={s.input}
                    type="number"
                    value={draftEdit.smartZoom ?? 150}
                    disabled={busy}
                    onChange={(e) => edit({ smartZoom: e.target.value })}
                  />
                </div>
                <div style={{ ...s.field, flex: "0 0 auto" }}>
                  <span style={s.label}>Position</span>
                  <span style={s.hint}>
                    {selected.x}% , {selected.y}%
                  </span>
                </div>
                <div style={{ ...s.field, flex: "0 0 auto" }}>
                  <span style={s.label}>Status</span>
                  <span style={statusPill(selected.status)}>{selected.status || "No status"}</span>
                </div>
              </div>

              <div style={s.row}>
                <div style={{ ...s.field, flex: "0 0 100px" }}>
                  <span style={s.label}>Label X</span>
                  <input
                    style={s.input}
                    type="number"
                    value={draftEdit.labelX ?? 0}
                    disabled={busy}
                    onChange={(e) => edit({ labelX: e.target.value })}
                  />
                </div>
                <div style={{ ...s.field, flex: "0 0 100px" }}>
                  <span style={s.label}>Label Y</span>
                  <input
                    style={s.input}
                    type="number"
                    value={draftEdit.labelY ?? 0}
                    disabled={busy}
                    onChange={(e) => edit({ labelY: e.target.value })}
                  />
                </div>
                <div style={{ ...s.field, flex: "0 0 140px" }}>
                  <span style={s.label}>Label side</span>
                  <select
                    style={s.input}
                    value={draftEdit.labelSide || "centre"}
                    disabled={busy}
                    onChange={(e) => edit({ labelSide: e.target.value })}
                  >
                    {LABEL_SIDES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <span style={s.label}>Application areas ({type.segment})</span>
                  <select
                    style={{ ...s.input, minHeight: 84 }}
                    multiple
                    value={draftEdit.applicationAreaIds || []}
                    disabled={busy}
                    onChange={(e) =>
                      edit({ applicationAreaIds: Array.from(e.target.selectedOptions).map((o) => o.value) })
                    }
                  >
                    {areasForSegment.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullPath}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={s.row}>
                <button type="button" style={s.btn} disabled={busy || !dirty} onClick={saveEdit}>
                  {dirty ? "Save changes" : "Saved"}
                </button>
                {selected.status !== "Live" && (
                  <button
                    type="button"
                    style={s.btnGhost}
                    disabled={busy || dirty}
                    title={dirty ? "Save your changes first" : ""}
                    onClick={() => setHotspotStatus(selected, "Live")}
                  >
                    Publish to live
                  </button>
                )}
                {selected.status === "Live" && (
                  <button type="button" style={s.btnGhost} disabled={busy} onClick={() => setHotspotStatus(selected, "Draft")}>
                    Return to draft
                  </button>
                )}
                <button type="button" style={s.btnWarn} disabled={busy} onClick={() => setHotspotStatus(selected, "Archived")}>
                  Discard
                </button>
                <button type="button" style={s.btnGhost} disabled={busy} onClick={() => { setSelectedId(null); setDraftEdit(null); setDirty(false); }}>
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ---- Place control ---- */}
          <div style={s.row}>
            <button
              type="button"
              style={placing ? { ...s.btn, background: ORANGE } : s.btn}
              disabled={busy || !!pendingPoint}
              onClick={() => {
                setPlacing((v) => !v);
                say("info", placing ? "Placing cancelled." : "Click anywhere on the image to place the hotspot.");
              }}
            >
              {placing ? "Cancel placing" : "Add hotspot"}
            </button>
            <button
              type="button"
              style={s.btnGhost}
              disabled={busy}
              onClick={() => {
                setZoomed((v) => !v);
                say("info", zoomed ? "Showing the whole image." : "Zoomed in — scroll the image to reach any part of it.");
              }}
            >
              {zoomed ? "Fit whole image" : "Zoom in"}
            </button>
            <span style={s.hint}>
              {liveCount} live, {draftCount} draft. Click a dot to edit it, drag to move it.
            </span>
          </div>

          {/* ---- Image, capped and scrollable ---- */}
          <div style={s.stageOuter}>
            <div style={{ ...s.stage, cursor: placing ? "crosshair" : "default" }} onClick={handleStageClick}>
              <img ref={imgRef} src={type.applicationImageUrl} alt={type.name} style={zoomed ? s.imgActual : s.imgFit} draggable={false} />
              {visible.map((h) => (
                <span key={h.id}>
                  {h.label && (
                    <span style={{ ...s.dotLabel, left: `${h.x}%`, top: `${h.y}%` }}>{h.label}</span>
                  )}
                  <button
                    type="button"
                    title={`${h.label || "(no label)"} — ${h.status || "no status"}`}
                    onMouseDown={(e) => startDrag(e, h)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      ...s.dot,
                      left: `${h.x}%`,
                      top: `${h.y}%`,
                      background: h.status === "Live" ? ACCENT : ORANGE,
                      outline: h.id === selectedId ? `3px solid ${INK}` : "none",
                    }}
                  />
                </span>
              ))}
              {pendingPoint && (
                <span
                  style={{
                    ...s.dot,
                    left: `${pendingPoint.x}%`,
                    top: `${pendingPoint.y}%`,
                    background: "#fff",
                    border: `3px dashed ${ORANGE}`,
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* ---- List ---- */}
      {type && hotspots.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={s.label}>All hotspots for {type.name}</span>
          {hotspots.map((h) => (
            <div key={h.id} style={s.listRow}>
              <span style={statusPill(h.status)}>{h.status || "No status"}</span>
              <button
                type="button"
                style={{
                  border: "none", background: "transparent", padding: 0, flex: 1, textAlign: "left",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  color: h.label ? INK : "#a1372c",
                }}
                onClick={() => {
                  setSelectedId(h.id);
                  setDraftEdit(h);
                  setDirty(false);
                  say("info", `Editing "${h.label || "unnamed hotspot"}".`);
                }}
              >
                {h.label || "(no label — needs fixing)"}
              </button>
              <span style={{ ...s.hint, flex: "0 0 auto" }}>
                {typeof h.x === "number" && typeof h.y === "number" ? `${h.x}% , ${h.y}%` : "not placed"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
