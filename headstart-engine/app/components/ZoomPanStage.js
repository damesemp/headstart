"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

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
//   3. The bounds were measured against the FRAME, not against the picture
//      inside it. The frame fills the stage; the picture is letterboxed within
//      it by object-fit: contain. For the Robotic Arm — portrait, so the
//      picture is exactly as tall as the frame — those two happen to coincide,
//      which is why the first version of this fix passed its tests. For the
//      drones — landscape, so the picture occupies a band across the middle
//      with white above and below — they do not. Vertical dragging moved the
//      band right out of view while the frame still technically "covered" the
//      stage. That is the drone sliding off the screen.
//
// The transform is `translate(tx,ty) scale(s)` with the default centre
// transform-origin. A point at layout position `p` inside a frame of size `f`
// renders at `(p - f/2) * s + f/2 + t`. Every bound below is that equation
// solved for the content's leading and trailing edges.
//
// `content` is the picture's rect in the frame's own layout coordinates. Pass
// it wherever the visible thing is smaller than its frame; omit it and the
// frame itself is treated as the content, which is right for the Embedded PC
// grid.
// ---------------------------------------------------------------------------
export function clampView(view, frameEl, options = {}) {
  const { min = 1, max = 4, content = null } = options;
  const scale = Math.min(max, Math.max(min, view.scale || 1));
  const stageEl = frameEl?.parentElement;
  if (!frameEl || !stageEl) return { scale, tx: view.tx || 0, ty: view.ty || 0 };

  const fw = frameEl.offsetWidth;
  const fh = frameEl.offsetHeight;
  const sw = stageEl.clientWidth;
  const sh = stageEl.clientHeight;
  if (!fw || !fh || !sw || !sh) return { scale, tx: view.tx || 0, ty: view.ty || 0 };

  // Default: the content is the whole frame.
  const cx = content && content.w ? content.x : 0;
  const cy = content && content.h ? content.y : 0;
  const cw = content && content.w ? content.w : fw;
  const ch = content && content.h ? content.h : fh;

  // At 100% the view is the canonical fit — the whole picture, centred — so
  // both axes lock. Panning is something you do once you have zoomed in.
  // This also keeps the Embedded PC grid exactly where it lays out.
  if (scale <= min + 0.001) return { scale, tx: 0, ty: 0 };

  // Two different things can be panned here and they want different rules.
  //
  // A PICTURE (a `content` rect was supplied): the middle of the view must
  // always be somewhere on the picture. You can bring any part of it to the
  // centre — which is what zooming to a hotspot needs — and you can never pan
  // it away and be left looking at nothing. Background showing at the edges is
  // not a fault: the map background is white and the pictures are cutouts on
  // white, so it is invisible. The stricter "never show background" rule was
  // tried and made it impossible to centre a hotspot near the edge of a
  // portrait picture — a real cost for no visible benefit.
  //
  // A LAID-OUT PANEL (no `content` rect — the Embedded PC grid): it is not a
  // picture floating in a frame, it is content laid out from the top of its
  // stage. Panning may only reveal what overflows. Where it does not overflow
  // there is nothing to reveal, so the axis stays put. Applying the picture
  // rule here would have yanked the grid 105px down the moment it was dragged.
  const isPicture = !!(content && content.w && content.h);

  const axis = (t, frameSize, stageSize, near, size) => {
    const shift = (frameSize * (scale - 1)) / 2;
    if (isPicture) {
      const mid = stageSize / 2;
      const hi = mid + shift - near * scale;          // leading edge at the centre of the view
      const lo = mid + shift - (near + size) * scale; // trailing edge at the centre of the view
      return Math.min(hi, Math.max(lo, t || 0));
    }
    const atStart = shift - near * scale;                          // leading edge at the stage start
    const atEnd = stageSize + shift - (near + size) * scale;       // trailing edge at the stage end
    if (atEnd > atStart) return 0;                                 // nothing overflows: nothing to reveal
    return Math.min(atStart, Math.max(atEnd, t || 0));
  };

  return {
    scale,
    tx: axis(view.tx, fw, sw, cx, cw),
    ty: axis(view.ty, fh, sh, cy, ch),
  };
}

// How far the pointer must travel before a press counts as a drag rather than
// a click. Small enough to feel immediate, large enough that a hand resting on
// a trackpad does not shift the map.
const DRAG_THRESHOLD = 4;

const ZoomPanStage = forwardRef(function ZoomPanStage(
  { scale, tx, ty, onChange, onReset, min = 1, max = 4, step = 0.25, content = null, children, className },
  frameRef
) {
  const dragState = useRef(null);
  const localFrame = useRef(null);
  const contentRef = useRef(content);
  const [dragging, setDragging] = useState(false);
  contentRef.current = content;

  // The forwarded ref belongs to the parent, so keep a local handle on the
  // same node — clamping needs to measure it on every interaction.
  function attachFrame(node) {
    localFrame.current = node;
    if (typeof frameRef === "function") frameRef(node);
    else if (frameRef) frameRef.current = node;
  }

  function emit(next) {
    onChange(clampView(next, localFrame.current, { min, max, content: contentRef.current }));
  }

  function onPointerDown(e) {
    // Only the primary button/touch starts a drag, and not when the click
    // is on a control (hotspot dot, button) — those stopPropagation.
    // `armed` rather than `dragging`: a press is not a drag until the pointer
    // has actually travelled. Without that threshold a 1px wobble while
    // clicking pans the whole map, which is what makes the drag feel twitchy
    // and makes hotspots awkward to click.
    // Suppress the browser's own drag/selection gesture before it starts.
    if (e.cancelable) e.preventDefault();
    dragState.current = { startX: e.clientX, startY: e.clientY, tx, ty, armed: true };
    setDragging(true);
  }

  // The drag is tracked on the window, not on the stage. Tracking it on the
  // element meant that moving the pointer off the picture — which is exactly
  // what you do when dragging toward an edge — ended the drag mid-gesture and
  // made panning feel like it did not work.
  useEffect(() => {
    if (!dragging) return;
    function move(e) {
      const d = dragState.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (d.armed) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        d.armed = false;
      }
      emit({ scale, tx: d.tx + dx, ty: d.ty + dy });
    }
    function up() {
      dragState.current = null;
      setDragging(false);
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  });

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
      // Safari and Chrome on macOS start their own image drag-and-drop when you
      // drag an <img> quickly — the picture peels off under a ghost preview as
      // if you were dragging it out to save it. Refusing dragstart here stops
      // that for anything inside the stage; the <img> also sets draggable
      // {false}. Both are needed: the attribute covers the element, this covers
      // the gesture starting on anything else in the stage.
      onDragStart={(e) => e.preventDefault()}
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
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          // The 0.2s ease is right for a zoom step or a smart zoom, and wrong
          // for a drag: it makes the picture lag a fifth of a second behind
          // the cursor, which reads as the drag not working at all.
          transition: dragging ? "none" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default ZoomPanStage;
