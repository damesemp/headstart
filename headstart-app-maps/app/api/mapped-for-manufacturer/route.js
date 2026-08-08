// GET /api/mapped-for-manufacturer?name=SynQor
// Returns existing Application Map Requests entries for a given manufacturer
// name, so the form can show "already mapped" state. Matches the manufacturer
// name exactly and case-insensitively — a substring match used to show
// "Amphenol Ltd" rows when "Amphenol" was selected.

// Airtable formula strings are double-quoted, so escape quotes and backslashes
// before interpolating a manufacturer name.
function escapeFormulaValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return Response.json({ error: "Missing manufacturer name" }, { status: 400 });
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID } = process.env;

  try {
    const pendingRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=${encodeURIComponent(
        `LOWER(ARRAYJOIN({Manufacturer})) = "${escapeFormulaValue(name).toLowerCase()}"`
      )}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    if (!pendingRes.ok) {
      const detail = await pendingRes.text();
      console.error("mapped-for-manufacturer Airtable error:", pendingRes.status, detail);
      return Response.json({ error: "Couldn't reach Airtable." }, { status: 502 });
    }
    const pendingData = await pendingRes.json();

    const pending = (pendingData.records || []).map((r) => {
      const rawStatus = r.fields["Status"] || "Needs Review";
      let status = "Pending";
      if (rawStatus === "Converted to Application Mapping") status = "Promoted";
      if (rawStatus === "Rejected") status = "Rejected";
      return {
        product: r.fields["Key Product"] || "(unnamed)",
        status
      };
    });

    return Response.json(pending);
  } catch (err) {
    console.error("mapped-for-manufacturer error:", err);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}
