import { airtableFetch, TABLES, FIELDS } from "../../lib/airtable";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  const formula = q
    ? `SEARCH(LOWER("${q.replace(/"/g, '\\"')}"), LOWER({Manufacturer}))`
    : "";

  const params = new URLSearchParams();
  params.set("pageSize", "20");
  params.set("fields[]", "Manufacturer");
  params.append("fields[]", "Key Products");
  if (formula) params.set("filterByFormula", formula);

  const data = await airtableFetch(
    `/${TABLES.MANUFACTURERS}?${params.toString()}`
  );

  const results = (data.records || []).map((r) => ({
    id: r.id,
    name: r.fields["Manufacturer"] || "",
    keyProducts: r.fields["Key Products"] || "",
  }));

  return Response.json({ results });
}
