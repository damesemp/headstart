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
    shortDescription: f[FIELDS.MANUFACTURERS.SHORT_DESCRIPTION] || "",
    longDescription: f[FIELDS.MANUFACTURERS.LONG_DESCRIPTION] || "",
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

    const [manufacturerRecords, hotspotRecords, mappingRecords, competitorRecords, videoRecords] =
      await Promise.all([
        airtableFetchAll(TABLES.MANUFACTURERS),
        airtableFetchAll(TABLES.HOTSPOTS),
        airtableFetchAll(TABLES.APPLICATION_MAPPING, { filterByFormula: showInModelFormula }),
        airtableFetchAll(TABLES.COMPETITOR_TRIGGERS),
        airtableFetchAll(TABLES.VIDEOS),
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

    return NextResponse.json({
      manufacturers,
      hotspots,
      applicationMapping,
      competitorTriggers,
      videos,
      manufacturerApplicationIndex,
      meta: {
        mappedCount: applicationMapping.length,
        manufacturerCount: manufacturers.length,
        hotspotCount: hotspots.length,
        competitorTriggerCount: competitorTriggers.length,
        videoCount: videos.length,
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
