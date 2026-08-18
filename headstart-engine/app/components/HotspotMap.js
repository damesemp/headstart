"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ZoomPanStage from "./ZoomPanStage";
import CardsPanel from "./CardsPanel";

// Hotspot map — Wearables, Military Drones, Robotics & Automation. Reads
// live Hotspots + Application Mapping + Manufacturers data, passed down
// from EngineShell (single fetch shared across every view — see Section 2
// of the nav rearchitecture spec) rather than fetched here directly.
//
// Hotspot-to-application membership is resolved via Application Mapping's
// own Hotspot link, not via Hotspots."Application Model" (see
// app/lib/airtable.js FIELDS.HOTSPOTS.APPLICATION_MODEL comment).
//
// `pendingHotspotId` drives the flyout's "Go ↗": when set, this hotspot is
// selected and the stage zooms to it, same as a manual click, then the
// parent is told to clear the pending target so it doesn't re-fire.
//
// Hotspot x/y are percentages of the DEVICE IMAGE, not of the stage box —
// the two only match if the image's aspect ratio exactly fills the stage.
// It usually doesn't, so this measures the image's actual letterboxed
// rendered rect inside the stage (object-fit: contain) and places dots in
// pixels against that rect. This is also what fixed the "opens
// over-magnified / cropped" bug: previously the image was stretched to
// 100% width with height:auto inside an overflow:hidden box, so a
// taller-than-wide device image had its top and bottom clipped.
// Pure letterbox calc — pulled out of the component so it can be called
// on-demand with a freshly-measured size (see selectHotspot's comment)
// instead of only through the memoized, ResizeObserver-fed state.
function renderedBoxFor(cw, ch, imgNatural) {
  const { w: iw, h: ih } = imgNatural;
  if (!cw || !ch || !iw || !ih) return { w: cw, h: ch, x: 0, y: 0 };
  const containerRatio = cw / ch;
  const imageRatio = iw / ih;
  if (imageRatio > containerRatio) {
    const w = cw;
    const h = cw / imageRatio;
    return { w, h, x: 0, y: (ch - h) / 2 };
  }
  const h = ch;
  const w = ch * imageRatio;
  return { w, h, x: (cw - w) / 2, y: 0 };
}

