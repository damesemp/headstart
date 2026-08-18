"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useRef, useState } from "react";

const ACCENT = "#3EC2CF";
const INK = "#212120";

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
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 100,
    resize: "vertical",
    background: "#fff",
    border: "1px solid #d8d6cf",
    borderRadius: 8,
    color: INK,
    padding: "12px 14px",
    fontSize: 15,
    lineHeight: 1.5,
    fontFamily: "inherit",
  },
  checkboxRow: { display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: INK },
  list: { border: "1px solid #e4e2dc", borderRadius: 10, overflow: "hidden", marginBottom: 24 },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: "13px 14px",
    borderBottom: "1px solid #e4e2dc",
    background: "#fafaf8",
  },
  empty: { padding: "14px", color: "#8a8880", fontSize: 13, background: "#fafaf8" },
  editButton: {
    border: "1px solid #b9ecf1",
    borderRadius: 999,
    padding: "7px 13px",
    background: "#e6f8fa",
    color: "#0d5158",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  buttonRow: { display: "flex", gap: 10 },
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

export default function VideosTab({ types }) {
  const sortedTypes = useMemo(
    () => [...types].sort((a, b) => a.name.localeCompare(b.name)),
    [types]
  );
  const [typeId, setTypeId] = useState("");
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [internalOnly, setInternalOnly] = useState(false);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({ text: "", ok: null });
  const fileInputRef = useRef(null);

  function resetEditor() {
    setEditingId(null);
    setExistingFileUrl("");
    setTitle("");
    setDescription("");
    setInternalOnly(false);
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    setEditingId(null);
    setExistingFileUrl("");
    setTitle("");
    setDescription("");
    setInternalOnly(false);
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus({ text: "", ok: null });
  }, [typeId]);

  useEffect(() => {
    if (!typeId) {
      setVideos([]);
      return;
    }

    let ignore = false;
    setLoadingVideos(true);
    fetch(`/api/videos?typeId=${encodeURIComponent(typeId)}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load videos");
        return response.json();
      })
      .then((data) => {
        if (!ignore) setVideos(data.videos || []);
      })
      .catch(() => {
        if (!ignore) setStatus({ text: "Couldn't load videos for this Type.", ok: false });
      })
      .finally(() => {
        if (!ignore) setLoadingVideos(false);
      });

    return () => {
      ignore = true;
    };
  }, [typeId, refreshSignal]);

  function editVideo(video) {
    setEditingId(video.id);
    setExistingFileUrl(video.fileUrl);
    setTitle(video.title);
    setDescription(video.description);
    setInternalOnly(video.internalOnly);
    setFile(null);
    setProgress(0);
    setStatus({ text: "Editing existing video.", ok: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!typeId || !title.trim() || (!file && !existingFileUrl)) {
      setStatus({ text: "Choose a Type and add a title and MP4 file.", ok: false });
      return;
    }
    if (file && (!file.name.toLowerCase().endsWith(".mp4") || (file.type && file.type !== "video/mp4"))) {
      setStatus({ text: "Choose an MP4 video file.", ok: false });
      return;
    }

    setSaving(true);
    setProgress(0);
    try {
      let fileUrl = existingFileUrl;
      if (file) {
        setStatus({ text: "Uploading video to Vercel Blob...", ok: null });
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
        const blob = await upload(`headstart-videos/${Date.now()}-${safeName}`, file, {
          access: "public",
          contentType: "video/mp4",
          handleUploadUrl: "/api/videos/upload",
          multipart: file.size > 10 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        fileUrl = blob.url;
      }

      setStatus({ text: "Saving video details to Airtable...", ok: null });
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          typeId,
          title: title.trim(),
          description: description.trim(),
          fileUrl,
          internalOnly,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn't save the video.");

      resetEditor();
      setStatus({ text: "Video saved. The Engine will read it from Airtable.", ok: true });
      setRefreshSignal((signal) => signal + 1);
    } catch (error) {
      setStatus({ text: error.message || "Couldn't save the video.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p style={styles.intro}>
        Upload an introduction video to Vercel Blob and link it to a Type. Existing videos can be edited or replaced.
      </p>

      <div style={styles.field}>
        <label htmlFor="video-type" style={styles.label}>Type</label>
        <select id="video-type" style={styles.input} value={typeId} onChange={(event) => setTypeId(event.target.value)}>
          <option value="">Select Type</option>
          {sortedTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </div>

      {typeId && (
        <div style={styles.list} aria-label="Existing videos">
          {loadingVideos ? (
            <div style={styles.empty}>Loading existing videos...</div>
          ) : videos.length ? (
            videos.map((video, index) => (
              <div key={video.id} style={{ ...styles.listRow, borderBottom: index === videos.length - 1 ? "none" : styles.listRow.borderBottom }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{video.title}</div>
                  <div style={{ fontSize: 12, color: video.internalOnly ? "#7a5108" : "#0f6e56", marginTop: 3 }}>
                    {video.internalOnly ? "Internal only" : "Visible in Engine"}
                  </div>
                </div>
                <button type="button" style={styles.editButton} onClick={() => editVideo(video)}>Edit / replace</button>
              </div>
            ))
          ) : (
            <div style={styles.empty}>No videos linked to this Type yet.</div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={styles.field}>
          <label htmlFor="video-title" style={styles.label}>Title</label>
          <input id="video-title" style={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} disabled={!typeId || saving} />
        </div>
        <div style={styles.field}>
          <label htmlFor="video-description" style={styles.label}>Description</label>
          <textarea id="video-description" style={styles.textarea} value={description} onChange={(event) => setDescription(event.target.value)} disabled={!typeId || saving} />
        </div>
        <div style={styles.field}>
          <label htmlFor="video-file" style={styles.label}>{editingId ? "Replace MP4 (optional)" : "MP4 file"}</label>
          <input
            id="video-file"
            ref={fileInputRef}
            style={styles.input}
            type="file"
            accept="video/mp4,.mp4"
            disabled={!typeId || saving}
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          {editingId && !file && <div style={{ fontSize: 12, color: "#8a8880", marginTop: 6 }}>Current Blob file will be kept.</div>}
        </div>
        <div style={styles.field}>
          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={internalOnly} disabled={!typeId || saving} onChange={(event) => setInternalOnly(event.target.checked)} />
            Internal Only — do not show this video in the Engine
          </label>
        </div>
        <div style={styles.buttonRow}>
          {editingId && <button type="button" style={styles.secondaryButton} onClick={resetEditor} disabled={saving}>New video</button>}
          <button type="submit" style={{ ...styles.submitButton, opacity: !typeId || saving ? 0.55 : 1 }} disabled={!typeId || saving}>
            {saving ? (progress > 0 && progress < 100 ? `Uploading ${progress}%` : "Saving...") : editingId ? "Save changes" : "Upload video"}
          </button>
        </div>
      </form>

      <div style={{ ...styles.status, color: status.ok === true ? "#0f6e56" : status.ok === false ? "#a32d2d" : ACCENT }} role="status">
        {status.text}
      </div>
    </>
  );
}
