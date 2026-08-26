import { NextResponse } from "next/server";
import { TABLES, FIELDS, airtableFetchAll } from "../../lib/airtable";

// Always fetch live from Airtable on every request — never statically
// cached by Next.js. Matches the project rule: the site must read
// "Show in Model" live, not bake in a stale copy.
export const dynamic = "force-dynamic";

function manufacturerShape(record) {
  const f = record.fields;
  return {
    id: record.id,
    name: f[FIELDS.MANUFACTURERS.NAME] || "",
    tier: f[FIELDS.MANUFACTURERS.TIER] ?? null,
    linecardCategory: f[FIELDS.MANUFACTURERS.LINECARD_CATEGORY] || null,
    // Step 4 — Embedded PC diagram. Raw Airtable REST API returns
    // multipleSelects fields as a plain array of option-name strings.
    subcategory: f[FIELDS.MANUFACTURERS.SUBCATEGORY] || [],
    shortDescription: f[FIELDS.MANUFACTURERS.SHORT_DESCRIPTION] || "",
    longDescription: f[FIELDS.MANUFACTURERS.LONG_DESCRIPTION] || "",
    headline: f[FIELDS.MANUFACTURERS.MANUFACTURER_HEADLINE] || "",
    keyProducts: f[FIELDS.MANUFACTURERS.KEY_PRODUCTS] || "",
    applications: f[FIELDS.MANUFACTURERS.APPLICATIONS] || "",
    industries: f[FIELDS.MANUFACTURERS.INDUSTRIES] || "",
    website: f[FIELDS.MANUFACTURERS.WEBSITE] || null,
    ctaText: f[FIELDS.MANUFACTURERS.CTA_TEXT] || "",
    // Manufacturer Links tab (Application Maps) — added 18 August 2026.
    // featuredLinkUrl/Label are edited directly in Airtable for now (the
    // Manufacturer Links tab itself is a later build item in Application
    // Maps); pdfUrl is always a permanent Vercel Blob URL, never a raw
    // Airtable attachment link, per the Vercel Blob storage decision.
    featuredLinkUrl: f[FIELDS.MANUFACTURERS.FEATURED_LINK_URL] || null,
    featuredLinkLabel: f[FIELDS.MANUFACTURERS.FEATURED_LINK_LABEL] || "",
    pdfUrl: f[FIELDS.MANUFACTURERS.PDF_URL] || null,
    // Step 4 — right-hand panel "Why this manufacturer fits" fallback
    // when a given hotspot mapping row has no per-hotspot text of its own.
    coreAdvantages: f[FIELDS.MANUFACTURERS.CORE_ADVANTAGES] || "",
    qualityCertifications: f[FIELDS.MANUFACTURERS.QUALITY_CERTIFICATIONS] || "",
  };
}

function hotspotShape(record) {
  const f = record.fields;
  return {
    id: record.id,
    label: f[FIELDS.HOTSPOTS.LABEL] || "",
    hotspotId: f[FIELDS.HOTSPOTS.HOTSPOT_ID] || "",
    x: f[FIELDS.HOTSPOTS.X] ?? null,
    y: f[FIELDS.HOTSPOTS.Y] ?? null,
    // Step 4 — pan/zoom-on-click and label placement. Note: the raw
    // Airtable REST API (used here, unlike the Airtable MCP tool) returns
    // singleSelect fields as plain option-name strings, not {id,name}
    // objects, even with returnFieldsByFieldId=true — so Label Side reads
    // directly as a string.
    smartZoom: f[FIELDS.HOTSPOTS.SMART_ZOOM] ?? null,
    labelX: f[FIELDS.HOTSPOTS.LABEL_X] ?? 0,
    labelY: f[FIELDS.HOTSPOTS.LABEL_Y] ?? 0,
    labelSide: f[FIELDS.HOTSPOTS.LABEL_SIDE] || "centre",
    deviceVariant: f[FIELDS.HOTSPOTS.DEVICE_VARIANT] || null,
    // Added 18 Aug 2026 — Application Area link(s), used by the flyout's
    // "Go ↗" to jump straight to this hotspot.
    applicationAreaIds: f[FIELDS.HOTSPOTS.APPLICATION_AREAS] || [],
    // Draft/Live/Archived. The Engine filters on this — see HotspotMap.
    status: f[FIELDS.HOTSPOTS.STATUS] || null,
  };
}

