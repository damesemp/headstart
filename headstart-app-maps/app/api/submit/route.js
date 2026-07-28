// POST /api/submit
// Body: { manufacturer, product, typeIds, areaIds, whyFits }
// Requires env vars (set in Vercel project settings — never in client code):
//   AIRTABLE_API_KEY
//   AIRTABLE_BASE_ID                  e.g. app2N1SillR5AqtSC
//   AIRTABLE_TABLE_ID                 Application Map Requests -> tbltYrKYfGVkWwdR1
//   AIRTABLE_MANUFACTURERS_TABLE_ID   Manufacturers -> tblPus2aWrpNy5pwB

export async function POST(request) {
  const body = await request.json();
  const { manufacturer, product, typeIds, areaIds, whyFits } = body || {};

  if (!manufacturer || !product || !Array.isArray(typeIds) || !Array.isArray(areaIds)) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    AIRTABLE_MANUFACTURERS_TABLE_ID
  } = process.env;

  try {
    // 1. Resolve the manufacturer name to its Airtable record id.
    const mfrSearch = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_MANUFACTURERS_TABLE_ID}?filterByFormula=${encodeURIComponent(
        `{Manufacturer}="${manufacturer}"`
      )}&maxRecords=1`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    const mfrData = await mfrSearch.json();
    const mfrRecordId = mfrData.records && mfrData.records[0] && mfrData.records[0].id;

    if (!mfrRecordId) {
      return Response.json({ error: "Manufacturer not found" }, { status: 400 });
    }

    // 2. Create the Application Map Requests record.
    const createRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            Manufacturer: [mfrRecordId],
            "Key Product": product,
            Type: typeIds,
            "Used In": areaIds,
            "Why This Fits": whyFits || "",
            Status: "Needs Review"
          }
        })
      }
    );

    if (!createRes.ok) {
      const errBody = await createRes.text();
      return Response.json({ error: "Airtable create failed", detail: errBody }, { status: 502 });
    }

    const created = await createRes.json();
    return Response.json({ ok: true, id: created.id });
  } catch (err) {
    return Response.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
