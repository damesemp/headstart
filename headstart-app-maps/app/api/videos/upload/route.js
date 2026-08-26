import { handleUpload } from "@vercel/blob/client";

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const lower = pathname.toLowerCase();

        // Videos, from the Videos tab.
        if (pathname.startsWith("headstart-videos/") && lower.endsWith(".mp4")) {
          return { allowedContentTypes: ["video/mp4"], addRandomSuffix: true };
        }

        // Application images, from the hotspot mapper. Same folder the six
        // existing device images live in, so everything media-side stays in
        // one place. Public access, matching the store — a private blob
        // issues signed URLs that expire, which is what these must never do.
        if (
          pathname.startsWith("Application Images/") &&
          /\.(webp|png|jpe?g)$/.test(lower)
        ) {
          return {
            allowedContentTypes: ["image/webp", "image/png", "image/jpeg"],
            addRandomSuffix: true,
          };
        }

        throw new Error(
          "Only Headstart MP4 videos or Application Images (webp/png/jpg) may be uploaded."
        );
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
