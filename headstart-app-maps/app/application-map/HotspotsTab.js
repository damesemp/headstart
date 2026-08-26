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
// not of any container. The Engine reads them that way and the 30 existing
// hotspots are stored that way. So every measurement is taken from the <img>
// element's own bounding rect, which already accounts for letterboxing and
// for any CSS transform applied for zoom. Measuring the wrapper instead
// would be wrong by the letterbox offset — the mirror image of a bug that
// had to be fixed in the Engine.

const ACCENT = "#3EC2CF";
const ACCENT_DARK = "#0d838d";
const ORANGE = "#F58220";
const INK = "#212120";

const LABEL_SIDES = ["left", "centre", "right"];

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: 18 },
  row: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", gap: 6, flex: "1 1 200px", minWidth: 160 },
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
  stage: {
    position: "relative", background: "#fff", border: "1px solid #e4e2dc",
    borderRadius: 12, overflow: "hidden", minHeight: 320,
  },
  img: { display: "block", width: "100%", height: "auto", userSelect: "none" },
  dot: {
    position: "absolute", width: 18, height: 18, borderRadius: "50%",
    transform: "translate(-50%, -50%)", cursor: "grab", border: "2px solid #fff",
    boxShadow: "0 1px 4px rgba(0,0,0,.45)", padding: 0,
  },
  hint: { fontSize: 13, color: "#77746c", lineHeight: 1.5 },
  panel: {
    border: "1px solid #e4e2dc", borderRadius: 12, padding: 16,
    background: "#faf9f7", display: "flex", flexDirection: "column", gap: 12,
  },
  listRow: {
    display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
    borderRadius: 8, border: "1px solid #e4e2dc", background: "#fff",
  },
  pill: {
    fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase",
    borderRadius: 999, padding: "3px 9px",
  },
  status: { fontSize: 13, minHeight: 18 },
};

