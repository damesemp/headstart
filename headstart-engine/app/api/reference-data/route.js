import { NextResponse } from "next/server";
import { TABLES, FIELDS, airtableFetchAll } from "../../lib/airtable";

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
  };
}

function mappingShape(record) {
  const f = record.fields;
  return {
    id: record.id,
    mappingId: f[FIELDS.APPLICATION_MAPPING.MAPPING_ID] || "",
    applicationModel: f[FIELDS.APPLICATION_MAPPING.APPLICATION_MODEL] || "",
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

    const [manufacturerRecords, mappingRecords, competitorRecords] = await Promise.all([
      airtableFetchAll(TABLES.MANUFACTURERS),
      airtableFetchAll(TABLES.APPLICATION_MAPPING, { filterByFormula: showInModelFormula }),
      airtableFetchAll(TABLES.COMPETITOR_TRIGGERS),
    ]);

    const manufacturers = manufacturerRecords.map(manufacturerShape);
    const applicationMapping = mappingRecords.map(mappingShape);
    const competitorTriggers = competitorRecords.map(competitorTriggerShape);
    const manufacturerApplicationIndex = buildManufacturerApplicationIndex(applicationMapping);

    return NextResponse.json({
      manufacturers,
      applicationMapping,
      competitorTriggers,
      manufacturerApplicationIndex,
      meta: {
        mappedCount: applicationMapping.length,
        manufacturerCount: manufacturers.length,
        competitorTriggerCount: competitorTriggers.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load reference data from Airtable.", detail: String(err) },
      { status: 502 }
    );
  }
}
