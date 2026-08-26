import { airtableFetch, FIELDS, TABLES } from "../../lib/airtable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function videoShape(record) {
  const fields = record.fields || {};
  return {
    id: record.id,
    typeIds: fields[FIELDS.VIDEOS.TYPE] || [],
    title: fields[FIELDS.VIDEOS.TITLE] || "",
    description: fields[FIELDS.VIDEOS.DESCRIPTION] || "",
    fileUrl: fields[FIELDS.VIDEOS.FILE_URL] || "",
    internalOnly: !!fields[FIELDS.VIDEOS.INTERNAL_ONLY],
  };
}

function videosPath(suffix = "") {
  return `/${TABLES.VIDEOS}${suffix}?returnFieldsByFieldId=true`;
}

export async function GET(request) {
  try {
    const typeId = new URL(request.url).searchParams.get("typeId");
    const data = await airtableFetch(videosPath(), { cache: "no-store" });
    const videos = (data.records || [])
      .map(videoShape)
      .filter((video) => !typeId || video.typeIds.includes(typeId))
      .sort((a, b) => a.title.localeCompare(b.title));
    return Response.json({ videos });
  } catch (error) {
    return Response.json(
      { error: "Couldn't load videos.", detail: error.message },
      { status: 502 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, typeId, title, description, fileUrl, internalOnly } = body || {};

    if (!typeId || !title?.trim() || !fileUrl?.trim()) {
      return Response.json({ error: "Type, title and video file are required." }, { status: 400 });
    }
    if (id && !/^rec[a-zA-Z0-9]+$/.test(id)) {
      return Response.json({ error: "Invalid video record." }, { status: 400 });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(fileUrl);
    } catch {
      return Response.json({ error: "Invalid video URL." }, { status: 400 });
    }
    if (parsedUrl.protocol !== "https:") {
      return Response.json({ error: "Video URLs must use HTTPS." }, { status: 400 });
    }

    const fields = {
      [FIELDS.VIDEOS.TYPE]: [typeId],
      [FIELDS.VIDEOS.TITLE]: title.trim(),
      [FIELDS.VIDEOS.DESCRIPTION]: description?.trim() || "",
      [FIELDS.VIDEOS.FILE_URL]: parsedUrl.toString(),
      [FIELDS.VIDEOS.INTERNAL_ONLY]: !!internalOnly,
    };

    const saved = await airtableFetch(videosPath(id ? `/${id}` : ""), {
      method: id ? "PATCH" : "POST",
      // returnFieldsByFieldId must be in the body on writes, not just the URL,
      // or the response comes back keyed by field name and videoShape reads
      // nothing. Same bug that bit the hotspot mapper.
      body: JSON.stringify({ fields, returnFieldsByFieldId: true }),
    });

    return Response.json({ ok: true, video: videoShape(saved) });
  } catch (error) {
    return Response.json(
      { error: "Couldn't save the video.", detail: error.message },
      { status: 502 }
    );
  }
}
