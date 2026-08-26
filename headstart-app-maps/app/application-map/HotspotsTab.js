"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

// Hotspot mapper — "Workbench" layout, 26 Aug 2026.
//
// Picture on the left, one panel on the right. The panel holds either the
// details of the selected hotspot or, when nothing is selected, what to do
// next — never both, so the page does not grow and the controls never fall
// below the fold. The list underneath runs in two columns and carries each
// hotspot's application areas, so selecting a row and selecting a dot are two
// views of the same thing.
//
// COORDINATES. X and Y are percentages OF THE PICTURE. They are deliberately
// invisible in this interface: a position is something you drag, not a number
// you type. Every measurement is taken from the <img> element's own bounding
// rect, which already accounts for letterboxing and for the current zoom, so
// the maths holds at any magnification.
//
// ZOOM AND PAN use a scrolling box rather than a CSS transform. The picture is
// sized in real pixels and the browser does the clamping, so it is impossible
// to pan into empty space — the failure that had to be fixed by hand in the
// Engine's transform-based stage.
//
// MOVES ARE STAGED. Dragging a dot changes only local state; nothing reaches
// Airtable until "Save all changes". Before this, releasing the mouse wrote
// straight to the live site, and one accidental drag while scrolling moved a
// published hotspot without anyone noticing.

const ACCENT = "#3EC2CF";
const ACCENT_DARK = "#0d838d";
const ORANGE = "#F58220";
const INK = "#212120";
const MUTED = "#77746c";
const RULE = "#e4e2dc";

const LABEL_SIDES = ["left", "centre", "right"];
const STAGE_HEIGHT = 460;
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.5;
const DRAG_SLOP = 4; // px of movement before a press counts as a drag, not a click

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: 16 },
  row: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", gap: 6, flex: "1 1 200px", minWidth: 150 },
  label: {
    fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: MUTED,
  },
  input: {
    border: `1px solid #d8d5cd`, borderRadius: 8, padding: "9px 11px",
    fontSize: 14, color: INK, background: "#fff", fontFamily: "inherit", width: "100%",
  },
  btn: {
    border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit", background: ACCENT_DARK, color: "#fff",
  },
  btnGhost: {
    border: `1px solid #d8d5cd`, borderRadius: 8, padding: "9px 14px", fontSize: 13,
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: INK,
  },
  btnWarn: {
    border: "1px solid #e0b4b0", borderRadius: 8, padding: "9px 14px", fontSize: 13,
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#a1372c",
  },
  workbench: { display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" },
  stageOuter: {
    position: "relative", background: "#fff", border: `1px solid ${RULE}`, borderRadius: 12,
    height: STAGE_HEIGHT, overflow: "auto", textAlign: "center", userSelect: "none",
  },
  stageInner: { position: "relative", display: "inline-block", lineHeight: 0, verticalAlign: "top" },
  // draggable={false} is what stops the browser's own image-drag; the picture
  // stays hit-testable so presses on it reach the pan handler normally.
  img: { display: "block", width: "auto", maxWidth: "none", userSelect: "none" },
  dot: {
    position: "absolute", width: 16, height: 16, borderRadius: "50%",
    transform: "translate(-50%, -50%)", cursor: "grab", border: "2px solid #fff",
    boxShadow: "0 1px 4px rgba(0,0,0,.45)", padding: 0, zIndex: 3,
  },
  hint: { fontSize: 13, color: MUTED, lineHeight: 1.5 },
  panel: {
    border: `1px solid ${RULE}`, borderRadius: 12, padding: 14,
    background: "#faf9f7", display: "flex", flexDirection: "column", gap: 12,
  },
  banner: {
    borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
  },
  listGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 },
  listRow: {
    display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
    borderRadius: 8, border: `1px solid ${RULE}`, background: "#fff",
    cursor: "pointer", textAlign: "left", fontFamily: "inherit", minWidth: 0, width: "100%",
  },
  pill: {
    fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase",
    borderRadius: 999, padding: "3px 8px", flex: "0 0 auto",
  },
  zoomBar: {
    position: "absolute", top: 10, right: 10, zIndex: 6, display: "flex", alignItems: "center",
    gap: 2, background: "rgba(20,20,20,.85)", borderRadius: 8, padding: "4px 6px",
  },
  zoomBtn: {
    width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(255,255,255,.35)",
    background: "none", color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1,
    cursor: "pointer", fontFamily: "inherit",
  },
  zoomPct: { fontSize: 11, fontWeight: 800, color: "#fff", minWidth: 40, textAlign: "center" },
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

