"use client";

import { useState, useEffect, useRef } from "react";

const orange = "#F58220";

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Key Product: type-ahead against manufacturer catalog + past submissions
function TextTypeahead({ label, placeholder, fetchUrl, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const debouncedQuery = useDebounced(value, 280);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open || disabled || !fetchUrl) return;
    fetch(`${fetchUrl}&q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((d) => setOptions(d.results || []))
      .catch(() => setOptions([]));
  }, [debouncedQuery, open, fetchUrl, disabled]);

  useEffect(() => {
    function handler(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ marginBottom: 20, position: "relative" }} ref={boxRef}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        style={{ ...inputStyle, opacity: disabled ? 0.45 : 1 }}
      />
      {open && !disabled && options.length > 0 && (
        <div style={dropdownStyle}>
          {options.map((opt, i) => (
            <div
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={dropdownItemStyle}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Generic search-select with optional "propose new" escape hatch
function SearchSelect({ label, placeholder, fetchUrl, value, onSelect, renderLabel, allowCustom, onCustom, highlightBorder, resetKey }) {
  const [query, setQuery] = useState(value ? renderLabel(value) : "");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const debouncedQuery = useDebounced(query, 280);
  const boxRef = useRef(null);

  // Sync back when parent clears value externally
  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  useEffect(() => {
    if (!open) return;
    fetch(`${fetchUrl}?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((d) => setOptions(d.results || []))
      .catch(() => setOptions([]));
  }, [debouncedQuery, open, fetchUrl]);

  useEffect(() => {
    function handler(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exactMatch = options.some(
    (opt) => renderLabel(opt).trim().toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <div style={{ marginBottom: 20, position: "relative" }} ref={boxRef}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (allowCustom && onCustom) onCustom(null);
        }}
        style={{
          ...inputStyle,
          ...(highlightBorder ? { border: `1.5px solid ${orange}` } : {}),
        }}
      />
      {open && (options.length > 0 || (allowCustom && query.trim() && !exactMatch)) && (
        <div style={dropdownStyle}>
          {options.map((opt) => (
            <div
              key={opt.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(opt); setQuery(renderLabel(opt)); setOpen(false); }}
              style={dropdownItemStyle}
            >
              {renderLabel(opt)}
            </div>
          ))}
          {allowCustom && query.trim() && !exactMatch && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(null); onCustom(query.trim()); setOpen(false); }}
              style={{ ...dropdownItemStyle, color: orange, borderBottom: "none" }}
            >
              Propose a new application area: &ldquo;{query.trim()}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  color: "#e8e8e8",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  background: "#232323",
  color: "#fff",
  border: "1px solid #3a3a3a",
  borderRadius: 7,
  padding: "11px 12px",
  fontSize: 15.5,
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const dropdownStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  background: "#232323",
  border: "1px solid #3a3a3a",
  borderRadius: 7,
  marginTop: 4,
  zIndex: 10,
  maxHeight: 220,
  overflowY: "auto",
};

const dropdownItemStyle = {
  padding: "9px 12px",
  fontSize: 14.5,
  color: "#ddd",
  cursor: "pointer",
  borderBottom: "1px solid #2c2c2c",
};

function StatusPill({ live }) {
  return (
    <span style={{
      background: live ? "#1e3a2c" : "#3a2f1a",
      color: live ? "#5fd48a" : "#e0a840",
      fontSize: 11.5,
      fontWeight: 700,
      padding: "3px 9px",
      borderRadius: 20,
      flexShrink: 0,
      marginLeft: 10,
    }}>
      {live ? "LIVE" : "PENDING"}
    </span>
  );
}

export default function Page() {
  const [manufacturer, setManufacturer] = useState(null);
  const [keyProduct, setKeyProduct] = useState("");
  const [usedIn, setUsedIn] = useState(null);
  const [proposedNewArea, setProposedNewArea] = useState(null);
  const [whyThisFits, setWhyThisFits] = useState("");
  const [alreadyMapped, setAlreadyMapped] = useState({ live: [], pending: [] });
  const [status, setStatus] = useState("idle");

  // Reset form fields (not manufacturer)
  function resetForm() {
    setKeyProduct("");
    setUsedIn(null);
    setProposedNewArea(null);
    setWhyThisFits("");
    setStatus("idle");
  }

  // When manufacturer changes: reset all dependent fields
  useEffect(() => {
    setKeyProduct("");
    setUsedIn(null);
    setProposedNewArea(null);
    setWhyThisFits("");
    setStatus("idle");
    if (!manufacturer) {
      setAlreadyMapped({ live: [], pending: [] });
      return;
    }
    fetch(`/api/already-mapped?name=${encodeURIComponent(manufacturer.name)}`)
      .then((r) => r.json())
      .then(setAlreadyMapped)
      .catch(() => setAlreadyMapped({ live: [], pending: [] }));
  }, [manufacturer]);

  const rows = [
    ...alreadyMapped.live.map((r) => ({
      key: "live-" + r.id,
      title: r.applicationModel,
      subtitle: r.fitType,
      live: r.showInModel,
    })),
    ...alreadyMapped.pending.map((r) => ({
      key: "pending-" + r.id,
      title: r.keyProduct,
      subtitle: "Pending review",
      live: false,
    })),
  ];

  async function handleSubmit() {
    const hasUsedIn = usedIn || proposedNewArea;
    if (!manufacturer || !keyProduct || !hasUsedIn || !whyThisFits) {
      setStatus("missing");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manufacturerId: manufacturer.id,
          keyProduct,
          usedInId: usedIn ? usedIn.id : null,
          proposedNewArea,
          whyThisFits,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      resetForm();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      padding: "40px 16px",
      boxSizing: "border-box",
    }}>
      <div style={{
        width: 640,
        background: "#1E1E1E",
        border: "1px solid #2c2c2c",
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}>
        {/* Header */}
        <div style={{
          background: "#141414",
          padding: "22px 28px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderBottom: "1px solid #2c2c2c",
        }}>
          <svg viewBox="0 0 1965.95 389.23" style={{ height: 28, width: "auto", display: "block" }}>
            <path fill="#fff" d="m1672.76,31.86c-10.01,11-18.53,23.49-25.58,37.54l-97.31.02.08,318.91-84.42.02-.08-318.91-125.27.03.04,161.36c.01,49.84-5.19,83.95-22.25,104.52-32.14,37.91-78.77,53.61-146.12,53.63s-115.01-15.66-147.16-53.55c-17.62-21.11-21.75-55.22-21.76-104.51l-.04-161.36-125.01-.88-.79,319.82-84.46.02-.08-318.91-257.84.03c-42.49.01-62.69,15.2-62.68,50.91,0,28.18,17.63,42.26,51.3,42.25l100.93-.03c86.53-.02,124.37,28.66,124.39,109.88.02,81.77-44.02,116.4-136.27,116.42l-160.26.04-29.54-69.27,176.86-.04c43.5-.01,63.2-10.32,63.19-43.88,0-34.66-18.14-44.92-57.53-44.91l-88.99.02c-89.12.02-129.54-33.57-129.56-111.51-.02-84.5,44.02-119.13,136.23-119.15l560.91-.14.06,228.52c.02,68.77,20.23,97.45,88.09,97.43,67.35-.02,87.04-28.71,87.02-97.48l-.06-228.52,454.04-.11c-15.18,8.49-28.5,19.05-40.07,31.79Z"/>
            <path fill="#fff" d="m258.18.34l-86.45.02L0,389.23l94.06-.02,34.2-92.59,168.88-.04,35.77,92.57,91.2-.02L258.18.34Zm-103,226.96l56.43-149.46,59.09,149.43-115.51.03Z"/>
            <path fill="#fff" d="m1739.96,158.16l225.93-.06.02,67.68-226.44.06c.53,69.82,28.02,95.26,92.24,95.25l134.22-.03.02,67.68-137.83.03c-47.15.01-83.41-3.76-121.24-34.08-39.91-31.92-59.62-82.81-59.63-153.21-.01-56.5,9.77-100.55,30-132.85,15.39-24.72,36.9-42.57,64.79-53.82C1766.46,4.89,1795.73.04,1830.1.03l135.75-.03.02,67.68-134.22.03c-59.05.01-88.57,29.26-91.68,90.45Z"/>
          </svg>
          <div style={{ width: 3, height: 28, background: orange, flexShrink: 0 }} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 19 }}>
            HEADSTART APPLICATION MAPS
          </span>
        </div>

        <div style={{ padding: "22px 28px 8px" }}>

          {/* Manufacturer — orange border */}
          <SearchSelect
            label="Manufacturer"
            placeholder="Search existing manufacturers..."
            fetchUrl="/api/manufacturers"
            value={manufacturer}
            onSelect={setManufacturer}
            renderLabel={(o) => o.name}
            highlightBorder
          />

          {/* Already mapped panel — ~3 rows visible */}
          {manufacturer && (
            <>
              <p style={{ color: "#8a8a8a", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 10px" }}>
                Already mapped for {manufacturer.name}
              </p>
              <div style={{ background: "#181818", border: "1px solid #2c2c2c", borderRadius: 9, marginBottom: 20, overflow: "hidden" }}>
                <div style={{ maxHeight: 155, overflowY: "auto", padding: "4px 6px 4px 16px" }}>
                  {rows.length === 0 && (
                    <p style={{ color: "#5a5a5a", fontSize: 13, padding: "12px 0" }}>Nothing mapped for this manufacturer yet.</p>
                  )}
                  {rows.map((r, i) => (
                    <div key={r.key} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 8px 10px 0",
                      borderBottom: i < rows.length - 1 ? "1px solid #262626" : "none",
                    }}>
                      <div>
                        <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>{r.title}</p>
                        <p style={{ color: "#6b6b6b", fontSize: 12, margin: "2px 0 0" }}>{r.subtitle}</p>
                      </div>
                      <StatusPill live={r.live} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <p style={{ color: "#8a8a8a", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 14px", borderTop: "1px solid #262626", paddingTop: 18 }}>
            Add a new one
          </p>

          {/* Key Product — manufacturer-scoped type-ahead */}
          <TextTypeahead
            label="Key product"
            placeholder={manufacturer ? "Search or type a product name..." : "Select a manufacturer first"}
            fetchUrl={manufacturer ? `/api/key-products?manufacturerId=${manufacturer.id}` : ""}
            value={keyProduct}
            onChange={setKeyProduct}
            disabled={!manufacturer}
          />

          {/* Used In — reset when manufacturer changes via key prop */}
          <SearchSelect
            key={manufacturer?.id || "no-mfr"}
            label="Used in"
            placeholder="Type to search, e.g. 'radar' or 'defence naval'..."
            fetchUrl="/api/used-in"
            value={usedIn}
            onSelect={setUsedIn}
            renderLabel={(o) => o.path}
            allowCustom
            onCustom={setProposedNewArea}
          />
          {proposedNewArea && (
            <p style={{ color: orange, fontSize: 12.5, margin: "-14px 0 20px" }}>
              Proposing new: &ldquo;{proposedNewArea}&rdquo; &mdash; goes to review before it&apos;s added to the list.
            </p>
          )}

          {/* Why This Fits */}
          <label style={labelStyle}>
            Why this fits{" "}
            <span style={{ color: "#6b6b6b", textTransform: "none", fontWeight: 400 }}>
              (one per line, max 5 &mdash; specific to this product, not the manufacturer)
            </span>
          </label>
          <textarea
            rows={5}
            placeholder={"e.g.\nLong-range InGaAs sensing suits low-light targeting\nRugged housing rated for shock and vibration"}
            value={whyThisFits}
            onChange={(e) => {
              const lines = e.target.value.split("\n");
              if (lines.length <= 5) setWhyThisFits(e.target.value);
              else setWhyThisFits(lines.slice(0, 5).join("\n"));
            }}
            style={{ ...inputStyle, marginBottom: 8, resize: "vertical", minHeight: 110, lineHeight: 1.6, fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ color: "#6b6b6b", fontSize: 12 }}>
              {whyThisFits.split("\n").length}/5 lines
            </span>
            <button
              onClick={resetForm}
              style={{ background: "none", border: "none", color: "#6b6b6b", fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline" }}
            >
              ↺ Reset form
            </button>
          </div>

        </div>

        <div style={{ padding: "0 28px 26px" }}>
          <button
            onClick={handleSubmit}
            disabled={status === "submitting"}
            style={{
              width: "100%",
              background: "#232323",
              color: orange,
              border: `1.5px solid ${orange}`,
              borderRadius: 8,
              padding: 13,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {status === "submitting" ? "Submitting..." : "Submit for review"}
          </button>
          {status === "missing" && (
            <p style={{ color: "#e0a840", fontSize: 13, marginTop: 10 }}>Fill in every field first.</p>
          )}
          {status === "done" && (
            <p style={{ color: "#5fd48a", fontSize: 13, marginTop: 10 }}>Submitted for review. Add another above.</p>
          )}
          {status === "error" && (
            <p style={{ color: "#e05a5a", fontSize: 13, marginTop: 10 }}>Something went wrong. Try again.</p>
          )}
        </div>

      </div>
    </div>
  );
}
