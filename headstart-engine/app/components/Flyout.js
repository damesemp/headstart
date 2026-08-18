"use client";

import { useMemo, useState } from "react";
import { appForSegment } from "../lib/segmentAppMap";

// Left-side flyout — partial width, slides in/out (see .hs-flyout CSS),
// opened only by the rail hamburger, separate from the Directory overlay.
// Drills down Industry > Segment > Type > System > Application Area,
// sourced live from Airtable (segments/types/applicationAreas), filtered
// to Segments with a live diagram for the "Go" action — non-live segments
// still show, marked "No hotspot map yet", so the full taxonomy stays
// visible. Embedded PC is the one standalone exception: its Segment goes
// straight to "Go ↗" with no Type/System/Application Area step.
export default function Flyout({ open, onClose, data, onGo }) {
  const [expandedIndustry, setExpandedIndustry] = useState(null);
  const [expandedSegment, setExpandedSegment] = useState(null);
  const [expandedType, setExpandedType] = useState(null);
  const [expandedSystem, setExpandedSystem] = useState(null);

  const segments = data?.segments || [];
  const types = data?.types || [];
  const applicationAreas = data?.applicationAreas || [];
  const hotspots = data?.hotspots || [];

  const hotspotById = useMemo(() => {
    const map = {};
    hotspots.forEach((h) => {
      map[h.id] = h;
    });
    return map;
  }, [hotspots]);

  const industries = useMemo(() => {
    const set = new Set(segments.map((s) => s.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [segments]);

  const segmentsByIndustry = useMemo(() => {
    const map = {};
    segments.forEach((s) => {
      if (!map[s.industry]) map[s.industry] = [];
      map[s.industry].push(s);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [segments]);

  function typesForSegment(segmentName) {
    return types.filter((t) => t.segment === segmentName).sort((a, b) => a.name.localeCompare(b.name));
  }

  function areasForSegmentAndType(segmentName, typeId) {
    return applicationAreas
      .filter((a) => a.segment === segmentName && a.relevantTypeIds.includes(typeId))
      .sort((a, b) => a.system.localeCompare(b.system) || a.applicationArea.localeCompare(b.applicationArea));
  }

  function goToArea(area) {
    const hotspotRecordId = area.linkedHotspotIds[0] || null;
    const hotspot = hotspotRecordId ? hotspotById[hotspotRecordId] : null;
    const app = appForSegment(area.segment);
    if (!app) return;
    onGo({ view: app.view, hotspotId: hotspot ? hotspot.hotspotId : null });
  }

  function toggleIndustry(name) {
    setExpandedIndustry(expandedIndustry === name ? null : name);
    setExpandedSegment(null);
    setExpandedType(null);
    setExpandedSystem(null);
  }

  function toggleSegment(name) {
    setExpandedSegment(expandedSegment === name ? null : name);
    setExpandedType(null);
    setExpandedSystem(null);
  }

  function toggleType(id) {
    setExpandedType(expandedType === id ? null : id);
    setExpandedSystem(null);
  }

  return (
    <>
      <div className={"hs-flyout-dim" + (open ? " hs-open" : "")} onClick={onClose} />
      <aside className={"hs-flyout" + (open ? " hs-open" : "")}>
        <div className="hs-flyout-head">
          <span>Browse by Industry</span>
          <button type="button" className="hs-flyout-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="hs-flyout-body">
          {industries.map((industry) => {
            const industryOpen = expandedIndustry === industry;
            const segList = segmentsByIndustry[industry] || [];
            return (
              <div className="hs-flyout-node" key={industry}>
                <button
                  type="button"
                  className="hs-flyout-row hs-flyout-row-industry"
                  onClick={() => toggleIndustry(industry)}
                >
                  <span>{industry}</span>
                  <span className="hs-flyout-caret">{industryOpen ? "−" : "+"}</span>
                </button>
                {industryOpen && (
                  <div className="hs-flyout-children">
                    {segList.map((segment) => {
                      const app = appForSegment(segment.name);
                      const live = segment.hasDiagram && app;
                      const segmentOpen = expandedSegment === segment.name;

                      if (live && app.standalone) {
                        // Embedded PC exception — straight to "Go", no
                        // Type/System/Application Area step.
                        return (
                          <div className="hs-flyout-node" key={segment.id}>
                            <button
                              type="button"
                              className="hs-flyout-row hs-flyout-row-segment hs-flyout-live"
                              onClick={() => onGo({ view: app.view, hotspotId: null })}
                            >
                              <span>{segment.name}</span>
                              <span className="hs-flyout-go">Go ↗</span>
                            </button>
                          </div>
                        );
                      }

                      if (!live) {
                        return (
                          <div className="hs-flyout-row hs-flyout-row-segment hs-flyout-disabled" key={segment.id}>
                            <span>{segment.name}</span>
                            <span className="hs-flyout-nomap">No hotspot map yet</span>
                          </div>
                        );
                      }

                      return (
                        <div className="hs-flyout-node" key={segment.id}>
                          <button
                            type="button"
                            className="hs-flyout-row hs-flyout-row-segment hs-flyout-live"
                            onClick={() => toggleSegment(segment.name)}
                          >
                            <span>{segment.name}</span>
                            <span className="hs-flyout-caret">{segmentOpen ? "−" : "+"}</span>
                          </button>
                          {segmentOpen && (
                            <div className="hs-flyout-children">
                              {typesForSegment(segment.name).map((type) => {
                                const typeOpen = expandedType === type.id;
                                return (
                                  <div className="hs-flyout-node" key={type.id}>
                                    <button
                                      type="button"
                                      className="hs-flyout-row hs-flyout-row-type"
                                      onClick={() => toggleType(type.id)}
                                    >
                                      <span>{type.name}</span>
                                      <span className="hs-flyout-caret">{typeOpen ? "−" : "+"}</span>
                                    </button>
                                    {typeOpen && (
                                      <div className="hs-flyout-children">
                                        {(() => {
                                          const areas = areasForSegmentAndType(segment.name, type.id);
                                          const systems = Array.from(new Set(areas.map((a) => a.system)));
                                          return systems.map((system) => {
                                            const systemKey = type.id + "|" + system;
                                            const systemOpen = expandedSystem === systemKey;
                                            const areasForSystem = areas.filter((a) => a.system === system);
                                            return (
                                              <div className="hs-flyout-node" key={systemKey}>
                                                <button
                                                  type="button"
                                                  className="hs-flyout-row hs-flyout-row-system"
                                                  onClick={() =>
                                                    setExpandedSystem(systemOpen ? null : systemKey)
                                                  }
                                                >
                                                  <span>{system}</span>
                                                  <span className="hs-flyout-caret">
                                                    {systemOpen ? "−" : "+"}
                                                  </span>
                                                </button>
                                                {systemOpen && (
                                                  <div className="hs-flyout-children">
                                                    {areasForSystem.map((area) => (
                                                      <button
                                                        type="button"
                                                        key={area.id}
                                                        className="hs-flyout-row hs-flyout-row-area"
                                                        onClick={() => goToArea(area)}
                                                      >
                                                        <span>{area.applicationArea}</span>
                                                        <span className="hs-flyout-go">Go ↗</span>
                                                      </button>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
