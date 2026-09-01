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
  // Match on the Mapping ID formula field ("<hotspot> – <manufacturer>"),
  // which is plain text. ARRAYJOIN over the linked-record field returned
  // nothing for manufacturers that plainly had approved mappings, so the
  // panel showed no live rows at all. (1 Sep 2026.)
  liveParams.set(
    "filterByFormula",
    `FIND(LOWER("${safe}"), LOWER({Mapping ID} & ""))`
  );
  liveParams.set("fields[]", "Application Model");
  liveParams.append("fields[]", "Fit Type");
  liveParams.append("fields[]", "Review Status");

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
      // "Show in Model" was deleted on 28 Aug 2026. A mapping is live
      // when it is Approved — that is now the Engine's only gate.
      showInModel: r.fields["Review Status"] === "Approved",
    }));

  // A request that has been converted is already showing in the live list as
  // the mapping it became, and a rejected one is not coming back. Neither
  // belongs in a panel labelled "already mapped" as PENDING.
  const pending = (pendingData.records || [])
    .filter((r) => {
      const status = r.fields["Status"] || "";
      return status !== "Converted to Application Mapping" && status !== "Rejected";
    })
    .reverse()
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      keyProduct: r.fields["Key Product"] || "",
      status: r.fields["Status"] || "",
    }));

  return Response.json({ live, pending });
}
