import { handleUpload } from "@vercel/blob/client";

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const lower = pathname.toLowerCase();

        // Manufacturer line-card / datasheet PDFs, from the Manufacturer
        // Links tab. Public access, matching every other Blob store this
        // project uses (videos, application images) — a private blob issues
        // signed URLs that expire, which Manufacturer Links must never do.
        if (pathname.startsWith("Manufacturer PDFs/") && lower.endsWith(".pdf")) {
          return { allowedContentTypes: ["application/pdf"], addRandomSuffix: true };
        }

        throw new Error("Only Manufacturer PDFs (.pdf) may be uploaded here.");
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
