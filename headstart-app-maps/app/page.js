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

function SearchSelect({ label, placeholder, fetchUrl, value, onSelect, renderLabel, allowCustom, onCustom }) {
  const [query, setQuery] = useState(value ? renderLabel(value) : "");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const debouncedQuery = useDebounced(query, 250);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    fetch(`${fetchUrl}?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((d) => setOptions(d.results || []))
      .catch(() => setOptions([]));
  }, [debouncedQuery, open, fetchUrl]);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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
          if (allowCustom) onCustom(null);
        }}
        style={inputStyle}
      />
      {open && (options.length > 0 || (allowCustom && query.trim())) && (
        <div style={dropdownStyle}>
          {options.map((opt) => (
            <div
              key={opt.id}
              onClick={() => {
                onSelect(opt);
                setQuery(renderLabel(opt));
                setOpen(false);
              }}
              style={dropdownItemStyle}
            >
              {renderLabel(opt)}
            </div>
          ))}
          {allowCustom && query.trim() && (
            <div
              onClick={() => {
                onSelect(null);
                onCustom(query.trim());
                setOpen(false);
              }}
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
  fontSize: 12,
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
  fontSize: 14,
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
  fontSize: 13,
  color: "#ddd",
  cursor: "pointer",
  borderBottom: "1px solid #2c2c2c",
};

function StatusPill({ live }) {
  return (
    <span
      style={{
        background: live ? "#1e3a2c" : "#3a2f1a",
        color: live ? "#5fd48a" : "#e0a840",
        fontSize: 10.5,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 20,
        flexShrink: 0,
        marginLeft: 10,
      }}
    >
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
  const [submittedBy, setSubmittedBy] = useState("");
  const [alreadyMapped, setAlreadyMapped] = useState({ live: [], pending: [] });
  const [status, setStatus] = useState("idle");

  useEffect(() => {
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
    if (!manufacturer || !keyProduct || !hasUsedIn || !whyThisFits || !submittedBy) {
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
          submittedBy,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      setKeyProduct("");
      setUsedIn(null);
      setProposedNewArea(null);
      setWhyThisFits("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "40px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 640,
          background: "#1E1E1E",
          border: "1px solid #2c2c2c",
          borderRadius: 14,
          overflow: "hidden",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            background: "#141414",
            padding: "20px 28px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            borderBottom: "1px solid #2c2c2c",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: "0.02em" }}>
            ASTUTE
          </span>
          <div style={{ width: 3, height: 22, background: orange }} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>
            HEADSTART APPLICATION MAPS
          </span>
        </div>

        <div style={{ padding: "22px 28px 8px" }}>
          <SearchSelect
            label="Manufacturer"
            placeholder="Search existing manufacturers..."
            fetchUrl="/api/manufacturers"
            value={manufacturer}
            onSelect={setManufacturer}
            renderLabel={(o) => o.name}
          />

          {manufacturer && (
            <>
              <p style={{ color: "#8a8a8a", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 10px" }}>
                Already mapped for {manufacturer.name} &middot; 5 most recent
              </p>
              <div style={{ background: "#181818", border: "1px solid #2c2c2c", borderRadius: 9, marginBottom: 20, overflow: "hidden" }}>
                <div style={{ maxHeight: 210, overflowY: "auto", padding: "4px 6px 4px 16px" }}>
                  {rows.length === 0 && (
                    <p style={{ color: "#5a5a5a", fontSize: 12.5, padding: "12px 0" }}>Nothing mapped for this manufacturer yet.</p>
                  )}
                  {rows.map((r, i) => (
                    <div
                      key={r.key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 8px 10px 0",
                        borderBottom: i < rows.length - 1 ? "1px solid #262626" : "none",
                      }}
                    >
                      <div>
                        <p style={{ color: "#fff", fontSize: 13, margin: 0 }}>{r.title}</p>
                        <p style={{ color: "#6b6b6b", fontSize: 11.5, margin: "2px 0 0" }}>{r.subtitle}</p>
                      </div>
                      <StatusPill live={r.live} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <p style={{ color: "#8a8a8a", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 14px", borderTop: "1px solid #262626", paddingTop: 18 }}>
            Add a new one
          </p>

          <label style={labelStyle}>Key product</label>
          <input
            type="text"
            placeholder="Type the product name..."
            value={keyProduct}
            onChange={(e) => setKeyProduct(e.target.value)}
            style={{ ...inputStyle, marginBottom: 20 }}
          />

          <SearchSelect
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
            <p style={{ color: orange, fontSize: 11.5, margin: "-14px 0 20px" }}>
              Proposing new: &ldquo;{proposedNewArea}&rdquo; &mdash; goes to review before it's added to the list.
            </p>
          )}

          <label style={labelStyle}>
            Why this fits <span style={{ color: "#6b6b6b", textTransform: "none", fontWeight: 400 }}>(one point per line, max 5)</span>
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
            style={{ ...inputStyle, marginBottom: 20, resize: "vertical", minHeight: 110, lineHeight: 1.6, fontFamily: "inherit" }}
          />
          <p style={{ color: "#6b6b6b", fontSize: 11, margin: "-14px 0 20px" }}>
            {whyThisFits.split("\n").length}/5 lines
          </p>

          <label style={labelStyle}>Your name</label>
          <input
            type="text"
            placeholder="Full name"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            style={{ ...inputStyle, marginBottom: 24 }}
          />
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
              fontSize: 13.5,
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
            <p style={{ color: "#e0a840", fontSize: 12, marginTop: 10 }}>Fill in every field first.</p>
          )}
          {status === "done" && (
            <p style={{ color: "#5fd48a", fontSize: 12, marginTop: 10 }}>Submitted for review.</p>
          )}
          {status === "error" && (
            <p style={{ color: "#e05a5a", fontSize: 12, marginTop: 10 }}>Something went wrong. Try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}
