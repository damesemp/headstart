"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useRef, useState } from "react";

const ACCENT = "#3EC2CF";
const INK = "#212120";

// Manufacturer Links tab — 5 Oct 2026. Website, Featured Link, and the PDF
// line card have been readable on the Engine's manufacturer cards since the
// Round 5 build, but every one of the 157 manufacturers has had empty data
// the whole time: there was no editor. This is that editor. No logo field —
// dropped by decision (Damian, 5 Oct 2026); manufacturer cards stay
// text-only, so there is nothing to upload for it.
const styles = {
  intro: { fontSize: 13, color: "#5b5952", margin: "0 0 22px", lineHeight: 1.5 },
  field: { marginBottom: 20 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: INK,
    marginBottom: 8,
  },
  hint: { textTransform: "none", fontWeight: 400, color: "#8a8880", letterSpacing: 0, fontSize: 12 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
    border: "1px solid #d8d6cf",
    borderRadius: 8,
    color: INK,
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "inherit",
  },
  readonlyInput: {
    width: "100%",
    boxSizing: "border-box",
    background: "#f4f3f0",
    border: "1px solid #e4e2dc",
    borderRadius: 8,
    color: "#5b5952",
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "inherit",
  },
  dropdown: {
    border: "1px solid #d8d6cf",
    borderRadius: 8,
    marginTop: 6,
    maxHeight: 220,
    overflowY: "auto",
    background: "#fff",
  },
  opt: { padding: "10px 14px", fontSize: 14, cursor: "pointer" },
  empty: { padding: "10px 14px", fontSize: 13, color: "#8a8880" },
  panel: {
    border: "1px solid #e4e2dc",
    borderRadius: 10,
    background: "#fafaf8",
    padding: "18px 18px 4px",
    marginTop: 20,
  },
  panelTitle: { fontSize: 16, fontWeight: 700, color: INK, marginBottom: 4 },
  panelMeta: { fontSize: 12, color: "#8a8880", marginBottom: 18 },
  pdfRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  pdfLink: { fontSize: 13, color: "#0d5158", textDecoration: "underline" },
  buttonRow: { display: "flex", gap: 10, marginTop: 4, marginBottom: 20 },
  secondaryButton: {
    border: "1px solid #d8d6cf",
    borderRadius: 999,
    padding: "13px 20px",
    background: "#fff",
    color: INK,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textTransform: "uppercase",
  },
  submitButton: {
    flex: 1,
    border: "1px solid #000",
    borderRadius: 999,
    padding: 13,
    background: "#000",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textTransform: "uppercase",
  },
  status: { minHeight: 18, marginTop: 14, textAlign: "center", fontSize: 13 },
};

