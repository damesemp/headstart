// POST /api/submit
// Body: { industry, segment, manufacturer, product, typeIds, areaIds, proposedArea, whyFits }
// Requires env vars (set in Vercel project settings — never in client code):
//   AIRTABLE_API_KEY
//   AIRTABLE_BASE_ID                  e.g. app2N1SillR5AqtSC
//   AIRTABLE_TABLE_ID                 Application Map Requests -> tbltYrKYfGVkWwdR1
//   AIRTABLE_MANUFACTURERS_TABLE_ID   Manufacturers -> tblPus2aWrpNy5pwB

// Airtable formula strings are double-quoted, so a name containing a quote or a
// backslash would break — or alter — the query. Escape both before interpolating.
function escapeFormulaValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function POST(request) {
  const body = await request.json();
  const { industry, segment, manufacturer, product, typeIds, areaIds, proposedArea, whyFits } =
    body || {};

  if (!manufacturer || !product || !Array.isArray(typeIds) || !Array.isArray(areaIds)) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!industry || !segment) {
    return Response.json({ error: "Missing industry or segment" }, { status: 400 });
  }
  if (!areaIds.length && !proposedArea) {
    return Response.json({ error: "Missing application area" }, { status: 400 });
  }
  if (!whyFits || !String(whyFits).trim()) {
    return Response.json({ error: "Missing why this fits" }, { status: 400 });
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
        `{Manufacturer}="${escapeFormulaValue(manufacturer)}"`
      )}&maxRecords=1`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    if (!mfrSearch.ok) {
      return Response.json(
        { error: "Couldn't reach Airtable. Try again shortly." },
        { status: 502 }
      );
    }
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
            Industry: industry,
            Segment: segment,
            Manufacturer: [mfrRecordId],
            "Key Product": product,
            Type: typeIds,
            "Used In": areaIds,
            "Proposed New Application Area": proposedArea || "",
            "Why This Fits": whyFits || "",
            Status: "Needs Review"
          }
        })
      }
    );

    if (!createRes.ok) {
      const errBody = await createRes.text();
      console.error("Airtable create failed:", createRes.status, errBody);
      return Response.json({ error: "Couldn't save the submission." }, { status: 502 });
    }

    const created = await createRes.json();
    return Response.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("submit route error:", err);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}
