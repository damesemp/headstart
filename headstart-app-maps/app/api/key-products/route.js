import { airtableFetch, TABLES } from "../../lib/airtable";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const manufacturerId = (searchParams.get("manufacturerId") || "").trim();
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  if (!manufacturerId) return Response.json({ results: [] });

  const [mfrData, requestsData] = await Promise.all([
    airtableFetch(`/${TABLES.MANUFACTURERS}/${manufacturerId}`),
    airtableFetch(
      `/${TABLES.APPLICATION_MAP_REQUESTS}?pageSize=100&fields%5B%5D=Key+Product&fields%5B%5D=Manufacturer`
    ),
  ]);

  // Try both possible field names for robustness
  const rawProducts =
    mfrData.fields?.["Key Products"] ||
    mfrData.fields?.["Key products"] ||
    "";

  const fromCatalog = rawProducts
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const fromSubmissions = (requestsData.records || [])
    .filter((r) => (r.fields["Manufacturer"] || []).includes(manufacturerId))
    .map((r) => (r.fields["Key Product"] || "").trim())
    .filter(Boolean);

  const seen = new Set();
  const merged = [];
  for (const name of [...fromCatalog, ...fromSubmissions]) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(name);
    }
  }

  const results = q
    ? merged.filter((name) => name.toLowerCase().includes(q))
    : merged;

  return Response.json({ results: results.slice(0, 15) });
}
