import { airtableFetch, TABLES, FIELDS } from "../../lib/airtable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function manufacturerLinksPath(suffix = "") {
  return `/${TABLES.MANUFACTURERS}${suffix}?returnFieldsByFieldId=true`;
}

function shape(record) {
  const fields = record.fields || {};
  return {
    id: record.id,
    name: fields[FIELDS.MANUFACTURERS.NAME] || "(unnamed)",
    website: fields[FIELDS.MANUFACTURERS.WEBSITE] || "",
    featuredLinkUrl: fields[FIELDS.MANUFACTURERS.FEATURED_LINK_URL] || "",
    featuredLinkLabel: fields[FIELDS.MANUFACTURERS.FEATURED_LINK_LABEL] || "",
    pdfUrl: fields[FIELDS.MANUFACTURERS.PDF_URL] || "",
  };
}

// GET /api/manufacturer-links?q=search — searches by name, returns the
// current link fields for each match so the tab can show what's already set
// without a second round trip.
export async function GET(request) {
  try {
    const q = (new URL(request.url).searchParams.get("q") || "").trim();

    const params = new URLSearchParams();
    params.set("pageSize", "25");
    params.set("returnFieldsByFieldId", "true");
    if (q) {
      const escaped = q.replace(/"/g, '\\"');
      params.set(
        "filterByFormula",
        `SEARCH(LOWER("${escaped}"), LOWER({Manufacturer}))`
      );
    }

    // Built directly, not via manufacturerLinksPath() — that helper already
    // appends its own "?returnFieldsByFieldId=true", which combined with a
    // second query string here produced two "?" in the URL (caught in
    // review, 5 Oct 2026). manufacturerLinksPath() is still correct for
    // PATCH below, where the suffix is just "/{id}" with no query of its own.
    const data = await airtableFetch(`/${TABLES.MANUFACTURERS}?${params.toString()}`);
    const results = (data.records || []).map(shape).sort((a, b) => a.name.localeCompare(b.name));
    return Response.json({ results });
  } catch (error) {
    return Response.json(
      { error: "Couldn't load manufacturers.", detail: error.message },
      { status: 502 }
    );
  }
}

// PATCH /api/manufacturer-links — saves Featured Link URL/Label and PDF URL
// for one manufacturer. Website is read-only here (set elsewhere) and never
// written by this route. No logo field — dropped by decision, 5 Oct 2026.
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, featuredLinkUrl, featuredLinkLabel, pdfUrl } = body || {};

    if (!id || !/^rec[a-zA-Z0-9]+$/.test(id)) {
      return Response.json({ error: "Invalid manufacturer record." }, { status: 400 });
    }

    function checkUrl(value, fieldLabel) {
      const trimmed = (value || "").trim();
      if (!trimmed) return "";
      let parsed;
      try {
        parsed = new URL(trimmed);
      } catch {
        throw new Error(`${fieldLabel} is not a valid URL.`);
      }
      if (parsed.protocol !== "https:") {
        throw new Error(`${fieldLabel} must use HTTPS.`);
      }
      return parsed.toString();
    }

    let cleanFeaturedUrl, cleanPdfUrl;
    try {
      cleanFeaturedUrl = checkUrl(featuredLinkUrl, "Featured Link URL");
      cleanPdfUrl = checkUrl(pdfUrl, "PDF URL");
    } catch (validationError) {
      return Response.json({ error: validationError.message }, { status: 400 });
    }

    const fields = {
      [FIELDS.MANUFACTURERS.FEATURED_LINK_URL]: cleanFeaturedUrl,
      [FIELDS.MANUFACTURERS.FEATURED_LINK_LABEL]: (featuredLinkLabel || "").trim(),
      [FIELDS.MANUFACTURERS.PDF_URL]: cleanPdfUrl,
    };

    const saved = await airtableFetch(manufacturerLinksPath(`/${id}`), {
      method: "PATCH",
      // returnFieldsByFieldId must be in the body on writes, not just the
      // URL, or the response comes back keyed by field name and shape()
      // reads nothing. Same rule as Videos and Hotspots.
      body: JSON.stringify({ fields, returnFieldsByFieldId: true }),
    });

    return Response.json({ ok: true, manufacturer: shape(saved) });
  } catch (error) {
    return Response.json(
      { error: "Couldn't save the links.", detail: error.message },
      { status: 502 }
    );
  }
}
