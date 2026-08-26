"use client";

import { forwardRef, useRef, useState } from "react";

// Shared pan/zoom/drag mechanic for every application map (Wearables,
// Military Drones, Robotics & Automation, Embedded PC) — built once here so
// all four behave identically, per the nav rearchitecture spec Section 7.
//
// Controlled component: the parent owns { scale, tx, ty } and passes
// onChange; this only handles the drag/button interactions and reports the
// new value up. That lets a parent (HotspotMap) also drive the transform
// programmatically for "smart zoom to a clicked hotspot" using the same
// state, and lets Reset clear both the transform AND the parent's own
// selection state in one call.
//
// `frameRef` is forwarded onto the inner transformed element so a parent
// can measure its untransformed (layout) size — CSS transforms don't
// affect layout — which is what smart-zoom-to-a-point math needs.

// ---------------------------------------------------------------------------
// clampView — the rule that keeps the picture in the frame.
//
// Two faults this fixes, both reproduced in a browser on 26 Aug 2026:
//
//   1. The +/- buttons changed `scale` while leaving `tx`/`ty` alone. After a
//      smart zoom, tx was computed as -delta * scaleThen; changing the scale
//      without recomputing it slid whatever you had zoomed to off-centre by
//      delta * (scaleNow - scaleThen) — 87px on one step, and by the time you
//      reached 100% the image was 518px outside the frame and cropped. That
//      is the "zoom is broken" report: zoom out and the picture leaves.
//
//   2. Dragging had no bounds at all, so the picture could be pushed entirely
//      out of view with nothing but Reset to recover it.
//
// The transform is `translate(tx,ty) scale(s)` with the default centre
// transform-origin, so a point sitting `d` from the frame's centre renders at
// `s*d + t`. Everything below follows from that one equation.
//
// The bounds keep the transformed frame covering the visible stage: pan as far
// as the content allows and no further. Where the content is smaller than the
// stage in an axis (the whole image already fits), the only legal offset is
// the centred one, so that axis simply locks — which is exactly what "100%"
// should mean.
// ---------------------------------------------------------------------------
export function clampView(view, frameEl, min = 1, max = 4) {
  const scale = Math.min(max, Math.max(min, view.scale || 1));
  const stageEl = frameEl?.parentElement;
  if (!frameEl || !stageEl) return { scale, tx: view.tx || 0, ty: view.ty || 0 };

  const fw = frameEl.offsetWidth;
  const fh = frameEl.offsetHeight;
  const sw = stageEl.clientWidth;
  const sh = stageEl.clientHeight;
  if (!fw || !fh || !sw || !sh) return { scale, tx: view.tx || 0, ty: view.ty || 0 };

  const axis = (t, frameSize, stageSize) => {
    // Transformed edges: near = frameSize*(1-scale)/2 + t, far = near + frameSize*scale.
    const upper = (frameSize * (scale - 1)) / 2;              // near edge reaches 0
    const lower = stageSize - (frameSize * (1 + scale)) / 2;  // far edge reaches stageSize
    // Content smaller than the stage in this axis: there is nothing to reveal,
    // so the only legal offset is none at all. Returning 0 rather than a
    // computed "centred" offset matters — the Embedded PC grid is laid out
    // from the top of its stage, and forcing it to the middle would shift a
    // screen that is already signed off.
    if (lower > upper) return 0;
    return Math.min(upper, Math.max(lower, t || 0));
  };

  return { scale, tx: axis(view.tx, fw, sw), ty: axis(view.ty, fh, sh) };
}

const ZoomPanStage = forwardRef(function ZoomPanStage(
  { scale, tx, ty, onChange, onReset, min = 1, max = 4, step = 0.25, children, className },
  frameRef
) {
  const dragState = useRef(null);
  const localFrame = useRef(null);
  const [dragging, setDragging] = useState(false);

  // The forwarded ref belongs to the parent, so keep a local handle on the
  // same node — clamping needs to measure it on every interaction.
  function attachFrame(node) {
    localFrame.current = node;
    if (typeof frameRef === "function") frameRef(node);
    else if (frameRef) frameRef.current = node;
  }

  function emit(next) {
    onChange(clampView(next, localFrame.current, min, max));
  }

  function onPointerDown(e) {
    // Only the primary button/touch starts a drag, and not when the click
    // is on a control (hotspot dot, button) — those stopPropagation.
    dragState.current = { startX: e.clientX, startY: e.clientY, tx, ty };
    setDragging(true);
  }

  function onPointerMove(e) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    emit({ scale, tx: dragState.current.tx + dx, ty: dragState.current.ty + dy });
  }

  function endDrag() {
    dragState.current = null;
    setDragging(false);
  }

  // Zoom about the centre of the frame: the point currently in the middle
  // stays in the middle. That point sits at d = -t/scale, and holding it put
  // at the new scale means t' = -scale' * d = t * (scale'/scale).
  function zoomBy(delta) {
    const next = Math.min(max, Math.max(min, Math.round((scale + delta) * 100) / 100));
    if (next === scale) return;
    const k = next / scale;
    emit({ scale: next, tx: tx * k, ty: ty * k });
  }

  function reset() {
    onChange({ scale: 1, tx: 0, ty: 0 });
    if (onReset) onReset();
  }

  const atMin = scale <= min + 0.001;
  const atMax = scale >= max - 0.001;

  return (
    <div
      className={"hs-zoomstage" + (className ? " " + className : "")}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      style={{ cursor: dragging ? "grabbing" : "grab" }}
    >
      <div className="hs-zoomstage-controls" onMouseDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="hs-zoomstage-btn"
          title="Zoom out"
          disabled={atMin}
          onClick={() => zoomBy(-step)}
        >
          −
        </button>
        <span className="hs-zoomstage-pct">{Math.round(scale * 100)}%</span>
        <button
          type="button"
          className="hs-zoomstage-btn"
          title="Zoom in"
          disabled={atMax}
          onClick={() => zoomBy(step)}
        >
          +
        </button>
        <button type="button" className="hs-zoomstage-reset" title="Reset view" onClick={reset}>
          Reset
        </button>
      </div>
      <div
        ref={attachFrame}
        className="hs-zoomstage-frame"
        style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
});

export default ZoomPanStage;
