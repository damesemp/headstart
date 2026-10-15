// Reconciles the three different names the same application goes by:
// - Segment name, as stored in Airtable's Segments/Types/Application Areas
//   tables (what the flyout navigates by) — e.g. "Air".
// - Application Model string, as stored in Hotspots/Application Mapping —
//   e.g. "Military Drones - Air".
// - View key, the short id used for this app's own client-side routing
//   state — e.g. "military-drones".
//
// This is the one place all three are reconciled for the four hand-built
// maps below. Add a row here only if a Segment needs a custom view key or
// Application Model string that doesn't match its own Segment name (as the
// four legacy maps below do, for historical reasons). Every other Segment
// is picked up automatically by buildAutoApps() the moment it has a real
// image + a Live hotspot — see that function's comment. No code change is
// needed to bring a new Segment's hotspot map onto the live Engine.
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

function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "") || "segment";
}

// Auto-detects a hotspot map for any Segment NOT already hand-registered
// above, from live Airtable data alone: a Segment counts as "live" the
// moment one of its Types has an Application Image URL set AND at least
// one Live Hotspot whose Device Variant equals that Type's name (exactly
// the same join HotspotMap.js already uses for the four registered maps).
// This is what makes "place an image in Blob, add Live hotspots, done" work
// without a code change or an Airtable 'Has Diagram' checkbox — added
// 15 Oct 2026 after Diagnostic Imaging Equipment's hotspots went live in
// Airtable but had no way to reach the Engine (Medical/Diagnostics &
// Imaging had no entry here and no Application Model record).
// View key is namespaced "auto-" + a slug of the Segment name so it can
// never collide with a hand-built view key above.
export function buildAutoApps(data) {
  const auto = {};
  const types = data?.types || [];
  const hotspots = data?.hotspots || [];
  const liveVariants = new Set(
    hotspots.filter((h) => h.status === "Live" && h.deviceVariant).map((h) => h.deviceVariant)
  );
  types.forEach((type) => {
    if (!type.segment || SEGMENT_TO_APP[type.segment] || auto[type.segment]) return;
    if (type.applicationImageUrl && liveVariants.has(type.name)) {
      auto[type.segment] = {
        view: `auto-${slugify(type.segment)}`,
        applicationModel: type.segment,
        label: type.segment,
        auto: true,
      };
    }
  });
  return auto;
}

// The combined map every component should use once live data is available:
// the four hand-registered apps plus whatever Segments buildAutoApps()
// detects as ready. Hand-registered entries always win on a name clash.
export function appsForSegmentMap(data) {
  return { ...buildAutoApps(data), ...SEGMENT_TO_APP };
}

export function appForSegment(segmentName, data) {
  if (!data) return SEGMENT_TO_APP[segmentName] || null;
  return appsForSegmentMap(data)[segmentName] || null;
}

export function viewForSegment(segmentName, data) {
  return appForSegment(segmentName, data)?.view || null;
}

// Reverse lookup — Directory and Application Mapping data are keyed by
// Application Model string, not Segment name.
export function viewForApplicationModel(applicationModel, data) {
  const apps = data ? appsForSegmentMap(data) : SEGMENT_TO_APP;
  const match = Object.values(apps).find((a) => a.applicationModel === applicationModel);
  return match?.view || null;
}
