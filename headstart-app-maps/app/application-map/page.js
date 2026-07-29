"use client";

import { useState, useMemo, useEffect } from "react";

const ACCENT = "#3EC2CF";
const ACCENT_DARK = "#0d838d";
const INK = "#212120";
const PAGE_BG = "#f4f3f0";

const styles = {
  page: { background: PAGE_BG, padding: "40px 16px", minHeight: "100vh" },
  card: {
    maxWidth: 640,
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e4e2dc",
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
  divider: { width: 2, height: 22, background: ACCENT },
  title: {
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 1,
    color: "#fff",
    textTransform: "uppercase"
  },
  body: { padding: "26px 28px 30px", color: INK },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: INK,
    marginBottom: 8
  },
  hint: {
    textTransform: "none",
    fontWeight: 400,
    color: "#8a8880",
    letterSpacing: 0,
    fontSize: 12
  },
  field: { marginBottom: 20 },
  input: {
    width: "100%",
    background: "#fff",
    border: "1px solid #d8d6cf",
    borderRadius: 8,
    color: INK,
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none"
  },
  textarea: {
    width: "100%",
    background: "#fff",
    border: "1px solid #d8d6cf",
    borderRadius: 8,
    color: INK,
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
    background: "#e6f8fa",
    color: "#0d5158",
    border: "1px solid #b9ecf1",
    padding: "6px 10px 6px 12px",
    borderRadius: 999,
    fontSize: 13
  },
  tagBtn: {
    background: "none",
    border: "none",
    color: "#0d5158",
    cursor: "pointer",
    fontSize: 15,
    lineHeight: 1,
    padding: 0
  },
  dropdown: {
    border: "1px solid #d8d6cf",
    borderRadius: 8,
    marginTop: 6,
    maxHeight: 170,
    overflowY: "auto",
    background: "#fff"
  },
  opt: { padding: "10px 14px", fontSize: 14, cursor: "pointer" },
  empty: { padding: "10px 14px", fontSize: 13, color: "#8a8880" },
  dividerLine: { border: "none", borderTop: "1px solid #e4e2dc", margin: "26px 0" },
  sectionLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: ACCENT,
    flexShrink: 0
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: INK
  },
  sectionUnderline: {
    border: "none",
    borderTop: "1px solid #e4e2dc",
    margin: "0 0 14px"
  },
  mappedBox: {
    border: "1px solid #e4e2dc",
    borderRadius: 10,
    background: "#fafaf8",
    maxHeight: 180,
    overflowY: "auto",
    marginBottom: 22
  },
  mappedRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid #e4e2dc"
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
    color: "#8a8880",
    marginBottom: 16
  },
  buttonRow: {
    display: "flex",
    gap: 10
  },
  resetBtn: {
    flex: "0 0 auto",
    background: "#fff",
    border: "1px solid #d8d6cf",
    color: INK,
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 0.6,
    padding: "15px 22px",
    borderRadius: 999,
    cursor: "pointer",
    textTransform: "uppercase"
  },
  dataFreshness: {
    fontSize: 12,
    color: "#8a8880",
    textAlign: "right",
    padding: "10px 28px 0"
  },
  submitBtn: {
    flex: 1,
    background: "#000",
    border: "1px solid #000",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 0.6,
    padding: 15,
    borderRadius: 999,
    cursor: "pointer",
    textTransform: "uppercase"
  },
  statusMsg: { textAlign: "center", fontSize: 13, marginTop: 14, minHeight: 18 },
  confirmOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(33,33,32,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderRadius: 16
  },
  confirmBox: {
    background: "#fff",
    borderRadius: 12,
    padding: "20px 24px",
    maxWidth: 320,
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)"
  },
  confirmActions: {
    display: "flex",
    gap: 10,
    marginTop: 16,
    justifyContent: "center"
  },
  confirmBtnDanger: {
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer"
  },
  confirmBtnCancel: {
    background: "#fff",
    color: INK,
    border: "1px solid #d8d6cf",
    borderRadius: 999,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  }
};

