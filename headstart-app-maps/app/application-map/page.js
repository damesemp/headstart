"use client";

import { useState, useMemo } from "react";
import { REFERENCE_DATA } from "../lib/reference-data";

const styles = {
  page: { background: "#efeeec", padding: "40px 16px", minHeight: "100vh" },
  card: {
    maxWidth: 640,
    margin: "0 auto",
    background: "#141414",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif'
  },
  header: {
    background: "#000",
    padding: "22px 28px",
    display: "flex",
    alignItems: "center",
    gap: 16
  },
  logo: { fontWeight: 800, fontSize: 22, letterSpacing: 1, color: "#fff" },
  divider: { width: 2, height: 22, background: "#e8791a" },
  title: {
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 1,
    color: "#fff",
    textTransform: "uppercase"
  },
  body: { padding: "26px 28px 30px", color: "#f2f2f0" },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#f2f2f0",
    marginBottom: 8
  },
  hint: {
    textTransform: "none",
    fontWeight: 400,
    color: "#6b6b66",
    letterSpacing: 0,
    fontSize: 12
  },
  field: { marginBottom: 20 },
  input: {
    width: "100%",
    background: "#1b1b1b",
    border: "1px solid #2b2b2b",
    borderRadius: 8,
    color: "#f2f2f0",
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none"
  },
  textarea: {
    width: "100%",
    background: "#1b1b1b",
    border: "1px solid #2b2b2b",
    borderRadius: 8,
    color: "#f2f2f0",
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    minHeight: 110,
    lineHeight: 1.5,
    resize: "vertical"
  },
  tags: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#26241a",
    color: "#e2c67a",
    border: "1px solid #4a3f22",
    padding: "6px 10px 6px 12px",
    borderRadius: 999,
    fontSize: 13
  },
  tagBtn: {
    background: "none",
    border: "none",
    color: "#e2c67a",
    cursor: "pointer",
    fontSize: 15,
    lineHeight: 1,
    padding: 0
  },
  dropdown: {
    border: "1px solid #2b2b2b",
    borderRadius: 8,
    marginTop: 6,
    maxHeight: 170,
    overflowY: "auto",
    background: "#1b1b1b"
  },
  opt: { padding: "10px 14px", fontSize: 14, cursor: "pointer" },
  empty: { padding: "10px 14px", fontSize: 13, color: "#6b6b66" },
  dividerLine: { border: "none", borderTop: "1px solid #2b2b2b", margin: "26px 0" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#9a9a95",
    marginBottom: 14
  },
  mappedBox: {
    border: "1px solid #2b2b2b",
    borderRadius: 10,
    background: "#1b1b1b",
    maxHeight: 180,
    overflowY: "auto",
    marginBottom: 22
  },
  mappedRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid #2b2b2b"
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
    padding: "5px 10px",
    borderRadius: 999,
    textTransform: "uppercase"
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "#6b6b66",
    marginBottom: 16
  },
  submitBtn: {
    width: "100%",
    background: "transparent",
    border: "1px solid #e8791a",
    color: "#e8791a",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 0.6,
    padding: 15,
    borderRadius: 8,
    cursor: "pointer",
    textTransform: "uppercase"
  },
  statusMsg: { textAlign: "center", fontSize: 13, marginTop: 14, minHeight: 18 }
};

function badgeStyle(status) {
  if (status === "Promoted") return { background: "#0e2419", color: "#3fcf8e" };
  if (status === "Rejected") return { background: "#2c1414", color: "#e05a5a" };
  return { background: "#2c220d", color: "#d9a441" };
}