// A label near an edge is pushed inward so the frame never clips it. Below the
// dot at the top of the picture, above it everywhere else; left- or
// right-aligned within 14% of either side.
function labelStyle(x, y, emphasised) {
  const above = y > 14;
  const base = {
    position: "absolute", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 2,
    background: emphasised ? "rgba(13,131,141,.95)" : "rgba(20,20,20,.86)",
    color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 7px",
    borderRadius: 5, lineHeight: 1.3, left: `${x}%`, top: `${y}%`,
  };
  const dy = above ? "calc(-100% - 12px)" : "12px";
  if (x < 14) return { ...base, transform: `translate(-8px, ${dy})` };
  if (x > 86) return { ...base, transform: `translate(calc(-100% + 8px), ${dy})` };
  return { ...base, transform: `translate(-50%, ${dy})` };
}

export default function HotspotsTab() {
  const [types, setTypes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [typeId, setTypeId] = useState("");
  const [type, setType] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [draftEdit, setDraftEdit] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [moves, setMoves] = useState({}); // id -> {x,y}, staged until committed
  const [msg, setMsg] = useState(null); // { kind, text }
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [zoom, setZoom] = useState(1);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label, mappingCount }

  const imgRef = useRef(null);
  const outerRef = useRef(null);
  const dotDrag = useRef(null);
  const panDrag = useRef(null);
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
        setMoves({});
        setZoom(1);
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
      setMoves({});
    }
  }, [typeId, loadHotspots]);

  useEffect(() => {
    if (pendingPoint && newLabelRef.current) newLabelRef.current.focus();
  }, [pendingPoint]);

  const areasForSegment = useMemo(
    () => (type ? areas.filter((a) => a.segment === type.segment) : []),
    [areas, type]
  );
  const areaById = useMemo(() => {
    const m = {};
    areas.forEach((a) => (m[a.id] = a));
    return m;
  }, [areas]);

  // The picture always shows staged positions, so a drag is visible
  // immediately even though nothing has been written yet.
  const positioned = useMemo(
    () => hotspots.map((h) => (moves[h.id] ? { ...h, ...moves[h.id] } : h)),
    [hotspots, moves]
  );
  const selected = positioned.find((h) => h.id === selectedId) || null;
  const visible = positioned.filter(
    (h) => h.status !== "Archived" && typeof h.x === "number" && typeof h.y === "number"
  );
  const liveCount = hotspots.filter((h) => h.status === "Live").length;
  const draftCount = hotspots.filter((h) => h.status === "Draft").length;
  const moveCount = Object.keys(moves).length;

  // Percentage of the PICTURE, from the picture's own rect.
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

  // ---- pan (press anywhere on the picture) ----
  function onStageMouseDown(e) {
    if (dotDrag.current) return;
    const outer = outerRef.current;
    if (!outer) return;
    panDrag.current = {
      startX: e.clientX, startY: e.clientY,
      left: outer.scrollLeft, top: outer.scrollTop, moved: false,
    };
  }

  // ---- drag a dot (press on the dot) ----
  function onDotMouseDown(e, hotspot) {
    e.stopPropagation();
    e.preventDefault();
    dotDrag.current = { id: hotspot.id, moved: false };
    setSelectedId(hotspot.id);
    setDraftEdit(hotspot);
    setDirty(false);
    setConfirmDelete(null);
  }

  useEffect(() => {
    function move(e) {
      const d = dotDrag.current;
      if (d) {
        const pt = pointFromEvent(e);
        if (!pt) return;
        d.moved = true;
        setMoves((prev) => ({ ...prev, [d.id]: pt }));
        return;
      }
      const pan = panDrag.current;
      if (pan && outerRef.current) {
        const dx = e.clientX - pan.startX;
        const dy = e.clientY - pan.startY;
        if (Math.abs(dx) > DRAG_SLOP || Math.abs(dy) > DRAG_SLOP) pan.moved = true;
        if (pan.moved) {
          outerRef.current.scrollLeft = pan.left - dx;
          outerRef.current.scrollTop = pan.top - dy;
        }
      }
    }
    function up(e) {
      const d = dotDrag.current;
      dotDrag.current = null;
      if (d?.moved) {
        say("info", `Moved. ${Object.keys(moves).length ? "" : ""}Nothing is saved until you press "Save all changes".`);
        return;
      }
      const pan = panDrag.current;
      panDrag.current = null;
      // A press that did not turn into a drag is a click. Only then does it
      // place a hotspot — otherwise panning the picture would drop pins.
      if (pan && !pan.moved && placing && type?.applicationImageUrl) {
        const pt = pointFromEvent(e);
        if (pt) {
          setPendingPoint(pt);
          setNewLabel("");
          setPlacing(false);
          setSelectedId(null);
          setDraftEdit(null);
          say("info", "Give the new hotspot a name.");
        }
      }
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [placing, type, moves]);

  async function commitMoves() {
    const payload = Object.entries(moves).map(([id, p]) => ({ id, x: p.x, y: p.y }));
    if (!payload.length) return;
    setBusy(true);
    say("busy", `Saving ${payload.length} ${payload.length === 1 ? "position" : "positions"}…`);
    try {
      const res = await fetch("/api/hotspots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moves: payload }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      const byId = {};
      (d.hotspots || []).forEach((h) => (byId[h.id] = h));
      setHotspots((prev) => prev.map((h) => byId[h.id] || h));
      setMoves({});
      say("ok", `${d.saved} ${d.saved === 1 ? "position" : "positions"} saved.`);
    } catch (err) {
      say("error", `${err.message} — nothing was changed. Your moves are still here; try again.`);
    } finally {
      setBusy(false);
    }
  }

  function undoMoves() {
    setMoves({});
    say("info", "Moves discarded. Everything is back where it was.");
  }

  async function confirmNewHotspot() {
    const label = newLabel.trim();
    if (!label) {
      say("error", "A name is required before the hotspot can be created.");
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
          typeId, label, hotspotId: slugify(`${type.name}-${label}`),
          x: pendingPoint.x, y: pendingPoint.y, smartZoom: 150,
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
      say("ok", `"${d.hotspot.label}" created as a draft. It is not on the live site yet.`);
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

  function edit(patch) {
    setDraftEdit((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }

  async function saveEdit() {
    if (!draftEdit) return;
    if (!String(draftEdit.label || "").trim()) {
      say("error", "A name is required.");
      return;
    }
    setBusy(true);
    say("busy", "Saving…");
    try {
      const res = await fetch("/api/hotspots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftEdit.id, label: draftEdit.label, smartZoom: draftEdit.smartZoom,
          labelX: draftEdit.labelX, labelY: draftEdit.labelY, labelSide: draftEdit.labelSide,
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
      setConfirmDelete(null);
      const name = d.hotspot.label || "Hotspot";
      say(
        "ok",
        next === "Live"
          ? `"${name}" is live — it now shows on the Headstart site.`
          : next === "Draft"
          ? `"${name}" is back to draft and off the live site.`
          : `"${name}" archived — off the site, nothing lost.`
      );
    } catch (err) {
      say("error", err.message);
    } finally {
      setBusy(false);
    }
  }

  // Delete asks the server, because only the server knows how many
  // manufacturer mappings hang off this hotspot. A refusal comes back as a
  // 409 with the count and is shown as a choice, not as a failure.
  async function deleteHotspot(hotspot) {
    setBusy(true);
    say("busy", "Deleting…");
    try {
      const res = await fetch(`/api/hotspots?id=${encodeURIComponent(hotspot.id)}`, { method: "DELETE" });
      const d = await res.json();
      if (res.status === 409) {
        setConfirmDelete({ id: hotspot.id, label: hotspot.label, mappingCount: d.mappingCount });
        say("error", d.error);
        return;
      }
      if (!res.ok) throw new Error(d.error || "Delete failed");
      setHotspots((prev) => prev.filter((h) => h.id !== hotspot.id));
      setMoves((prev) => {
        const next = { ...prev };
        delete next[hotspot.id];
        return next;
      });
      setSelectedId(null);
      setDraftEdit(null);
      setConfirmDelete(null);
      say("ok", `"${d.label || "Hotspot"}" deleted.`);
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
      if (!res.ok) throw new Error(d.error || "Couldn't save the image");
      setType(d.type);
      setTypes((prev) => prev.map((t) => (t.id === d.type.id ? { ...t, ...d.type } : t)));
      say("ok", `Picture saved to ${d.type.name}.`);
    } catch (err) {
      say("error", err.message);
    } finally {
      setBusy(false);
      setUploadPct(null);
    }
  }

  function zoomBy(delta) {
    setZoom((z) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100));
      if (next !== z) {
        say("info", next === 1 ? "Showing the whole picture." : `Zoomed to ${Math.round(next * 100)}%.`);
      }
      return next;
    });
  }

  function selectFromList(h) {
    setSelectedId(h.id);
    setDraftEdit(h);
    setDirty(false);
    setConfirmDelete(null);
    setPendingPoint(null);
    say("info", `Editing "${h.label || "unnamed hotspot"}".`);
  }

  const areaNamesFor = (h) =>
    (h.applicationAreaIds || [])
      .map((id) => areaById[id]?.applicationArea || areaById[id]?.fullPath)
      .filter(Boolean);

  return (
    <div style={s.wrap}>
      {/* ---- Type + picture ---- */}
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
          <>
            <button
              type="button"
              style={placing ? { ...s.btn, background: ORANGE } : s.btn}
              disabled={busy || !!pendingPoint || !type.applicationImageUrl}
              onClick={() => {
                setPlacing((v) => !v);
                say("info", placing ? "Placing cancelled." : "Click the picture where the hotspot goes.");
              }}
            >
              {placing ? "Cancel placing" : "Add hotspot"}
            </button>
            <label style={{ ...s.btnGhost, display: "inline-block", opacity: busy ? 0.5 : 1 }}>
              {type.applicationImageUrl ? "Replace picture" : "Upload picture"}
              <input
                type="file"
                accept="image/webp,image/png,image/jpeg"
                style={{ display: "none" }}
                disabled={busy}
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
            </label>
          </>
        )}
      </div>

      {/* ---- Unsaved moves ---- */}
      {moveCount > 0 && (
        <div style={{ ...bannerStyle("info"), background: "#e4f4f6", borderColor: "#a9dbe1", color: "#0b6570" }}>
          <span>
            {moveCount} {moveCount === 1 ? "hotspot has" : "hotspots have"} been moved — not saved yet
          </span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button type="button" style={s.btn} disabled={busy} onClick={commitMoves}>
              Save all changes
            </button>
            <button type="button" style={s.btnGhost} disabled={busy} onClick={undoMoves}>
              Undo moves
            </button>
          </span>
        </div>
      )}

      {/* ---- One status line ---- */}
      {msg && (
        <div style={bannerStyle(msg.kind)}>
          {uploadPct !== null ? `${msg.text}  ${uploadPct}%` : msg.text}
        </div>
      )}

      {type && !type.applicationImageUrl && (
        <div style={s.hint}>{type.name} has no picture yet. Upload one to start placing hotspots.</div>
      )}

      {type && type.applicationImageUrl && (
        <>
          <div style={s.workbench}>
            {/* ---- Picture ---- */}
            <div
              ref={outerRef}
              style={{ ...s.stageOuter, cursor: placing ? "crosshair" : "grab" }}
              onMouseDown={onStageMouseDown}
            >
              <div style={s.zoomBar} onMouseDown={(e) => e.stopPropagation()}>
                <button
                  type="button" style={s.zoomBtn} title="Zoom out"
                  disabled={zoom <= ZOOM_MIN} onClick={() => zoomBy(-ZOOM_STEP)}
                >
                  −
                </button>
                <span style={s.zoomPct}>{Math.round(zoom * 100)}%</span>
                <button
                  type="button" style={s.zoomBtn} title="Zoom in"
                  disabled={zoom >= ZOOM_MAX} onClick={() => zoomBy(ZOOM_STEP)}
                >
                  +
                </button>
              </div>

              <div style={s.stageInner}>
                <img
                  ref={imgRef}
                  src={type.applicationImageUrl}
                  alt={type.name}
                  style={{ ...s.img, height: STAGE_HEIGHT * zoom }}
                  draggable={false}
                />
                {visible.map((h) => {
                  const on = h.id === selectedId;
                  const showLabel = showAllLabels || on || h.id === hoverId;
                  return (
                    <span key={h.id}>
                      {showLabel && h.label && <span style={labelStyle(h.x, h.y, on)}>{h.label}</span>}
                      <button
                        type="button"
                        title={h.label || "(no name)"}
                        aria-label={h.label || "Unnamed hotspot"}
                        onMouseDown={(e) => onDotMouseDown(e, h)}
                        onMouseEnter={() => setHoverId(h.id)}
                        onMouseLeave={() => setHoverId((v) => (v === h.id ? null : v))}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          ...s.dot,
                          left: `${h.x}%`,
                          top: `${h.y}%`,
                          background: h.status === "Live" ? ACCENT : ORANGE,
                          outline: on ? `3px solid ${INK}` : "none",
                        }}
                      />
                    </span>
                  );
                })}
                {pendingPoint && (
                  <span
                    style={{
                      ...s.dot, left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%`,
                      background: "#fff", border: `3px dashed ${ORANGE}`, cursor: "default",
                    }}
                  />
                )}
              </div>
            </div>

            {/* ---- The one panel ---- */}
            <div style={s.panel}>
              {pendingPoint ? (
                <>
                  <span style={s.label}>New hotspot</span>
                  <input
                    ref={newLabelRef}
                    style={s.input}
                    placeholder="Name it, e.g. Shoulder Joint"
                    value={newLabel}
                    disabled={busy}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmNewHotspot();
                      if (e.key === "Escape") cancelNewHotspot();
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" style={s.btn} disabled={busy || !newLabel.trim()} onClick={confirmNewHotspot}>
                      Create as draft
                    </button>
                    <button type="button" style={s.btnGhost} disabled={busy} onClick={cancelNewHotspot}>
                      Cancel
                    </button>
                  </div>
                  <span style={s.hint}>It starts as a draft, so it will not appear on the Headstart site until you publish it.</span>
                </>
              ) : selected && draftEdit ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={statusPill(selected.status)}>{selected.status || "No status"}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {selected.label || "(no name)"}
                    </span>
                  </div>

                  <div style={s.field}>
                    <span style={s.label}>Name</span>
                    <input
                      style={s.input}
                      value={draftEdit.label || ""}
                      disabled={busy}
                      onChange={(e) => edit({ label: e.target.value })}
                    />
                  </div>

                  <div style={s.field}>
                    <span style={s.label}>Application areas ({type.segment})</span>
                    <select
                      style={{ ...s.input, minHeight: 92 }}
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

                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ ...s.field, flex: "1 1 0", minWidth: 0 }}>
                      <span style={s.label}>Label sits</span>
                      <select
                        style={s.input}
                        value={draftEdit.labelSide || "centre"}
                        disabled={busy}
                        onChange={(e) => edit({ labelSide: e.target.value })}
                      >
                        {LABEL_SIDES.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ ...s.field, flex: "1 1 0", minWidth: 0 }}>
                      <span style={s.label}>Zoom on click</span>
                      <input
                        style={s.input}
                        type="number"
                        value={draftEdit.smartZoom ?? 150}
                        disabled={busy}
                        onChange={(e) => edit({ smartZoom: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" style={s.btn} disabled={busy || !dirty} onClick={saveEdit}>
                      {dirty ? "Save changes" : "Saved"}
                    </button>
                    {selected.status !== "Live" && (
                      <button
                        type="button" style={s.btnGhost} disabled={busy || dirty}
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
                  </div>

                  {confirmDelete && confirmDelete.id === selected.id ? (
                    <div style={{ ...bannerStyle("error"), flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>
                        {confirmDelete.mappingCount} manufacturer{confirmDelete.mappingCount === 1 ? "" : "s"} mapped
                        to this hotspot. Deleting it would leave{" "}
                        {confirmDelete.mappingCount === 1 ? "that mapping" : "those mappings"} orphaned.
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" style={s.btn} disabled={busy} onClick={() => setHotspotStatus(selected, "Archived")}>
                          Archive instead
                        </button>
                        <button type="button" style={s.btnGhost} disabled={busy} onClick={() => setConfirmDelete(null)}>
                          Keep it
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" style={s.btnWarn} disabled={busy} onClick={() => deleteHotspot(selected)}>
                        Delete
                      </button>
                      {selected.status !== "Archived" && (
                        <button type="button" style={s.btnGhost} disabled={busy} onClick={() => setHotspotStatus(selected, "Archived")}>
                          Archive
                        </button>
                      )}
                      <button
                        type="button" style={s.btnGhost} disabled={busy}
                        onClick={() => { setSelectedId(null); setDraftEdit(null); setDirty(false); setConfirmDelete(null); }}
                      >
                        Back to list
                      </button>
                    </div>
                  )}

                  <span style={{ ...s.hint, borderTop: `1px solid ${RULE}`, paddingTop: 10 }}>
                    Drag its dot on the picture to move it.
                    {selected.mappingCount > 0
                      ? ` ${selected.mappingCount} manufacturer${selected.mappingCount === 1 ? " is" : "s are"} mapped to this hotspot.`
                      : " No manufacturers are mapped to it yet."}
                  </span>
                </>
              ) : (
                <>
                  <span style={s.label}>{type.name}</span>
                  <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                    {liveCount} live, {draftCount} draft
                  </span>
                  <span style={s.hint}>
                    Click a dot or a row below to edit it. Drag a dot to move it — nothing is saved
                    until you press Save. Drag the picture itself to move around when zoomed in.
                  </span>
                  <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showAllLabels}
                      onChange={(e) => setShowAllLabels(e.target.checked)}
                    />
                    Show every name on the picture
                  </label>
                  <span style={s.hint}>
                    Otherwise a name appears when you point at its dot, which keeps crowded areas readable.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ---- List, two columns ---- */}
          {hotspots.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={s.label}>All hotspots for {type.name}</span>
              <div style={s.listGrid}>
                {hotspots.map((h) => {
                  const names = areaNamesFor(h);
                  const on = h.id === selectedId;
                  const placed = typeof h.x === "number" && typeof h.y === "number";
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => selectFromList(h)}
                      onMouseEnter={() => setHoverId(h.id)}
                      onMouseLeave={() => setHoverId((v) => (v === h.id ? null : v))}
                      style={{
                        ...s.listRow,
                        borderColor: on ? ACCENT_DARK : RULE,
                        background: on ? "#e4f4f6" : "#fff",
                      }}
                    >
                      <span style={statusPill(h.status)}>{h.status || "No status"}</span>
                      <span
                        style={{
                          fontSize: 13.5, fontWeight: 600, color: h.label ? INK : "#a1372c",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0,
                        }}
                      >
                        {h.label || "(no name — needs fixing)"}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto", fontSize: 11, color: names.length ? MUTED : ORANGE,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          maxWidth: "48%", flex: "0 1 auto",
                        }}
                      >
                        {!placed ? "not placed" : names.length ? names.join(", ") : "No area assigned"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
