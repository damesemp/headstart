import { airtableFetch, TABLES } from "../../lib/airtable";

function escapeForFormula(s) {
  return s.replace(/"/g, '\\"');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get("name") || "").trim();
  if (!name) return Response.json({ live: [], pending: [] });

  const safe = escapeForFormula(name);

  const liveParams = new URLSearchParams();
  liveParams.set("pageSize", "20");
  liveParams.set(
    "filterByFormula",
    `FIND(LOWER("${safe}"), LOWER(ARRAYJOIN({Relevant Astute Line})))`
  );
  liveParams.set("fields[]", "Application Model");
  liveParams.append("fields[]", "Fit Type");
  liveParams.append("fields[]", "Show in Model");

  const pendingParams = new URLSearchParams();
  pendingParams.set("pageSize", "20");
  pendingParams.set(
    "filterByFormula",
    `FIND(LOWER("${safe}"), LOWER(ARRAYJOIN({Manufacturer})))`
  );
  pendingParams.set("fields[]", "Key Product");
  pendingParams.append("fields[]", "Used In");
  pendingParams.append("fields[]", "Status");

  const [liveData, pendingData] = await Promise.all([
    airtableFetch(`/${TABLES.APPLICATION_MAPPING}?${liveParams.toString()}`),
    airtableFetch(
      `/${TABLES.APPLICATION_MAP_REQUESTS}?${pendingParams.toString()}`
    ),
  ]);

  const live = (liveData.records || [])
    .reverse()
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      applicationModel: r.fields["Application Model"] || "",
      fitType: r.fields["Fit Type"] || "",
      showInModel: !!r.fields["Show in Model"],
    }));

  const pending = (pendingData.records || [])
    .reverse()
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      keyProduct: r.fields["Key Product"] || "",
      status: r.fields["Status"] || "",
    }));

  return Response.json({ live, pending });
}
