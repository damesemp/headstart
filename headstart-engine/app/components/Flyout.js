"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { appForSegment, viewForApplicationModel } from "../lib/segmentAppMap";

const EMBEDDED_PC = "Embedded PC";

function sortByName(a, b) {
  return String(a.name || a).localeCompare(String(b.name || b));
}

function Column({ title, children }) {
  return (
    <section className="hs-flyout-column">
      <h2 className="hs-flyout-column-title">{title}</h2>
      <div className="hs-flyout-column-body">{children}</div>
    </section>
  );
}

function Row({ active = false, disabled = false, showArrow = !disabled, meta, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      className={`hs-flyout-row${active ? " hs-on" : ""}${disabled ? " hs-flyout-disabled" : ""}${
        className ? ` ${className}` : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="hs-flyout-row-copy">
        <span>{children}</span>
        {meta && <span className="hs-flyout-row-meta">{meta}</span>}
      </span>
      {showArrow && <span className="hs-flyout-arrow">›</span>}
    </button>
  );
}

function RowAction({ children, onClick }) {
  return (
    <span
      role="button"
      tabIndex={0}
      style={{ color: "var(--astute-orange)", cursor: "pointer" }}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </span>
  );
}

export default function Flyout({ open, onClose, data, onGo, onSelectManufacturer, onWatchVideo, resetSignal }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("embedded-pc");
  const [industry, setIndustry] = useState(null);
  const [segmentName, setSegmentName] = useState(null);
  const [typeId, setTypeId] = useState(null);
  const [system, setSystem] = useState(null);
  const [areaId, setAreaId] = useState(null);
  const [category, setCategory] = useState(null);
  const [manufacturerId, setManufacturerId] = useState(null);
  const columnsRef = useRef(null);

  useEffect(() => {
    setQuery("");
    setMode("embedded-pc");
    setIndustry(null);
    setSegmentName(null);
    setTypeId(null);
    setSystem(null);
    setAreaId(null);
    setCategory(null);
    setManufacturerId(null);
  }, [resetSignal]);

  const manufacturers = data?.manufacturers || [];
  const segments = data?.segments || [];
  const types = data?.types || [];
  const applicationAreas = data?.applicationAreas || [];
  const hotspots = data?.hotspots || [];
  const applicationMapping = data?.applicationMapping || [];
  const videos = data?.videos || [];

  const hotspotByRecordId = useMemo(
    () => Object.fromEntries(hotspots.map((hotspot) => [hotspot.id, hotspot])),
    [hotspots]
  );
  const segmentByName = useMemo(
    () => Object.fromEntries(segments.map((segment) => [segment.name, segment])),
    [segments]
  );
  const typeById = useMemo(() => Object.fromEntries(types.map((type) => [type.id, type])), [types]);

  const industries = useMemo(
    () => Array.from(new Set(segments.map((segment) => segment.industry).filter(Boolean))).sort(),
    [segments]
  );
  const categories = useMemo(
    () => Array.from(new Set(manufacturers.map((m) => m.linecardCategory).filter(Boolean))).sort(),
    [manufacturers]
  );
  const selectedSegment = segmentName ? segmentByName[segmentName] : null;
  const selectedType = typeId ? typeById[typeId] : null;

  const visibleSegments = useMemo(
    () => segments.filter((segment) => segment.industry === industry).sort(sortByName),
    [segments, industry]
  );
  const visibleTypes = useMemo(
    () => types.filter((type) => type.segment === segmentName).sort(sortByName),
    [types, segmentName]
  );
  const areasForType = useMemo(
    () =>
      applicationAreas.filter(
        (area) => area.segment === segmentName && (!typeId || area.relevantTypeIds.includes(typeId))
      ),
    [applicationAreas, segmentName, typeId]
  );
  const visibleSystems = useMemo(
    () => Array.from(new Set(areasForType.map((area) => area.system).filter(Boolean))).sort(),
    [areasForType]
  );
  const visibleAreas = useMemo(
    () =>
      areasForType
        .filter((area) => area.system === system)
        .sort((a, b) => a.applicationArea.localeCompare(b.applicationArea)),
    [areasForType, system]
  );
  const visibleManufacturers = useMemo(
    () => manufacturers.filter((m) => m.linecardCategory === category).sort(sortByName),
    [manufacturers, category]
  );

  const breadcrumb = useMemo(() => {
    if (mode === "embedded-pc") {
      return [EMBEDDED_PC, category, manufacturerId && manufacturers.find((m) => m.id === manufacturerId)?.name]
        .filter(Boolean)
        .join(" › ");
    }
    return [
      industry,
      segmentName,
      selectedType?.name,
      system,
      areaId && visibleAreas.find((area) => area.id === areaId)?.applicationArea,
    ]
      .filter(Boolean)
      .join(" › ");
  }, [
    mode,
    category,
    manufacturerId,
    manufacturers,
    industry,
    segmentName,
    selectedType,
    system,
    areaId,
    visibleAreas,
  ]);

  const columnCount =
    mode === "embedded-pc"
      ? 2 + (category ? 1 : 0)
      : 1 + (industry ? 1 : 0) + (segmentName ? 1 : 0) + (typeId ? 1 : 0) + (system ? 1 : 0);

  useEffect(() => {
    if (!open || query.trim()) return;
    const row = columnsRef.current;
    if (!row) return;
    requestAnimationFrame(() => row.scrollTo({ left: row.scrollWidth, behavior: "smooth" }));
  }, [open, query, columnCount]);

  function resetNavigation() {
    setQuery("");
    setMode("embedded-pc");
    setIndustry(null);
    setSegmentName(null);
    setTypeId(null);
    setSystem(null);
    setAreaId(null);
    setCategory(null);
    setManufacturerId(null);
    onGo({ view: "embedded-pc", hotspotId: null, keepOpen: true });
  }

  function selectEmbeddedPC() {
    setMode("embedded-pc");
    setIndustry(null);
    setSegmentName(null);
    setTypeId(null);
    setSystem(null);
    setAreaId(null);
    setCategory(null);
    setManufacturerId(null);
    onGo({ view: "embedded-pc", hotspotId: null, keepOpen: true });
  }

  function selectIndustry(nextIndustry) {
    setMode("industry");
    setIndustry(nextIndustry);
    setSegmentName(null);
    setTypeId(null);
    setSystem(null);
    setAreaId(null);
    setCategory(null);
    setManufacturerId(null);
  }

  function selectSegment(segment) {
    const app = appForSegment(segment.name);
    setSegmentName(segment.name);
    setTypeId(null);
    setSystem(null);
    setAreaId(null);
    if (app?.standalone) onGo({ view: app.view, hotspotId: null, keepOpen: true });
  }

  function selectType(type) {
    setTypeId(type.id);
    setSystem(null);
    setAreaId(null);
  }

  function goToArea(area) {
    const hotspotRecordId = area.linkedHotspotIds[0] || null;
    const hotspot = hotspotRecordId ? hotspotByRecordId[hotspotRecordId] : null;
    const app = appForSegment(area.segment);
    if (!app) return;
    setAreaId(area.id);
    onGo({ view: app.view, hotspotId: hotspot?.hotspotId || null });
  }

  function selectManufacturer(manufacturer) {
    setQuery("");
    setMode("embedded-pc");
    setCategory(manufacturer.linecardCategory || "Uncategorised");
    setManufacturerId(manufacturer.id);
    onSelectManufacturer(manufacturer);
  }

  function navigateToSegment(segment) {
    setQuery("");
    selectIndustry(segment.industry);
    selectSegment(segment);
  }

  function navigateToType(type) {
    const segment = segmentByName[type.segment];
    if (!segment) return;
    setQuery("");
    selectIndustry(segment.industry);
    setSegmentName(segment.name);
    selectType(type);
  }

  function navigateToArea(area) {
    const segment = segmentByName[area.segment];
    if (segment) {
      setMode("industry");
      setIndustry(segment.industry);
      setSegmentName(segment.name);
      const matchingType = types.find(
        (type) => type.segment === area.segment && area.relevantTypeIds.includes(type.id)
      );
      setTypeId(matchingType?.id || null);
      setSystem(area.system || null);
    }
    setQuery("");
    goToArea(area);
  }

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results = [];

    manufacturers.forEach((manufacturer) => {
      const terms = [manufacturer.name, manufacturer.linecardCategory, ...(manufacturer.subcategory || [])];
      if (terms.some((term) => String(term || "").toLowerCase().includes(q))) {
        results.push({
          key: `manufacturer-${manufacturer.id}`,
          label: manufacturer.name,
          path: `${EMBEDDED_PC} › ${manufacturer.linecardCategory || "Uncategorised"} › ${manufacturer.name}`,
          onClick: () => selectManufacturer(manufacturer),
        });
      }
    });

    segments.forEach((segment) => {
      if ([segment.name, segment.industry].some((term) => String(term || "").toLowerCase().includes(q))) {
        const app = appForSegment(segment.name);
        const disabled = !segment.hasDiagram || !app;
        results.push({
          key: `segment-${segment.id}`,
          label: segment.name,
          path: `${segment.industry} › ${segment.name}`,
          disabled,
          meta: disabled ? "No hotspot map yet" : null,
          onClick: () => navigateToSegment(segment),
        });
      }
    });

    types.forEach((type) => {
      if (type.name.toLowerCase().includes(q)) {
        const segment = segmentByName[type.segment];
        const app = appForSegment(type.segment);
        const disabled = !segment?.hasDiagram || !app || app.standalone;
        results.push({
          key: `type-${type.id}`,
          label: type.name,
          path: `${segment?.industry || ""} › ${type.segment} › ${type.name}`,
          disabled,
          meta: disabled ? "No hotspot map yet" : null,
          onClick: () => navigateToType(type),
        });
      }
    });

    applicationAreas.forEach((area) => {
      const terms = [area.fullPath, area.system, area.applicationArea];
      if (terms.some((term) => String(term || "").toLowerCase().includes(q))) {
        const app = appForSegment(area.segment);
        const disabled = !app || !area.linkedHotspotIds.length;
        results.push({
          key: `area-${area.id}`,
          label: area.applicationArea,
          path:
            area.fullPath ||
            [area.industry, area.segment, area.system, area.applicationArea].filter(Boolean).join(" › "),
          disabled,
          meta: disabled ? "No hotspot map yet" : null,
          onClick: () => navigateToArea(area),
        });
      }
    });

    hotspots.forEach((hotspot) => {
      if (!hotspot.label.toLowerCase().includes(q)) return;
      const area = applicationAreas.find(
        (candidate) =>
          candidate.linkedHotspotIds.includes(hotspot.id) || hotspot.applicationAreaIds?.includes(candidate.id)
      );
      const mapping = applicationMapping.find((row) => row.hotspotId === hotspot.hotspotId);
      const directView = viewForApplicationModel(mapping?.applicationModel);
      results.push({
        key: `hotspot-${hotspot.id}`,
        label: hotspot.label,
        path: area?.fullPath || [mapping?.applicationModel, hotspot.label].filter(Boolean).join(" › "),
        disabled: !area && !directView,
        meta: !area && !directView ? "No hotspot map yet" : null,
        onClick: () => {
          if (area) navigateToArea(area);
          else if (directView) {
            setQuery("");
            onGo({ view: directView, hotspotId: hotspot.hotspotId });
          }
        },
      });
    });

    return results.sort((a, b) => a.label.localeCompare(b.label) || a.path.localeCompare(b.path));
  }, [
    query,
    manufacturers,
    segments,
    types,
    applicationAreas,
    hotspots,
    applicationMapping,
    segmentByName,
  ]);

  const searching = query.trim().length > 0;

  return (
    <>
      <button
        type="button"
        className={`hs-flyout-dim${open ? " hs-open" : ""}`}
        onClick={onClose}
        aria-label="Close navigation"
        tabIndex={open ? 0 : -1}
      />
      <aside className={`hs-flyout${open ? " hs-open" : ""}`} aria-hidden={!open}>
        <div className="hs-flyout-head">
          <label className="hs-flyout-search">
            <span className="hs-sr-only">Search navigation</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search manufacturers, applications or areas"
              tabIndex={open ? 0 : -1}
            />
          </label>
          <button type="button" className="hs-flyout-reset" onClick={resetNavigation} tabIndex={open ? 0 : -1}>
            RESET
          </button>
          <button
            type="button"
            className="hs-flyout-close"
            onClick={onClose}
            aria-label="Close navigation"
            tabIndex={open ? 0 : -1}
          >
            ×
          </button>
        </div>
        <div className="hs-flyout-breadcrumb" aria-label="Current path">
          {searching ? `Search › ${query.trim() || "…"}` : breadcrumb || EMBEDDED_PC}
        </div>

        {searching ? (
          <div className="hs-flyout-results">
            {query.trim().length < 2 ? (
              <div className="hs-flyout-message">Type at least 2 characters to search.</div>
            ) : searchResults.length ? (
              searchResults.map((result) => (
                <Row
                  key={result.key}
                  disabled={result.disabled}
                  meta={result.meta || result.path}
                  onClick={result.onClick}
                  className="hs-flyout-result"
                >
                  {result.label}
                </Row>
              ))
            ) : (
              <div className="hs-flyout-message">No matching manufacturers, applications or areas.</div>
            )}
          </div>
        ) : (
          <div className="hs-flyout-columns" ref={columnsRef}>
            <Column title="Industry">
              <Row active={mode === "embedded-pc"} onClick={selectEmbeddedPC} className="hs-flyout-embedded">
                {EMBEDDED_PC}
              </Row>
              <div className="hs-flyout-separator" />
              {industries.map((name) => (
                <Row key={name} active={mode === "industry" && industry === name} onClick={() => selectIndustry(name)}>
                  {name}
                </Row>
              ))}
            </Column>

            {mode === "embedded-pc" && (
              <Column title="Linecard Category">
                {categories.map((name) => (
                  <Row
                    key={name}
                    active={category === name}
                    onClick={() => {
                      setCategory(name);
                      setManufacturerId(null);
                    }}
                  >
                    {name}
                  </Row>
                ))}
              </Column>
            )}

            {mode === "embedded-pc" && category && (
              <Column title="Manufacturer">
                {visibleManufacturers.map((manufacturer) => (
                  <Row
                    key={manufacturer.id}
                    active={manufacturerId === manufacturer.id}
                    meta={(manufacturer.subcategory || []).join(" · ")}
                    onClick={() => selectManufacturer(manufacturer)}
                  >
                    {manufacturer.name}
                  </Row>
                ))}
              </Column>
            )}

            {mode === "industry" && industry && (
              <Column title="Segment">
                {visibleSegments.map((segment) => {
                  const app = appForSegment(segment.name);
                  const unavailable = !segment.hasDiagram || !app;
                  const hasTypes = types.some((type) => type.segment === segment.name);
                  const disabled = unavailable && !hasTypes;
                  return (
                    <Row
                      key={segment.id}
                      active={segmentName === segment.name}
                      disabled={disabled}
                      meta={unavailable ? "No hotspot map yet" : null}
                      onClick={() => selectSegment(segment)}
                    >
                      {segment.name}
                    </Row>
                  );
                })}
              </Column>
            )}

            {mode === "industry" && selectedSegment && !appForSegment(selectedSegment.name)?.standalone && (
              <Column title="Type">
                {visibleTypes.map((type) => {
                  const app = appForSegment(segmentName);
                  const hasMap = !!app && segmentByName[segmentName]?.hasDiagram;
                  const video = videos.find(
                    (candidate) =>
                      !candidate.internalOnly && candidate.fileUrl && candidate.typeIds?.includes(type.id)
                  );
                  return (
                    <Row
                      key={type.id}
                      active={typeId === type.id}
                      disabled={!hasMap && !video}
                      showArrow={hasMap}
                      className={!hasMap ? "hs-flyout-disabled" : ""}
                      onClick={hasMap ? () => selectType(type) : undefined}
                      meta={
                        <span style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                          {!hasMap && <span>No hotspot map yet</span>}
                          {hasMap && (
                            <RowAction onClick={() => onGo({ view: app.view, hotspotId: null, variant: type.name })}>
                              Open map ↗
                            </RowAction>
                          )}
                          {video && (
                            <RowAction onClick={() => onWatchVideo(video)}>▶ Watch introduction</RowAction>
                          )}
                        </span>
                      }
                    >
                      {type.name}
                    </Row>
                  );
                })}
              </Column>
            )}

            {mode === "industry" && typeId && (
              <Column title="System">
                {visibleSystems.map((name) => (
                  <Row
                    key={name}
                    active={system === name}
                    onClick={() => {
                      setSystem(name);
                      setAreaId(null);
                    }}
                  >
                    {name}
                  </Row>
                ))}
              </Column>
            )}

            {mode === "industry" && system && (
              <Column title="Application Area">
                {visibleAreas.map((area) => (
                  <Row key={area.id} active={areaId === area.id} onClick={() => goToArea(area)}>
                    {area.applicationArea}
                  </Row>
                ))}
              </Column>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
