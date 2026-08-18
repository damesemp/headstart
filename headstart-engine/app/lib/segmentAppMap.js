// Reconciles the three different names the same application goes by:
// - Segment name, as stored in Airtable's Segments/Types/Application Areas
//   tables (what the flyout navigates by) — e.g. "Air".
// - Application Model string, as stored in Hotspots/Application Mapping —
//   e.g. "Military Drones - Air".
// - View key, the short id used for this app's own client-side routing
//   state — e.g. "military-drones".
//
// This is the one place all three are reconciled. Add a row here whenever
// a new Segment gets a live diagram (Has Diagram ticked in Airtable) and a
// view is built for it.
export const SEGMENT_TO_APP = {
  Wearables: { view: "wearables", applicationModel: "Wearables", label: "Wearables" },
  Air: { view: "military-drones", applicationModel: "Military Drones - Air", label: "Military Drones" },
  "Factory Automation": {
    view: "robotics-automation",
    applicationModel: "Robotics & Automation",
    label: "Robotics & Automation",
  },
  "Industrial Computing": {
    view: "embedded-pc",
    applicationModel: "Embedded PC",
    label: "Embedded PC",
    // No Hotspots/Application Areas/Types rows exist for this Segment —
    // standalone exception to the schema, agreed 18 Aug 2026.
    standalone: true,
  },
};

export function appForSegment(segmentName) {
  return SEGMENT_TO_APP[segmentName] || null;
}

export function viewForSegment(segmentName) {
  return SEGMENT_TO_APP[segmentName]?.view || null;
}

// Reverse lookup — Directory and Application Mapping data are keyed by
// Application Model string, not Segment name.
export function viewForApplicationModel(applicationModel) {
  const match = Object.values(SEGMENT_TO_APP).find((a) => a.applicationModel === applicationModel);
  return match?.view || null;
}
