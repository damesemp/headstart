// GET /api/mapped-for-manufacturer?name=SynQor
//
// Returns what already exists for a manufacturer, in two parts:
//
//   Live      — rows in Application Mapping with Review Status = Approved.
//               These are published in the Applications Engine right now.
//   Pending   — rows in Application Map Requests still awaiting review.
//
// Until 1 Sep 2026 this endpoint read the requests table only, so a
// manufacturer with approved mappings still showed nothing under "already
// mapped". Approved mappings are the more useful half: they tell a BDM the
// work is already done.
//
// Manufacturer name is matched exactly and case-insensitively — a substring
// match used to show "Amphenol Ltd" rows when "Amphenol" was selected.

const APPLICATION_MAPPING_TABLE_ID = "tblL0yz7X2bKBXY2M";

// Airtable formula strings are double-quoted, so escape quotes and backslashes
// before interpolating a manufacturer name.
function escapeFormulaValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function airtableList(baseId, tableId, formula, apiKey) {
  const url =
    `https://api.airtable.com/v0/${baseId}/${tableId}` +
    `?filterByFormula=${encodeURIComponent(formula)}&pageSize=50`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Airtable ${res.status} on ${tableId}: ${detail}`);
  }
  return res.json();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return Response.json({ error: "Missing manufacturer name" }, { status: 400 });
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID } = process.env;
  const safeLower = escapeFormulaValue(name).toLowerCase();

  try {
    const [liveData, pendingData] = await Promise.all([
      airtableList(
        AIRTABLE_BASE_ID,
        APPLICATION_MAPPING_TABLE_ID,
        `AND(` +
          `LOWER(ARRAYJOIN({Relevant Astute Line})) = "${safeLower}", ` +
          `{Review Status} = "Approved")`,
        AIRTABLE_API_KEY
      ),
      airtableList(
        AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_ID,
        `LOWER(ARRAYJOIN({Manufacturer})) = "${safeLower}"`,
        AIRTABLE_API_KEY
      ),
    ]);

    // Mapping ID is a formula field reading "<hotspot> – <manufacturer>", so
    // it is plain text. The linked Hotspot field returns record IDs, which
    // mean nothing to a BDM. Trim the manufacturer half off the end.
    const suffix = ` – ${name}`;
    const live = (liveData.records || []).map((r) => {
      const mappingId = r.fields["Mapping ID"] || "";
      const hotspot = mappingId.endsWith(suffix)
        ? mappingId.slice(0, -suffix.length)
        : mappingId;
      return {
        product: hotspot || r.fields["Application Model"] || "(unnamed)",
        detail: [r.fields["Application Model"], r.fields["Fit Type"]]
          .filter(Boolean)
          .join(" · "),
        status: "Live",
      };
    });

    const pending = (pendingData.records || []).map((r) => {
      const rawStatus = r.fields["Status"] || "Needs Review";
      let status = "Pending";
      if (rawStatus === "Converted to Application Mapping") status = "Promoted";
      if (rawStatus === "Rejected") status = "Rejected";
      return {
        product: r.fields["Key Product"] || "(unnamed)",
        detail: status === "Pending" ? "Awaiting review" : "",
        status,
      };
    });

    return Response.json([...live, ...pending]);
  } catch (err) {
    console.error("mapped-for-manufacturer error:", err);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}
