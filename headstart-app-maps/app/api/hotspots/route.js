import { airtableFetch, FIELDS, TABLES } from "../../lib/airtable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Hotspot mapper API.
//
// Two rules this route enforces so a UI bug can never violate them:
//
//   1. Device Variant is always set from the selected Type's name, never
//      from client input. That string is the join between a Type, its
//      application image and the Engine's map — a typo silently breaks a map.
//   2. Newly created hotspots are always Status "Draft". The Engine renders
//      only "Live", so nothing placed here can reach the public site until a
//      reviewer promotes it.

function hotspotShape(record) {
  const f = record.fields || {};
  return {
    id: record.id,
    label: f[FIELDS.HOTSPOTS.LABEL] || "",
    hotspotId: f[FIELDS.HOTSPOTS.HOTSPOT_ID] || "",
    x: f[FIELDS.HOTSPOTS.X] ?? null,
    y: f[FIELDS.HOTSPOTS.Y] ?? null,
    smartZoom: f[FIELDS.HOTSPOTS.SMART_ZOOM] ?? null,
    labelX: f[FIELDS.HOTSPOTS.LABEL_X] ?? 0,
    labelY: f[FIELDS.HOTSPOTS.LABEL_Y] ?? 0,
    labelSide: f[FIELDS.HOTSPOTS.LABEL_SIDE] || "centre",
    deviceVariant: f[FIELDS.HOTSPOTS.DEVICE_VARIANT] || "",
    applicationAreaIds: f[FIELDS.HOTSPOTS.APPLICATION_AREAS] || [],
    status: f[FIELDS.HOTSPOTS.STATUS] || null,
  };
}

function path(table, suffix = "") {
  return `/${table}${suffix}?returnFieldsByFieldId=true`;
}

async function typeById(typeId) {
  const data = await airtableFetch(path(TABLES.TYPES, `/${typeId}`), { cache: "no-store" });
  const f = data.fields || {};
  return {
    id: data.id,
    name: f[FIELDS.TYPES.TYPE_NAME] || "",
    segment: f[FIELDS.TYPES.SEGMENT] || "",
    applicationImageUrl: f[FIELDS.TYPES.APPLICATION_IMAGE_URL] || "",
  };
}