function MultiPicker({ label, hint, placeholder, options, selected, onAdd, onRemove }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = options.filter(
    (o) => o.label.toLowerCase().includes(query.toLowerCase()) && !selected.includes(o.id)
  );

  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} <span style={styles.hint}>{hint}</span>
      </label>
      <input
        style={styles.input}
        type="text"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      <div style={styles.tags}>
        {selected.map((id) => {
          const opt = options.find((o) => o.id === id);
          return (
            <span style={styles.tag} key={id}>
              {opt ? opt.label : id}
              <button style={styles.tagBtn} onClick={() => onRemove(id)}>
                &times;
              </button>
            </span>
          );
        })}
      </div>
      {open && (
        <div style={styles.dropdown}>
          {filtered.length ? (
            filtered.map((o) => (
              <div
                key={o.id}
                style={styles.opt}
                onClick={() => {
                  onAdd(o.id);
                  setQuery("");
                }}
              >
                {o.label}
              </div>
            ))
          ) : (
            <div style={styles.empty}>No matches</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApplicationMapPage() {
  const [industry, setIndustry] = useState(REFERENCE_DATA.industries[0]);
  const segments = REFERENCE_DATA.segments[industry] || [];
  const [segment, setSegment] = useState(segments[0] || null);

  const [typeIds, setTypeIds] = useState([]);
  const [areaIds, setAreaIds] = useState([]);

  const [mfrQuery, setMfrQuery] = useState("");
  const [mfrOpen, setMfrOpen] = useState(false);
  const [manufacturer, setManufacturer] = useState(null);
  const [mapped, setMapped] = useState([]);
  const [mappedLoading, setMappedLoading] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [productOpen, setProductOpen] = useState(false);

  const [whyFits, setWhyFits] = useState("");
  const [status, setStatus] = useState({ text: "", ok: null });
  const [submitting, setSubmitting] = useState(false);

  const typeOptions = useMemo(
    () =>
      REFERENCE_DATA.types
        .filter((t) => t.segment === segment)
        .map((t) => ({ id: t.id, label: t.name })),
    [segment]
  );

  const areaOptions = useMemo(
    () =>
      REFERENCE_DATA.applicationAreas
        .filter((a) => a.segment === segment)
        .filter((a) => typeIds.length === 0 || a.relevantTypes.some((t) => typeIds.includes(t)))
        .map((a) => ({ id: a.id, label: a.label })),
    [segment, typeIds]
  );

  const mfrMatches = REFERENCE_DATA.manufacturers.filter((m) =>
    m.name.toLowerCase().includes(mfrQuery.toLowerCase())
  );

  const currentMfr = REFERENCE_DATA.manufacturers.find((m) => m.name === manufacturer);
  const productMatches = currentMfr
    ? currentMfr.products.filter((p) => p.toLowerCase().includes(productQuery.toLowerCase()))
    : [];

  function handleIndustryChange(value) {
    setIndustry(value);
    const segs = REFERENCE_DATA.segments[value] || [];
    setSegment(segs[0] || null);
    setTypeIds([]);
    setAreaIds([]);
  }

  function handleSegmentChange(value) {
    setSegment(value);
    setTypeIds([]);
    setAreaIds([]);
  }

  async function selectManufacturer(name) {
    setManufacturer(name);
    setMfrQuery(name);
    setMfrOpen(false);
    setProductQuery("");
    setMappedLoading(true);
    try {
      const res = await fetch(`/api/mapped-for-manufacturer?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      setMapped(data);
    } catch {
      setMapped([]);
    } finally {
      setMappedLoading(false);
    }
  }

  function handleWhyFitsChange(value) {
    const lines = value.split("\n").filter((l) => l.trim() !== "");
    if (lines.length > 5) {
      setWhyFits(lines.slice(0, 5).join("\n"));
    } else {
      setWhyFits(value);
    }
  }

  const lineCount = whyFits.split("\n").filter((l) => l.trim() !== "").length;

  function resetForm() {
    setManufacturer(null);
    setMfrQuery("");
    setProductQuery("");
    setMapped([]);
    setTypeIds([]);
    setAreaIds([]);
    setWhyFits("");
    setStatus({ text: "", ok: null });
  }

  async function handleSubmit() {
    if (!manufacturer) {
      setStatus({ text: "Select a manufacturer first.", ok: false });
      return;
    }
    if (!productQuery.trim()) {
      setStatus({ text: "Enter a key product.", ok: false });
      return;
    }
    if (!typeIds.length || !areaIds.length) {
      setStatus({ text: "Select at least one Type and one Application area.", ok: false });
      return;
    }

    setSubmitting(true);
    setStatus({ text: "Submitting...", ok: null });

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manufacturer,
          product: productQuery.trim(),
          typeIds,
          areaIds,
          whyFits: whyFits.trim()
        })
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus({ text: "Submitted for review.", ok: true });
      resetForm();
    } catch {
      setStatus({ text: "Couldn't submit — try again.", ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logo}>ASTUTE</span>
          <span style={styles.divider}></span>
          <span style={styles.title}>Headstart Application Maps</span>
        </div>

        <div style={styles.body}>
          <div style={styles.field}>
            <label style={styles.label}>Industry</label>
            <select
              style={styles.input}
              value={industry}
              onChange={(e) => handleIndustryChange(e.target.value)}
            >
              {REFERENCE_DATA.industries.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Segment</label>
            <select
              style={styles.input}
              value={segment || ""}
              onChange={(e) => handleSegmentChange(e.target.value)}
            >
              {segments.length ? (
                segments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              ) : (
                <option disabled>No open segments for this industry</option>
              )}
            </select>
          </div>

          <MultiPicker
            label="Type"
            hint="(select all that apply)"
            placeholder="Search type, e.g. 'watch' or 'glasses'..."
            options={typeOptions}
            selected={typeIds}
            onAdd={(id) => setTypeIds((prev) => [...prev, id])}
            onRemove={(id) => setTypeIds((prev) => prev.filter((x) => x !== id))}
          />

          <MultiPicker
            label="Application area"
            hint="(select all that apply)"
            placeholder="Type to search, e.g. 'radar' or 'battery'..."
            options={areaOptions}
            selected={areaIds}
            onAdd={(id) => setAreaIds((prev) => [...prev, id])}
            onRemove={(id) => setAreaIds((prev) => prev.filter((x) => x !== id))}
          />

          <hr style={styles.dividerLine} />

          <div style={styles.field}>
            <label style={styles.label}>Manufacturer</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Search manufacturer, e.g. 'SynQor'..."
              value={mfrQuery}
              onFocus={() => setMfrOpen(true)}
              onChange={(e) => {
                setMfrQuery(e.target.value);
                setManufacturer(null);
                setMfrOpen(true);
              }}
            />
            {mfrOpen && (
              <div style={styles.dropdown}>
                {mfrMatches.length ? (
                  mfrMatches.slice(0, 50).map((m) => (
                    <div key={m.name} style={styles.opt} onClick={() => selectManufacturer(m.name)}>
                      {m.name}
                    </div>
                  ))
                ) : (
                  <div style={styles.empty}>No matches</div>
                )}
              </div>
            )}
          </div>

          {manufacturer && (
            <>
              <div style={styles.sectionLabel}>Already mapped for {manufacturer}</div>
              <div style={styles.mappedBox}>
                {mappedLoading ? (
                  <div style={styles.mappedRow}>
                    <span style={{ color: "#6b6b66", fontSize: 13 }}>Loading...</span>
                  </div>
                ) : mapped.length ? (
                  mapped.map((r, i) => (
                    <div style={styles.mappedRow} key={i}>
                      <div>
                        <div style={{ fontSize: 15 }}>{r.product}</div>
                        <div style={{ fontSize: 12, color: "#6b6b66", marginTop: 2 }}>{r.status}</div>
                      </div>
                      <span style={{ ...styles.badge, ...badgeStyle(r.status) }}>{r.status}</span>
                    </div>
                  ))
                ) : (
                  <div style={styles.mappedRow}>
                    <span style={{ color: "#6b6b66", fontSize: 13 }}>
                      Nothing mapped for this manufacturer yet.
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          <div style={styles.sectionLabel}>Add a new one</div>

          <div style={styles.field}>
            <label style={styles.label}>Key product</label>
            <input
              style={styles.input}
              type="text"
              placeholder={
                manufacturer ? `Search ${manufacturer} products, or type new...` : "Select a manufacturer first"
              }
              disabled={!manufacturer}
              value={productQuery}
              onFocus={() => setProductOpen(true)}
              onChange={(e) => {
                setProductQuery(e.target.value);
                setProductOpen(true);
              }}
            />
            {productOpen && manufacturer && (
              <div style={styles.dropdown}>
                {productMatches.length ? (
                  productMatches.map((p) => (
                    <div
                      key={p}
                      style={styles.opt}
                      onClick={() => {
                        setProductQuery(p);
                        setProductOpen(false);
                      }}
                    >
                      {p}
                    </div>
                  ))
                ) : (
                  <div style={styles.empty}>No matches — type to add new</div>
                )}
              </div>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Why this fits{" "}
              <span style={styles.hint}>
                (one per line, max 5 — specific to this product, not the manufacturer)
              </span>
            </label>
            <textarea
              style={styles.textarea}
              placeholder={
                "e.g.\nLong-range InGaAs sensing suits low-light targeting\nRugged housing rated for shock and vibration"
              }
              value={whyFits}
              onChange={(e) => handleWhyFitsChange(e.target.value)}
            />
          </div>

          <div style={styles.footerRow}>
            <span>{lineCount}/5 lines</span>
            <a style={{ color: "#9a9a95", textDecoration: "underline", cursor: "pointer" }} onClick={resetForm}>
              ↺ Reset form
            </a>
          </div>

          <button style={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            Submit for review
          </button>
          {status.text && (
            <div
              style={{
                ...styles.statusMsg,
                color: status.ok === true ? "#3fcf8e" : status.ok === false ? "#e05a5a" : "#9a9a95"
              }}
            >
              {status.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
