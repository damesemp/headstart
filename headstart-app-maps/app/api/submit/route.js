import { airtableFetch, TABLES, FIELDS } from "../../lib/airtable";

export async function POST(request) {
  const body = await request.json();
  const { manufacturerId, keyProduct, usedInId, proposedNewArea, whyThisFits, submittedBy } =
    body || {};

  const hasUsedIn = usedInId || (proposedNewArea && proposedNewArea.trim());

  if (!manufacturerId || !keyProduct || !hasUsedIn || !whyThisFits || !submittedBy) {
    return Response.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  const fields = {
    "Submitted By": submittedBy,
    Manufacturer: [manufacturerId],
    "Key Product": keyProduct,
    "Why This Fits": whyThisFits,
    Status: "Needs Review",
  };

  if (usedInId) {
    fields["Used In"] = [usedInId];
  } else {
    fields["Proposed New Application Area"] = proposedNewArea.trim();
  }

  const record = { fields };

  const data = await airtableFetch(
    `/${TABLES.APPLICATION_MAP_REQUESTS}`,
    {
      method: "POST",
      body: JSON.stringify({ records: [record] }),
    }
  );

  return Response.json({ ok: true, id: data.records?.[0]?.id });
}