function segmentShape(record) {
  const f = record.fields;
  return {
    id: record.id,
    name: f[FIELDS.SEGMENTS.SEGMENT_NAME] || "",
    industry: f[FIELDS.SEGMENTS.INDUSTRY] || "",
    hasDiagram: !!f[FIELDS.SEGMENTS.HAS_DIAGRAM],
  };
}

function typeShape(record) {
  const f = record.fields;
  return {
    id: record.id,
    name: f[FIELDS.TYPES.TYPE_NAME] || "",
    segment: f[FIELDS.TYPES.SEGMENT] || "",
    applicationImageUrl: f[FIELDS.TYPES.APPLICATION_IMAGE_URL] || null,
  };
}

function applicationAreaShape(record) {
  const f = record.fields;
  return {
    id: record.id,
    fullPath: f[FIELDS.APPLICATION_AREAS.FULL_PATH] || "",
    industry: f[FIELDS.APPLICATION_AREAS.INDUSTRY] || "",
    segment: f[FIELDS.APPLICATION_AREAS.SEGMENT] || "",
    system: f[FIELDS.APPLICATION_AREAS.SYSTEM] || "",
    applicationArea: f[FIELDS.APPLICATION_AREAS.APPLICATION_AREA] || "",
    // Linked-record fields — raw REST API returns an array of record IDs.
    relevantTypeIds: f[FIELDS.APPLICATION_AREAS.RELEVANT_TYPES] || [],
    linkedHotspotIds: f[FIELDS.APPLICATION_AREAS.LINKED_HOTSPOTS] || [],
  };
}

function mappingShape(record, hotspotById) {
  const f = record.fields;
  const hotspotRecordId = (f[FIELDS.APPLICATION_MAPPING.HOTSPOT] || [])[0] || null;
  const hotspot = hotspotRecordId ? hotspotById[hotspotRecordId] : null;
  return {
    id: record.id,
    mappingId: f[FIELDS.APPLICATION_MAPPING.MAPPING_ID] || "",
    applicationModel: f[FIELDS.APPLICATION_MAPPING.APPLICATION_MODEL] || "",
    hotspotId: hotspot ? hotspot.hotspotId : null,
    hotspotLabel: hotspot ? hotspot.label : null,
    relevantAstuteLine: f[FIELDS.APPLICATION_MAPPING.RELEVANT_ASTUTE_LINE] || [],
    fitType: f[FIELDS.APPLICATION_MAPPING.FIT_TYPE] || null,
    whyThisLineFits: f[FIELDS.APPLICATION_MAPPING.WHY_THIS_LINE_FITS] || "",
    // Step 4 — right-hand panel "Ask & Act" card.
    questions: f[FIELDS.APPLICATION_MAPPING.QUESTIONS] || "",
    nextActions: f[FIELDS.APPLICATION_MAPPING.NEXT_ACTIONS] || "",
    reviewStatus: f[FIELDS.APPLICATION_MAPPING.REVIEW_STATUS] || null,
    confidencePriority: f[FIELDS.APPLICATION_MAPPING.CONFIDENCE_PRIORITY] || null,
  };
}

function competitorTriggerShape(record) {
  const f = record.fields;
  return {
    id: record.id,
    trigger: f[FIELDS.COMPETITOR_TRIGGERS.TRIGGER] || "",
    aliases: f[FIELDS.COMPETITOR_TRIGGERS.ALIASES] || "",
    productTerms: f[FIELDS.COMPETITOR_TRIGGERS.PRODUCT_TERMS] || "",
    category: f[FIELDS.COMPETITOR_TRIGGERS.CATEGORY] || null,
    relevantAstuteLines: f[FIELDS.COMPETITOR_TRIGGERS.RELEVANT_ASTUTE_LINES] || [],
  };
}

