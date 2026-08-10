// Site-wide access gate.
//
// The whole app (the form and every /api/* route) was open to anyone with the
// URL: GET /api/reference-data returns the full manufacturer catalogue, and
// POST /api/submit is an open write, with no login and no rate limiting.
//
// This adds a single shared username/password (HTTP Basic Auth), checked once
// per browser session, in front of every request. It is not full login and it
// does not identify individual BDMs — "Submitted By" on the form still does
// that. It exists to stop the API being openly scrapeable and writeable by
// anyone who finds the link.
//
// Set BASIC_AUTH_USER and BASIC_AUTH_PASS in the Vercel project's environment
// variables to turn this on. If either is unset (e.g. local dev, the test
// harness, a preview build that hasn't been configured yet) the gate is
// skipped entirely, so nothing already working breaks by default — but that
// also means access control is OFF until both variables are set. Set them
// before treating this as "protected."
export function middleware(request) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    return; // not configured — fail open, see note above
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6));
      const sepIndex = decoded.indexOf(":");
      const user = decoded.slice(0, sepIndex);
      const pass = decoded.slice(sepIndex + 1);
      if (user === expectedUser && pass === expectedPass) {
        return; // authenticated
      }
    } catch {
      // fall through to 401
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Astute Headstart"' }
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