export default function ManufacturerLinksTab() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState(null); // manufacturer shape from the API
  const [featuredLinkUrl, setFeaturedLinkUrl] = useState("");
  const [featuredLinkLabel, setFeaturedLinkLabel] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({ text: "", ok: null });
  const fileInputRef = useRef(null);
  const searchRequestRef = useRef(0);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let ignore = false;
    const requestId = ++searchRequestRef.current;
    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/manufacturer-links?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (ignore || requestId !== searchRequestRef.current) return;
          setResults(data.results || []);
        })
        .catch(() => {
          if (ignore || requestId !== searchRequestRef.current) return;
          setResults([]);
        })
        .finally(() => {
          if (!ignore && requestId === searchRequestRef.current) setSearching(false);
        });
    }, 250);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query]);

  function selectManufacturer(manufacturer) {
    setSelected(manufacturer);
    setQuery(manufacturer.name);
    setOpen(false);
    setFeaturedLinkUrl(manufacturer.featuredLinkUrl || "");
    setFeaturedLinkLabel(manufacturer.featuredLinkLabel || "");
    setPdfUrl(manufacturer.pdfUrl || "");
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus({ text: "", ok: null });
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
    setFeaturedLinkUrl("");
    setFeaturedLinkLabel("");
    setPdfUrl("");
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus({ text: "", ok: null });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selected) {
      setStatus({ text: "Select a manufacturer first.", ok: false });
      return;
    }
    if (file && (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf"))) {
      setStatus({ text: "Choose a PDF file.", ok: false });
      return;
    }

    setSaving(true);
    setProgress(0);
    try {
      let finalPdfUrl = pdfUrl;
      if (file) {
        setStatus({ text: "Uploading PDF to Vercel Blob...", ok: null });
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
        const blob = await upload(`Manufacturer PDFs/${Date.now()}-${safeName}`, file, {
          access: "public",
          contentType: "application/pdf",
          handleUploadUrl: "/api/manufacturer-links/upload",
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        finalPdfUrl = blob.url;
      }

      setStatus({ text: "Saving to Airtable...", ok: null });
      const response = await fetch("/api/manufacturer-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          featuredLinkUrl: featuredLinkUrl.trim(),
          featuredLinkLabel: featuredLinkLabel.trim(),
          pdfUrl: finalPdfUrl.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn't save the links.");

      setSelected(result.manufacturer);
      setPdfUrl(result.manufacturer.pdfUrl || "");
      setFile(null);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus({ text: "Saved. The Engine will read it from Airtable.", ok: true });
    } catch (error) {
      setStatus({ text: error.message || "Couldn't save the links.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p style={styles.intro}>
        Search a manufacturer to set its Featured Link and PDF line card. Website is set elsewhere and
        shown here read-only. There is no logo field — manufacturer cards stay text-only.
      </p>

      <div style={styles.field}>
        <label htmlFor="mfr-search" style={styles.label}>Manufacturer</label>
        <input
          id="mfr-search"
          style={styles.input}
          type="text"
          placeholder="Search manufacturer, e.g. 'SynQor'..."
          value={query}
          disabled={saving}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
            setOpen(true);
          }}
        />
        {open && query.trim() && !selected && (
          <div style={styles.dropdown}>
            {searching ? (
              <div style={styles.empty}>Searching...</div>
            ) : results.length ? (
              results.map((m) => (
                <div key={m.id} style={styles.opt} onClick={() => selectManufacturer(m)}>
                  {m.name}
                </div>
              ))
            ) : (
              <div style={styles.empty}>No matches</div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div style={styles.panel}>
          <div style={styles.panelTitle}>{selected.name}</div>
          <div style={styles.panelMeta}>
            Website:{" "}
            {selected.website ? (
              <span style={{ color: "#5b5952" }}>{selected.website}</span>
            ) : (
              <span>not set</span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label htmlFor="featured-url" style={styles.label}>
                Featured Link URL <span style={styles.hint}>(https only)</span>
              </label>
              <input
                id="featured-url"
                style={styles.input}
                placeholder="https://..."
                value={featuredLinkUrl}
                disabled={saving}
                onChange={(event) => setFeaturedLinkUrl(event.target.value)}
              />
            </div>
            <div style={styles.field}>
              <label htmlFor="featured-label" style={styles.label}>Featured Link Label</label>
              <input
                id="featured-label"
                style={styles.input}
                placeholder="e.g. New product launch"
                value={featuredLinkLabel}
                disabled={saving}
                onChange={(event) => setFeaturedLinkLabel(event.target.value)}
              />
            </div>
            <div style={styles.field}>
              <label htmlFor="pdf-file" style={styles.label}>{pdfUrl ? "Replace PDF line card" : "PDF line card"}</label>
              {pdfUrl && !file && (
                <div style={styles.pdfRow}>
                  <a href={pdfUrl} target="_blank" rel="noreferrer noopener" style={styles.pdfLink}>
                    Current PDF
                  </a>
                </div>
              )}
              <input
                id="pdf-file"
                ref={fileInputRef}
                style={styles.input}
                type="file"
                accept="application/pdf,.pdf"
                disabled={saving}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              {pdfUrl && !file && (
                <div style={{ fontSize: 12, color: "#8a8880", marginTop: 6 }}>Current PDF will be kept.</div>
              )}
            </div>

            <div style={styles.buttonRow}>
              <button type="button" style={styles.secondaryButton} onClick={clearSelection} disabled={saving}>
                Done
              </button>
              <button type="submit" style={{ ...styles.submitButton, opacity: saving ? 0.55 : 1 }} disabled={saving}>
                {saving ? (progress > 0 && progress < 100 ? `Uploading ${progress}%` : "Saving...") : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ ...styles.status, color: status.ok === true ? "#0f6e56" : status.ok === false ? "#a32d2d" : ACCENT }} role="status">
        {status.text}
      </div>
    </>
  );
}
