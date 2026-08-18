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
const ZoomPanStage = forwardRef(function ZoomPanStage(
  { scale, tx, ty, onChange, onReset, min = 1, max = 4, step = 0.25, children, className },
  frameRef
) {
  const dragState = useRef(null);
  const [dragging, setDragging] = useState(false);

  function clampScale(s) {
    return Math.min(max, Math.max(min, s));
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
    onChange({ scale, tx: dragState.current.tx + dx, ty: dragState.current.ty + dy });
  }

  function endDrag() {
    dragState.current = null;
    setDragging(false);
  }

  function zoomBy(delta) {
    onChange({ scale: clampScale(Math.round((scale + delta) * 100) / 100), tx, ty });
  }

  function reset() {
    onChange({ scale: 1, tx: 0, ty: 0 });
    if (onReset) onReset();
  }

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
        <button type="button" className="hs-zoomstage-btn" title="Zoom out" onClick={() => zoomBy(-step)}>
          −
        </button>
        <span className="hs-zoomstage-pct">{Math.round(scale * 100)}%</span>
        <button type="button" className="hs-zoomstage-btn" title="Zoom in" onClick={() => zoomBy(step)}>
          +
        </button>
        <button type="button" className="hs-zoomstage-reset" title="Reset view" onClick={reset}>
          Reset
        </button>
      </div>
      <div
        ref={frameRef}
        className="hs-zoomstage-frame"
        style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
});

export default ZoomPanStage;
