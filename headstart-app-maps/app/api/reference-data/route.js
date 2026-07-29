// GET /api/reference-data
// Fetches Types, Application Areas (Submission Status = "Open for submission"
// only), and Manufacturers live from Airtable, shaped exactly like the old
// static REFERENCE_DATA object. The form calls this on page load instead of
// importing a static file, so Airtable stays the single source of truth.

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TYPES_TABLE_ID = "tblJxyqfDeygPaEYD";
const APPLICATION_AREAS_TABLE_ID = "tblZAviGraX2g9vO2";
const SEGMENTS_TABLE_ID = "tbl0gAE9zJpNath0Q";

async function airtableList(baseId, tableId, apiKey, params = "") {
  const records = [];
  let offset = "";
  do {
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}?pageSize=100${params}${
      offset ? `&offset=${offset}` : ""
    }`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store"
    });
    if (!res.ok) {
      throw new Error(`Airtable fetch failed for ${tableId}: ${res.status}`);
    }
    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);
  return records;
}

export async function GET() {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_MANUFACTURERS_TABLE_ID } = process.env;

  try {
    const [typeRecords, areaRecords, mfrRecords, segmentRecords] = await Promise.all([
      airtableList(AIRTABLE_BASE_ID, TYPES_TABLE_ID, AIRTABLE_API_KEY),
      airtableList(
        AIRTABLE_BASE_ID,
        APPLICATION_AREAS_TABLE_ID,
        AIRTABLE_API_KEY,
        `&filterByFormula=${encodeURIComponent(
          '{Submission Status}="Open for submission"'
        )}`
      ),
      airtableList(AIRTABLE_BASE_ID, AIRTABLE_MANUFACTURERS_TABLE_ID, AIRTABLE_API_KEY),
      airtableList(AIRTABLE_BASE_ID, SEGMENTS_TABLE_ID, AIRTABLE_API_KEY)
    ]);

    const types = typeRecords.map((r) => ({
      id: r.id,
      name: r.fields["Type Name"] || "(unnamed)",
      segment: r.fields["Segment"] || null
    }));

    const applicationAreas = areaRecords.map((r) => ({
      id: r.id,
      segment: r.fields["Segment"] || null,
      label: `${r.fields["System"] || ""} — ${r.fields["Application Area"] || ""}`,
      relevantTypes: r.fields["Relevant Types"] || []
    }));

    const segmentsByIndustry = {};
    areaRecords.forEach((r) => {
      const industry = r.fields["Industry"];
      const segment = r.fields["Segment"];
      if (!industry || !segment) return;
      if (!segmentsByIndustry[industry]) segmentsByIndustry[industry] = new Set();
      segmentsByIndustry[industry].add(segment);
    });
    const segments = {};
    Object.entries(segmentsByIndustry).forEach(([industry, segSet]) => {
      segments[industry] = [...segSet];
    });

    const segmentDiagramStatus = {};
    segmentRecords.forEach((r) => {
      const name = r.fields["Segment Name"];
      if (!name) return;
      segmentDiagramStatus[name] = !!r.fields["Has Diagram"];
    });

    const manufacturers = mfrRecords
      .map((r) => {
        const name = Array.isArray(r.fields["Manufacturer"])
          ? r.fields["Manufacturer"][0]
          : r.fields["Manufacturer"];
        const rawProducts = r.fields["Key Products"] || "";
        const products = String(rawProducts)
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean);
        return { name, products };
      })
      .filter((m) => m.name)
      .sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({
      industries: Object.keys(segments),
      segments,
      types,
      applicationAreas,
      manufacturers,
      segmentDiagramStatus
    });
  } catch (err) {
    return Response.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
