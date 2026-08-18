import { handleUpload } from "@vercel/blob/client";

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("headstart-videos/") || !pathname.toLowerCase().endsWith(".mp4")) {
          throw new Error("Only Headstart MP4 uploads are allowed.");
        }
        return {
          allowedContentTypes: ["video/mp4"],
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