export default function HotspotMap({
  data,
  applicationModel,
  imageSrc,
  variantImages,
  pendingHotspotId,
  onConsumedPending,
}) {
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const frameRef = useRef(null);

  useLayoutEffect(() => {
    if (!frameRef.current || typeof ResizeObserver === "undefined") return;
    const el = frameRef.current;
    const ro = new ResizeObserver(() => {
      setStageSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setStageSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // The image's actual rendered rect within the stage box, given
  // object-fit: contain — this is the letterbox math.
  const renderedBox = useMemo(
    () => renderedBoxFor(stageSize.w, stageSize.h, imgNatural),
    [stageSize, imgNatural]
  );

  const manufacturerById = useMemo(() => {
    const map = {};
    (data.manufacturers || []).forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, [data]);

  const hotspotByHotspotId = useMemo(() => {
    const map = {};
    (data.hotspots || []).forEach((h) => {
      if (h.hotspotId) map[h.hotspotId] = h;
    });
    return map;
  }, [data]);

  const mappingRows = useMemo(
    () => (data.applicationMapping || []).filter((r) => r.applicationModel === applicationModel),
    [data, applicationModel]
  );

  const hotspotsForApp = useMemo(() => {
    const seen = new Map();
    mappingRows.forEach((r) => {
      if (!r.hotspotId || seen.has(r.hotspotId)) return;
      const h = hotspotByHotspotId[r.hotspotId];
      if (h) seen.set(r.hotspotId, h);
    });
    return Array.from(seen.values());
  }, [mappingRows, hotspotByHotspotId]);

  const variants = useMemo(() => {
    const seen = [];
    hotspotsForApp.forEach((h) => {
      if (h.deviceVariant && !seen.includes(h.deviceVariant)) seen.push(h.deviceVariant);
    });
    return seen;
  }, [hotspotsForApp]);

  const activeVariant = variants.length ? selectedVariant || variants[0] : null;

  function pixelForHotspot(h) {
    return {
      left: renderedBox.x + ((h.x || 0) / 100) * renderedBox.w,
      top: renderedBox.y + ((h.y || 0) / 100) * renderedBox.h,
    };
  }

  function selectHotspot(hotspotId) {
    setSelectedHotspotId(hotspotId);
    const h = hotspotByHotspotId[hotspotId];
    // Measure the frame directly rather than trusting the ResizeObserver-fed
    // stageSize state — on a freshly-mounted map (e.g. landing here straight
    // from the flyout's "Go ↗"), the observer's first callback hasn't fired
    // yet when this runs, so stageSize can still be its {0,0} initial value
    // even though the element itself is already laid out and measurable.
    const w = frameRef.current?.clientWidth || 0;
    const hgt = frameRef.current?.clientHeight || 0;
    if (h && w && hgt) {
      const scale = (h.smartZoom || 100) / 100;
      const box = renderedBoxFor(w, hgt, imgNatural);
      const left = box.x + ((h.x || 0) / 100) * box.w;
      const top = box.y + ((h.y || 0) / 100) * box.h;
      const deltaX = left - w / 2;
      const deltaY = top - hgt / 2;
      setView({ scale, tx: -deltaX * scale, ty: -deltaY * scale });
    }
  }

  // Apply a pending "Go ↗" target from the flyout — switch variant if
  // needed, select the hotspot, zoom to it, then tell the parent it's done
  // so this doesn't re-fire on every re-render.
  useEffect(() => {
    if (!pendingHotspotId) return;
    const h = hotspotByHotspotId[pendingHotspotId];
    if (!h) {
      onConsumedPending();
      return;
    }
    if (h.deviceVariant && h.deviceVariant !== activeVariant) {
      setSelectedVariant(h.deviceVariant);
    }
    selectHotspot(pendingHotspotId);
    onConsumedPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingHotspotId, hotspotByHotspotId, stageSize]);

  function chooseVariant(v) {
    setSelectedVariant(v);
    setSelectedHotspotId(null);
    setView({ scale: 1, tx: 0, ty: 0 });
  }

  function resetView() {
    setSelectedHotspotId(null);
  }

  const visibleHotspots = useMemo(() => {
    if (!activeVariant) return hotspotsForApp;
    return hotspotsForApp.filter((h) => h.deviceVariant === activeVariant);
  }, [hotspotsForApp, activeVariant]);

  const activeImageSrc = activeVariant ? variantImages?.[activeVariant] : imageSrc;

  const rowsForSelected = useMemo(
    () => (selectedHotspotId ? mappingRows.filter((r) => r.hotspotId === selectedHotspotId) : []),
    [mappingRows, selectedHotspotId]
  );

  const selectedHotspot = selectedHotspotId ? hotspotByHotspotId[selectedHotspotId] : null;

  const FIT_ORDER = { "Best Fit": 0, "Also Relevant": 1, "Related Opportunity": 2 };
  const sortedRowsForSelected = useMemo(() => {
    return [...rowsForSelected].sort((a, b) => {
      const oa = FIT_ORDER[a.fitType] ?? 9;
      const ob = FIT_ORDER[b.fitType] ?? 9;
      return oa - ob;
    });
  }, [rowsForSelected]);

  const sharedQuestions = sortedRowsForSelected[0]?.questions || "";
  const sharedNextActions = sortedRowsForSelected[0]?.nextActions || "";

  return (
    <div className="hs-hsmap-layout">
      <div className="hs-hsmap-stage">
        {variants.length > 1 && (
          <div className="hs-hsmap-varrow">
            {variants.map((v) => (
              <button
                key={v}
                type="button"
                className={"hs-hsmap-vartab" + (v === activeVariant ? " hs-on" : "")}
                onClick={() => chooseVariant(v)}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        <ZoomPanStage
          ref={frameRef}
          scale={view.scale}
          tx={view.tx}
          ty={view.ty}
          onChange={setView}
          onReset={resetView}
          className="hs-hsmap-imgwrap"
        >
          <img
            key={activeImageSrc}
            src={activeImageSrc}
            alt={activeVariant ? `${applicationModel} — ${activeVariant}` : applicationModel}
            className="hs-hsmap-img"
            onLoad={(e) => setImgNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
          />
          {visibleHotspots.map((h) => {
            const pos = pixelForHotspot(h);
            return (
              <button
                key={h.hotspotId}
                type="button"
                className={"hs-hsmap-dot" + (h.hotspotId === selectedHotspotId ? " hs-on" : "")}
                style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
                title={h.label}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  selectHotspot(h.hotspotId);
                }}
              >
                <span className="hs-hsmap-dotlabel">{h.label}</span>
              </button>
            );
          })}
        </ZoomPanStage>
      </div>

      <CardsPanel
        selection={
          selectedHotspot
            ? {
                kind: "hotspot",
                hotspot: selectedHotspot,
                rows: sortedRowsForSelected,
                manufacturerById,
                sharedQuestions,
                sharedNextActions,
              }
            : null
        }
      />
    </div>
  );
}
