"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ZoomPanStage, { clampView } from "./ZoomPanStage";
import CardsPanel from "./CardsPanel";
import { SEGMENT_TO_APP } from "../lib/segmentAppMap";

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
  pendingHotspotId,
  pendingVariant,
  onConsumedPending,
  onHotspotSelectionChange,
  onVariantSelectionChange,
  resetSignal,
}) {
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    setSelectedHotspotId(null);
    setSelectedVariant(null);
    setView({ scale: 1, tx: 0, ty: 0 });
  }, [resetSignal]);

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

  // Which Types (device variants) belong to this application model. Type
  // Name and Hotspots' Device Variant are the same string.
  const variantsForApp = useMemo(() => {
    const segment = Object.entries(SEGMENT_TO_APP).find(
      ([, app]) => app.applicationModel === applicationModel
    )?.[0];
    return (data.types || []).filter((t) => t.segment === segment).map((t) => t.name);
  }, [data, applicationModel]);

  // Hotspots come from the Hotspots table, NOT from Application Mapping.
  // A hotspot is a location on the image and exists whether or not a
  // manufacturer has been mapped to it yet — which is the normal state for
  // anything the hotspot mapper has just placed. Deriving them from mapping
  // rows (as this did until 18 Aug 2026) made every newly placed hotspot
  // invisible. Status gates visibility: only "Live" ever reaches the site.
  const hotspotsForApp = useMemo(
    () =>
      (data.hotspots || []).filter(
        (h) => h.status === "Live" && h.deviceVariant && variantsForApp.includes(h.deviceVariant)
      ),
    [data, variantsForApp]
  );

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
    onHotspotSelectionChange(hotspotId);
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
      // Centre the hotspot, then clamp so the frame is never panned past the
      // edge of the picture. A hotspot close to an edge therefore lands as
      // near the middle as the picture allows rather than dead centre with
      // empty space beside it — the same rule any map applies.
      setView(
        clampView({ scale, tx: -deltaX * scale, ty: -deltaY * scale }, frameRef.current, {
          content: box,
        })
      );
    }
  }

  function chooseVariant(v) {
    setSelectedVariant(v);
    setSelectedHotspotId(null);
    onHotspotSelectionChange(null);
    onVariantSelectionChange(v);
    setView({ scale: 1, tx: 0, ty: 0 });
  }

  // Apply a pending Type variant before any pending hotspot selection. Both
  // paths reuse chooseVariant so URL state, selection and zoom reset exactly
  // as they do for a manual variant-tab click.
  useEffect(() => {
    if (!pendingHotspotId && !pendingVariant) return;
    if (pendingVariant) {
      if (!variants.length) return;
      if (!variants.includes(pendingVariant)) {
        onConsumedPending();
        return;
      }
      if (pendingVariant !== activeVariant) {
        chooseVariant(pendingVariant);
        return;
      }
    }
    if (!pendingHotspotId) {
      onConsumedPending();
      return;
    }
    const h = hotspotByHotspotId[pendingHotspotId];
    if (!h) {
      onConsumedPending();
      return;
    }
    if (h.deviceVariant && h.deviceVariant !== activeVariant) {
      chooseVariant(h.deviceVariant);
      return;
    }
    if (!frameRef.current?.clientWidth || !frameRef.current?.clientHeight) return;
    selectHotspot(pendingHotspotId);
    onConsumedPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingHotspotId, pendingVariant, hotspotByHotspotId, stageSize, activeVariant, variants]);

  function resetView() {
    setSelectedHotspotId(null);
    onHotspotSelectionChange(null);
  }

  const visibleHotspots = useMemo(() => {
    if (!activeVariant) return hotspotsForApp;
    return hotspotsForApp.filter((h) => h.deviceVariant === activeVariant);
  }, [hotspotsForApp, activeVariant]);

  // Application image comes from Airtable, not from bundled base64. Each Type
  // carries its own "Application Image URL"; Type Name and Hotspots' Device
  // Variant are the same string, so the active variant resolves the image
  // directly. Single-variant maps (Robotics & Automation) fall through the
  // same path because activeVariant resolves to that one variant.
  const imageByVariant = useMemo(() => {
    const map = {};
    (data.types || []).forEach((t) => {
      if (t.name && t.applicationImageUrl) map[t.name] = t.applicationImageUrl;
    });
    return map;
  }, [data]);

  const activeImageSrc = activeVariant ? imageByVariant[activeVariant] || null : null;

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
          // The picture is letterboxed inside the frame by object-fit: contain,
          // so the pan bounds must be measured against the picture, not the
          // frame. Without this a landscape image (both drones) can be dragged
          // clean off the screen while the frame still covers the stage.
          content={renderedBox}
          className="hs-hsmap-imgwrap"
        >
          {activeImageSrc ? (
            <img
              key={activeImageSrc}
              src={activeImageSrc}
              alt={activeVariant ? `${applicationModel} — ${activeVariant}` : applicationModel}
              className="hs-hsmap-img"
              // Without this, dragging the picture quickly on a Mac starts the
              // browser's own image drag — the picture lifts off under a ghost
              // preview as though you were dragging it out to save it, which is
              // exactly what it looked like was happening.
              draggable={false}
              onLoad={(e) => setImgNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
            />
          ) : (
            <div className="hs-hsmap-noimg">
              No application image set for this type yet.
            </div>
          )}
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
        onResetSelection={() => {
          setSelectedHotspotId(null);
          onHotspotSelectionChange(null);
        }}
      />
    </div>
  );
}