function videoShape(record) {
  const f = record.fields;
  return {
    id: record.id,
    applicationModel: f[FIELDS.VIDEOS.APPLICATION_MODEL] || "",
    typeIds: f[FIELDS.VIDEOS.TYPE] || [],
    title: f[FIELDS.VIDEOS.TITLE] || "",
    description: f[FIELDS.VIDEOS.DESCRIPTION] || "",
    fileUrl: f[FIELDS.VIDEOS.FILE_URL] || null,
    internalOnly: !!f[FIELDS.VIDEOS.INTERNAL_ONLY],
  };
}

// Builds manufacturer -> [application mapping rows] by walking each
// filtered mapping row's linked manufacturer(s) in Relevant Astute Line.
// Each entry carries hotspotId/hotspotLabel so the Directory can group
// manufacturers by hotspot area, matching headstart_video_nav_preview.html's
// DIR_DATA shape.
function buildManufacturerApplicationIndex(mapping) {
  const index = {};
  for (const row of mapping) {
    for (const manufacturerId of row.relevantAstuteLine) {
      if (!index[manufacturerId]) index[manufacturerId] = [];
      index[manufacturerId].push(row);
    }
  }
  return index;
}

export async function GET() {
  try {
    const showInModelFormula = `{${FIELDS.APPLICATION_MAPPING.SHOW_IN_MODEL}} = TRUE()`;

    const [
      manufacturerRecords,
      hotspotRecords,
      mappingRecords,
      competitorRecords,
      videoRecords,
      segmentRecords,
      typeRecords,
      applicationAreaRecords,
    ] = await Promise.all([
      airtableFetchAll(TABLES.MANUFACTURERS),
      airtableFetchAll(TABLES.HOTSPOTS),
      airtableFetchAll(TABLES.APPLICATION_MAPPING, { filterByFormula: showInModelFormula }),
      airtableFetchAll(TABLES.COMPETITOR_TRIGGERS),
      airtableFetchAll(TABLES.VIDEOS),
      airtableFetchAll(TABLES.SEGMENTS),
      airtableFetchAll(TABLES.TYPES),
      airtableFetchAll(TABLES.APPLICATION_AREAS),
    ]);

    const manufacturers = manufacturerRecords.map(manufacturerShape);
    const hotspots = hotspotRecords.map(hotspotShape);
    const hotspotById = {};
    hotspots.forEach((h) => {
      hotspotById[h.id] = h;
    });

    const applicationMapping = mappingRecords.map((r) => mappingShape(r, hotspotById));
    const competitorTriggers = competitorRecords.map(competitorTriggerShape);
    const videos = videoRecords.map(videoShape);
    const manufacturerApplicationIndex = buildManufacturerApplicationIndex(applicationMapping);
    const segments = segmentRecords.map(segmentShape);
    const types = typeRecords.map(typeShape);
    const applicationAreas = applicationAreaRecords.map(applicationAreaShape);

    return NextResponse.json({
      manufacturers,
      hotspots,
      applicationMapping,
      competitorTriggers,
      videos,
      manufacturerApplicationIndex,
      segments,
      types,
      applicationAreas,
      meta: {
        mappedCount: applicationMapping.length,
        manufacturerCount: manufacturers.length,
        hotspotCount: hotspots.length,
        competitorTriggerCount: competitorTriggers.length,
        videoCount: videos.length,
        segmentCount: segments.length,
        typeCount: types.length,
        applicationAreaCount: applicationAreas.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    // An honest error, not empty data pretending to be a real answer —
    // matches the rule from Stage 2 of the build plan.
    return NextResponse.json(
      { error: "Failed to load reference data from Airtable.", detail: String(err) },
      { status: 502 }
    );
  }
}
