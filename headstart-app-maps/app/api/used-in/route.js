import { airtableFetch, TABLES } from "../../lib/airtable";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  const params = new URLSearchParams();
  params.set("pageSize", "15");
  params.set("fields[]", "Full Path");
  if (q) {
    const formula = `SEARCH(LOWER("${q.replace(/"/g, '\\"')}"), LOWER({Full Path}))`;
    params.set("filterByFormula", formula);
  }

  const data = await airtableFetch(
    `/${TABLES.APPLICATION_AREAS}?${params.toString()}`
  );

  const results = (data.records || []).map((r) => ({
    id: r.id,
    path: r.fields["Full Path"] || "",
  }));

  return Response.json({ results });
}
