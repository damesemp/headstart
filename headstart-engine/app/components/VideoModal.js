"use client";

import { useEffect } from "react";

export default function VideoModal({ video, onClose }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="hs-vm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hs-video-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="hs-vm-card">
        <div className="hs-vm-frame">
          <video src={video.fileUrl} controls autoPlay playsInline />
        </div>
        <div className="hs-vm-body">
          <div className="hs-vm-eyebrow">Introduction Video</div>
          <div className="hs-vm-title" id="hs-video-title">{video.title}</div>
          {video.description && <div className="hs-vm-sub">{video.description}</div>}
          <button type="button" className="hs-vm-back" onClick={onClose}>
            ‹ Back to Directory
          </button>
        </div>
      </div>
    </div>
  );
}