// Slug used for Hotspot ID when the client doesn't supply one. Must be
// unique across the whole table — the Engine keys hotspots by it.
function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function allHotspots() {
  const out = [];
  let offset;
  do {
    const suffix = offset ? `&offset=${encodeURIComponent(offset)}` : "";
    const data = await airtableFetch(path(TABLES.HOTSPOTS) + suffix, { cache: "no-store" });
    out.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return out;
}

export async function GET(request) {
  try {
    const typeId = new URL(request.url).searchParams.get("typeId");
    const records = await allHotspots();
    const hotspots = records.map(hotspotShape);

    if (!typeId) return Response.json({ hotspots });

    const type = await typeById(typeId);
    const mine = hotspots
      .filter((h) => h.deviceVariant === type.name)
      .sort((a, b) => a.label.localeCompare(b.label));

    return Response.json({ type, hotspots: mine });
  } catch (error) {
    return Response.json(
      { error: "Couldn't load hotspots.", detail: error.message },
      { status: 502 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { typeId, label, hotspotId, x, y, smartZoom, labelX, labelY, labelSide, applicationAreaIds } = body;

    if (!typeId) return Response.json({ error: "A Type must be selected." }, { status: 400 });
    if (!label || !String(label).trim())
      return Response.json({ error: "A label is required." }, { status: 400 });
    if (typeof x !== "number" || typeof y !== "number")
      return Response.json({ error: "Coordinates are required." }, { status: 400 });

    const type = await typeById(typeId);
    if (!type.name) return Response.json({ error: "That Type no longer exists." }, { status: 400 });

    const wanted = slugify(hotspotId || `${type.name}-${label}`);
    const existing = (await allHotspots()).map(hotspotShape);
    if (existing.some((h) => h.hotspotId === wanted)) {
      return Response.json(
        { error: `Hotspot ID "${wanted}" is already in use. Choose another.` },
        { status: 409 }
      );
    }

    const fields = {
      [FIELDS.HOTSPOTS.LABEL]: String(label).trim(),
      [FIELDS.HOTSPOTS.HOTSPOT_ID]: wanted,
      [FIELDS.HOTSPOTS.X]: Math.round(x * 10) / 10,
      [FIELDS.HOTSPOTS.Y]: Math.round(y * 10) / 10,
      [FIELDS.HOTSPOTS.SMART_ZOOM]: Number(smartZoom) || 150,
      [FIELDS.HOTSPOTS.LABEL_X]: Number(labelX) || 0,
      [FIELDS.HOTSPOTS.LABEL_Y]: Number(labelY) || 0,
      [FIELDS.HOTSPOTS.LABEL_SIDE]: labelSide || "centre",
      // Never from the client — see the note at the top of this file.
      [FIELDS.HOTSPOTS.DEVICE_VARIANT]: type.name,
      [FIELDS.HOTSPOTS.STATUS]: "Draft",
    };
    if (Array.isArray(applicationAreaIds) && applicationAreaIds.length) {
      fields[FIELDS.HOTSPOTS.APPLICATION_AREAS] = applicationAreaIds;
    }

    const created = await airtableFetch(path(TABLES.HOTSPOTS), {
      method: "POST",
      // returnFieldsByFieldId works as a query param on reads, but on create
      // and update it must be in the BODY. Without it Airtable answers with
      // fields keyed by NAME, hotspotShape reads them by ID, and the caller
      // gets a record that looks empty -- which then gets saved back over the
      // real values. This was a real bug, not a precaution.
      body: JSON.stringify({ records: [{ fields }], typecast: false, returnFieldsByFieldId: true }),
    });

    return Response.json({ hotspot: hotspotShape(created.records[0]) });
  } catch (error) {
    return Response.json(
      { error: "Couldn't create the hotspot.", detail: error.message },
      { status: 502 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return Response.json({ error: "A hotspot id is required." }, { status: 400 });

    const fields = {};
    const set = (key, value) => {
      if (value !== undefined) fields[key] = value;
    };

    // A hotspot with no label is useless and unfindable. Refuse rather than
    // silently storing an empty one.
    if (body.label !== undefined) {
      const trimmed = String(body.label).trim();
      if (!trimmed) return Response.json({ error: "A label is required." }, { status: 400 });
      set(FIELDS.HOTSPOTS.LABEL, trimmed);
    }
    if (typeof body.x === "number") set(FIELDS.HOTSPOTS.X, Math.round(body.x * 10) / 10);
    if (typeof body.y === "number") set(FIELDS.HOTSPOTS.Y, Math.round(body.y * 10) / 10);
    if (body.smartZoom !== undefined) set(FIELDS.HOTSPOTS.SMART_ZOOM, Number(body.smartZoom) || 150);
    if (body.labelX !== undefined) set(FIELDS.HOTSPOTS.LABEL_X, Number(body.labelX) || 0);
    if (body.labelY !== undefined) set(FIELDS.HOTSPOTS.LABEL_Y, Number(body.labelY) || 0);
    if (body.labelSide !== undefined) set(FIELDS.HOTSPOTS.LABEL_SIDE, body.labelSide || "centre");
    if (body.applicationAreaIds !== undefined)
      set(FIELDS.HOTSPOTS.APPLICATION_AREAS, body.applicationAreaIds || []);

    // Publish / discard. Archived is used instead of deleting so a mistake is
    // always recoverable.
    if (body.status !== undefined) {
      if (!["Draft", "Live", "Archived"].includes(body.status)) {
        return Response.json({ error: "Unknown status." }, { status: 400 });
      }
      set(FIELDS.HOTSPOTS.STATUS, body.status);
    }

    // Guard the one transition that reaches the public site.
    if (body.status === "Live") {
      const current = (await allHotspots()).map(hotspotShape).find((h) => h.id === id);
      const label = fields[FIELDS.HOTSPOTS.LABEL] ?? current?.label;
      const x = fields[FIELDS.HOTSPOTS.X] ?? current?.x;
      const y = fields[FIELDS.HOTSPOTS.Y] ?? current?.y;
      if (!label || !String(label).trim() || typeof x !== "number" || typeof y !== "number") {
        return Response.json(
          { error: "This hotspot needs a label and a position before it can go live." },
          { status: 400 }
        );
      }
    }

    if (!Object.keys(fields).length)
      return Response.json({ error: "Nothing to update." }, { status: 400 });

    const updated = await airtableFetch(path(TABLES.HOTSPOTS), {
      method: "PATCH",
      body: JSON.stringify({ records: [{ id, fields }], typecast: false, returnFieldsByFieldId: true }),
    });

    return Response.json({ hotspot: hotspotShape(updated.records[0]) });
  } catch (error) {
    return Response.json(
      { error: "Couldn't update the hotspot.", detail: error.message },
      { status: 502 }
    );
  }
}