function badgeStyle(status) {
  if (status === "Promoted") return { background: "#e1f5ee", color: "#085041" };
  if (status === "Rejected") return { background: "#faecea", color: "#8a2c22" };
  return { background: "#faf1de", color: "#7a5108" };
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
  const [refData, setRefData] = useState(null);
  const [refError, setRefError] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  const [industry, setIndustry] = useState(null);
  const [segment, setSegment] = useState(null);

  useEffect(() => {
    fetch("/api/reference-data", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load reference data");
        return res.json();
      })
      .then((data) => {
        setRefData(data);
        setLastLoadedAt(new Date());
        const firstIndustry = data.industries[0] || null;
        setIndustry(firstIndustry);
        setSegment((data.segments[firstIndustry] || [])[0] || null);
      })
      .catch((err) => setRefError(err.message));
  }, []);

  const segments = refData ? refData.segments[industry] || [] : [];

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
  const [confirmingReset, setConfirmingReset] = useState(false);

  const typeOptions = useMemo(
    () =>
      refData
        ? refData.types
            .filter((t) => t.segment === segment)
            .map((t) => ({ id: t.id, label: t.name }))
        : [],
    [refData, segment]
  );

  const areaOptions = useMemo(
    () =>
      refData
        ? refData.applicationAreas
            .filter((a) => a.segment === segment)
            .filter((a) => typeIds.length === 0 || a.relevantTypes.some((t) => typeIds.includes(t)))
            .map((a) => ({ id: a.id, label: a.label }))
        : [],
    [refData, segment, typeIds]
  );

  const mfrMatches = refData
    ? refData.manufacturers.filter((m) => m.name.toLowerCase().includes(mfrQuery.toLowerCase()))
    : [];

  const currentMfr = refData ? refData.manufacturers.find((m) => m.name === manufacturer) : null;
  const productMatches = currentMfr
    ? currentMfr.products.filter((p) => p.toLowerCase().includes(productQuery.toLowerCase()))
    : [];

  function handleIndustryChange(value) {
    setIndustry(value);
    const segs = (refData && refData.segments[value]) || [];
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

  const defaultIndustry = (refData && refData.industries[0]) || null;
  const defaultSegment =
    (refData && (refData.segments[defaultIndustry] || [])[0]) || null;

  const hasUnsavedInput =
    !!manufacturer ||
    !!productQuery.trim() ||
    typeIds.length > 0 ||
    areaIds.length > 0 ||
    !!whyFits.trim() ||
    industry !== defaultIndustry ||
    segment !== defaultSegment;

  function performReset() {
    const firstIndustry = (refData && refData.industries[0]) || null;
    setIndustry(firstIndustry);
    setSegment((refData && (refData.segments[firstIndustry] || [])[0]) || null);
    setManufacturer(null);
    setMfrQuery("");
    setProductQuery("");
    setMapped([]);
    setTypeIds([]);
    setAreaIds([]);
    setWhyFits("");
    setStatus({ text: "", ok: null });
    setConfirmingReset(false);
  }

  function handleResetClick() {
    if (hasUnsavedInput) {
      setConfirmingReset(true);
    } else {
      performReset();
    }
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
      performReset();
    } catch {
      setStatus({ text: "Couldn't submit. Try again.", ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  if (refError) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, maxWidth: 640, margin: "0 auto", padding: "2rem" }}>
          <p style={{ color: "#a32d2d", fontSize: 14 }}>
            Couldn&apos;t load form data. Refresh the page to try again.
          </p>
        </div>
      </div>
    );
  }

  if (!refData) {
    return (
      <div style={styles.page}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", padding: "4rem 0", color: "#8a8880" }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
        {lastLoadedAt && (
          <p style={{ fontSize: 12, color: "#8a8880", textAlign: "right", margin: "0 4px 8px" }}>
            Data loaded at{" "}
            {lastLoadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
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
                value={industry || ""}
                onChange={(e) => handleIndustryChange(e.target.value)}
              >
                {refData.industries.map((i) => (
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

            <div style={styles.sectionLabelRow}>
              <span style={styles.sectionDot}></span>
              <span style={styles.sectionLabel}>Manufacturer</span>
            </div>
            <hr style={styles.sectionUnderline} />

            <div style={styles.field}>
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
                <div style={styles.sectionLabelRow}>
                  <span style={styles.sectionDot}></span>
                  <span style={styles.sectionLabel}>Already mapped for {manufacturer}</span>
                </div>
                <hr style={styles.sectionUnderline} />
                <div style={styles.mappedBox}>
                  {mappedLoading ? (
                    <div style={styles.mappedRow}>
                      <span style={{ color: "#8a8880", fontSize: 13 }}>Loading...</span>
                    </div>
                  ) : mapped.length ? (
                    mapped.map((r, i) => (
                      <div style={styles.mappedRow} key={i}>
                        <div>
                          <div style={{ fontSize: 15 }}>{r.product}</div>
                          <div style={{ fontSize: 12, color: "#8a8880", marginTop: 2 }}>{r.status}</div>
                        </div>
                        <span style={{ ...styles.badge, ...badgeStyle(r.status) }}>{r.status}</span>
                      </div>
                    ))
                  ) : (
                    <div style={styles.mappedRow}>
                      <span style={{ color: "#8a8880", fontSize: 13 }}>
                        Nothing mapped for this manufacturer yet.
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={styles.sectionLabelRow}>
              <span style={styles.sectionDot}></span>
              <span style={styles.sectionLabel}>Add a new one</span>
            </div>
            <hr style={styles.sectionUnderline} />

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
                    <div style={styles.empty}>No matches. Type to add new.</div>
                  )}
                </div>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Why this fits{" "}
                <span style={styles.hint}>
                  (one per line, max 5. specific to this product, not the manufacturer)
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
            </div>

            <div style={styles.buttonRow}>
              <button style={styles.resetBtn} onClick={handleResetClick}>
                Reset
              </button>
              <button style={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                Submit for review
              </button>
            </div>
            {status.text && (
              <div
                style={{
                  ...styles.statusMsg,
                  color: status.ok === true ? "#0f6e56" : status.ok === false ? "#a32d2d" : "#5b5952"
                }}
              >
                {status.text}
              </div>
            )}
          </div>
        </div>

        {confirmingReset && (
          <div style={styles.confirmOverlay}>
            <div style={styles.confirmBox}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: INK }}>
                Clear this form?
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8a8880" }}>
                Everything you've entered will be lost.
              </p>
              <div style={styles.confirmActions}>
                <button style={styles.confirmBtnCancel} onClick={() => setConfirmingReset(false)}>
                  Cancel
                </button>
                <button style={styles.confirmBtnDanger} onClick={performReset}>
                  Clear form
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