function statusPill(status) {
  if (status === "Live") return { ...s.pill, background: "#e3f3e6", color: "#22683a" };
  if (status === "Archived") return { ...s.pill, background: "#ece9e4", color: "#6f6d67" };
  return { ...s.pill, background: "#fdf0dd", color: "#8a5312" };
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
  const [status, setStatus] = useState({ text: "", ok: null });
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState(null);
  const [placing, setPlacing] = useState(false);

  const imgRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    fetch("/api/types", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setTypes(d.types || []);
        setAreas(d.applicationAreas || []);
      })
      .catch((e) => setStatus({ text: e.message, ok: false }));
  }, []);

  const loadHotspots = useCallback((id) => {
    if (!id) return;
    fetch(`/api/hotspots?typeId=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setType(d.type || null);
        setHotspots(d.hotspots || []);
        setSelectedId(null);
        setDraftEdit(null);
      })
      .catch((e) => setStatus({ text: e.message, ok: false }));
  }, []);

  useEffect(() => {
    if (typeId) loadHotspots(typeId);
    else {
      setType(null);
      setHotspots([]);
    }
  }, [typeId, loadHotspots]);

  const areasForSegment = useMemo(
    () => (type ? areas.filter((a) => a.segment === type.segment) : []),
    [areas, type]
  );

  const selected = hotspots.find((h) => h.id === selectedId) || null;

  // Percentage of the IMAGE, from the image's own rect. See the note at the
  // top of this file before changing anything here.
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

  async function handleStageClick(e) {
    if (!placing || !type) return;
    const pt = pointFromEvent(e);
    if (!pt) return;
    const label = window.prompt("Label for this hotspot");
    if (!label || !label.trim()) return;

    setBusy(true);
    setStatus({ text: "Creating hotspot…", ok: null });
    try {
      const res = await fetch("/api/hotspots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeId,
          label: label.trim(),
          hotspotId: slugify(`${type.name}-${label}`),
          x: pt.x,
          y: pt.y,
          smartZoom: 150,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Create failed");
      setHotspots((prev) => [...prev, d.hotspot]);
      setSelectedId(d.hotspot.id);
      setDraftEdit(d.hotspot);
      setStatus({ text: `Created "${d.hotspot.label}" as Draft.`, ok: true });
      setPlacing(false);
    } catch (err) {
      setStatus({ text: err.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  function startDrag(e, hotspot) {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { id: hotspot.id, moved: false };
    setSelectedId(hotspot.id);
    setDraftEdit(hotspot);
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
      try {
        const res = await fetch("/api/hotspots", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: d.id, x: d.last.x, y: d.last.y }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Move failed");
        setStatus({ text: `Moved to ${d.last.x}%, ${d.last.y}%.`, ok: true });
      } catch (err) {
        setStatus({ text: err.message, ok: false });
        loadHotspots(typeId);
      }
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [typeId, loadHotspots]);

  async function saveEdit() {
    if (!draftEdit) return;
    setBusy(true);
    setStatus({ text: "Saving…", ok: null });
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
      setStatus({ text: "Saved.", ok: true });
    } catch (err) {
      setStatus({ text: err.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function setHotspotStatus(hotspot, next) {
    if (next === "Archived" && !window.confirm(`Discard "${hotspot.label}"? It will be archived, not deleted.`))
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/hotspots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: hotspot.id, status: next }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      setHotspots((prev) => prev.map((h) => (h.id === d.hotspot.id ? d.hotspot : h)));
      setStatus({
        text: next === "Live" ? `"${hotspot.label}" is now live.` : `"${hotspot.label}" archived.`,
        ok: true,
      });
    } catch (err) {
      setStatus({ text: err.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function handleImageUpload(file) {
    if (!file || !type) return;
    setBusy(true);
    setUploadPct(0);
    setStatus({ text: "Uploading image…", ok: null });
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
      setStatus({ text: "Image saved to this Type.", ok: true });
    } catch (err) {
      setStatus({ text: err.message, ok: false });
    } finally {
      setBusy(false);
      setUploadPct(null);
    }
  }

  const drafts = hotspots.filter((h) => h.status === "Draft");
  const live = hotspots.filter((h) => h.status === "Live");

  return (
    <div style={s.wrap}>
      <div style={s.row}>
        <div style={s.field}>
          <span style={s.label}>Type</span>
          <select style={s.input} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
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
            <label style={{ ...s.btnGhost, display: "inline-block", textAlign: "center" }}>
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

      {uploadPct !== null && <div style={s.hint}>Uploading… {uploadPct}%</div>}

      <div
        style={{
          ...s.status,
          color: status.ok === false ? "#a1372c" : status.ok ? "#22683a" : "#77746c",
        }}
      >
        {status.text}
      </div>

      {!type && <div style={s.hint}>Select a type to begin.</div>}

      {type && !type.applicationImageUrl && (
        <div style={s.hint}>
          {type.name} has no application image yet. Upload one before placing hotspots.
        </div>
      )}

      {type && type.applicationImageUrl && (
        <>
          <div style={s.row}>
            <button
              type="button"
              style={placing ? { ...s.btn, background: ORANGE } : s.btn}
              disabled={busy}
              onClick={() => setPlacing((v) => !v)}
            >
              {placing ? "Click the image to place…  (cancel)" : "Add hotspot"}
            </button>
            <span style={s.hint}>
              {live.length} live, {drafts.length} draft. Drag any dot to move it.
            </span>
          </div>

          <div
            style={{ ...s.stage, cursor: placing ? "crosshair" : "default" }}
            onClick={handleStageClick}
          >
            <img
              ref={imgRef}
              src={type.applicationImageUrl}
              alt={type.name}
              style={s.img}
              draggable={false}
            />
            {hotspots
              .filter((h) => h.status !== "Archived")
              .map((h) => (
                <button
                  key={h.id}
                  type="button"
                  title={`${h.label} — ${h.status}`}
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
              ))}
          </div>
        </>
      )}

      {selected && draftEdit && (
        <div style={s.panel}>
          <div style={s.row}>
            <div style={s.field}>
              <span style={s.label}>Label</span>
              <input
                style={s.input}
                value={draftEdit.label}
                onChange={(e) => setDraftEdit({ ...draftEdit, label: e.target.value })}
              />
            </div>
            <div style={{ ...s.field, flex: "0 0 120px" }}>
              <span style={s.label}>Smart zoom %</span>
              <input
                style={s.input}
                type="number"
                value={draftEdit.smartZoom ?? 150}
                onChange={(e) => setDraftEdit({ ...draftEdit, smartZoom: e.target.value })}
              />
            </div>
          </div>

          <div style={s.row}>
            <div style={{ ...s.field, flex: "0 0 110px" }}>
              <span style={s.label}>Label X</span>
              <input
                style={s.input}
                type="number"
                value={draftEdit.labelX ?? 0}
                onChange={(e) => setDraftEdit({ ...draftEdit, labelX: e.target.value })}
              />
            </div>
            <div style={{ ...s.field, flex: "0 0 110px" }}>
              <span style={s.label}>Label Y</span>
              <input
                style={s.input}
                type="number"
                value={draftEdit.labelY ?? 0}
                onChange={(e) => setDraftEdit({ ...draftEdit, labelY: e.target.value })}
              />
            </div>
            <div style={{ ...s.field, flex: "0 0 140px" }}>
              <span style={s.label}>Label side</span>
              <select
                style={s.input}
                value={draftEdit.labelSide || "centre"}
                onChange={(e) => setDraftEdit({ ...draftEdit, labelSide: e.target.value })}
              >
                {LABEL_SIDES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ ...s.field, flex: "0 0 auto" }}>
              <span style={s.label}>Position</span>
              <span style={s.hint}>
                {selected.x}% , {selected.y}%
              </span>
            </div>
          </div>

          <div style={s.field}>
            <span style={s.label}>Application areas ({type.segment})</span>
            <select
              style={{ ...s.input, minHeight: 110 }}
              multiple
              value={draftEdit.applicationAreaIds || []}
              onChange={(e) =>
                setDraftEdit({
                  ...draftEdit,
                  applicationAreaIds: Array.from(e.target.selectedOptions).map((o) => o.value),
                })
              }
            >
              {areasForSegment.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullPath}
                </option>
              ))}
            </select>
          </div>

          <div style={s.row}>
            <button type="button" style={s.btn} disabled={busy} onClick={saveEdit}>
              Save changes
            </button>
            {selected.status !== "Live" && (
              <button
                type="button"
                style={s.btnGhost}
                disabled={busy}
                onClick={() => setHotspotStatus(selected, "Live")}
              >
                Publish to live
              </button>
            )}
            {selected.status === "Live" && (
              <button
                type="button"
                style={s.btnGhost}
                disabled={busy}
                onClick={() => setHotspotStatus(selected, "Draft")}
              >
                Return to draft
              </button>
            )}
            <button
              type="button"
              style={s.btnWarn}
              disabled={busy}
              onClick={() => setHotspotStatus(selected, "Archived")}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {type && hotspots.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={s.label}>All hotspots for {type.name}</span>
          {hotspots.map((h) => (
            <div key={h.id} style={s.listRow}>
              <span style={statusPill(h.status)}>{h.status || "—"}</span>
              <button
                type="button"
                style={{
                  ...s.btnGhost,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  flex: 1,
                  textAlign: "left",
                }}
                onClick={() => {
                  setSelectedId(h.id);
                  setDraftEdit(h);
                }}
              >
                {h.label}
              </button>
              <span style={{ ...s.hint, flex: "0 0 auto" }}>
                {h.x}% , {h.y}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
