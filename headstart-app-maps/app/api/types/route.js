import { airtableFetch, FIELDS, TABLES } from "../../lib/airtable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Types for the hotspot mapper's Type picker, plus the Application Areas
// available for a given Type's Segment. Areas are filtered by Segment so a
// hotspot on a Smart Watch can't be linked to a Defence area by accident.

export async function GET(request) {
  try {
    const typesData = await airtableFetch(
      `/${TABLES.TYPES}?returnFieldsByFieldId=true`,
      { cache: "no-store" }
    );
    const types = (typesData.records || [])
      .map((r) => {
        const f = r.fields || {};
        return {
          id: r.id,
          name: f[FIELDS.TYPES.TYPE_NAME] || "",
          segment: f[FIELDS.TYPES.SEGMENT] || "",
          applicationImageUrl: f[FIELDS.TYPES.APPLICATION_IMAGE_URL] || "",
        };
      })
      .filter((t) => t.name)
      .sort((a, b) =>
        a.segment === b.segment ? a.name.localeCompare(b.name) : a.segment.localeCompare(b.segment)
      );

    const areasData = await airtableFetch(
      `/${TABLES.APPLICATION_AREAS}?returnFieldsByFieldId=true`,
      { cache: "no-store" }
    );
    const applicationAreas = (areasData.records || [])
      .map((r) => {
        const f = r.fields || {};
        return {
          id: r.id,
          fullPath: f[FIELDS.APPLICATION_AREAS.FULL_PATH] || "",
          segment: f[FIELDS.APPLICATION_AREAS.SEGMENT] || "",
          system: f[FIELDS.APPLICATION_AREAS.SYSTEM] || "",
          applicationArea: f[FIELDS.APPLICATION_AREAS.APPLICATION_AREA] || "",
        };
      })
      .filter((a) => a.fullPath)
      .sort((a, b) => a.fullPath.localeCompare(b.fullPath));

    return Response.json({ types, applicationAreas });
  } catch (error) {
    return Response.json(
      { error: "Couldn't load types.", detail: error.message },
      { status: 502 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { id, applicationImageUrl } = await request.json();
    if (!id) return Response.json({ error: "A type id is required." }, { status: 400 });
    if (typeof applicationImageUrl !== "string")
      return Response.json({ error: "An image URL is required." }, { status: 400 });

    const updated = await airtableFetch(`/${TABLES.TYPES}?returnFieldsByFieldId=true`, {
      method: "PATCH",
      body: JSON.stringify({
        records: [{ id, fields: { [FIELDS.TYPES.APPLICATION_IMAGE_URL]: applicationImageUrl } }],
      }),
    });

    const f = updated.records[0].fields || {};
    return Response.json({
      type: {
        id: updated.records[0].id,
        name: f[FIELDS.TYPES.TYPE_NAME] || "",
        segment: f[FIELDS.TYPES.SEGMENT] || "",
        applicationImageUrl: f[FIELDS.TYPES.APPLICATION_IMAGE_URL] || "",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Couldn't save the image.", detail: error.message },
      { status: 502 }
    );
  }
}
