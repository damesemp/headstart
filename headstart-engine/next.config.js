// Nav rearchitecture, 18 Aug 2026 — Directory and all four application
// maps now live on one URL (see app/components/EngineShell.js). These
// redirects keep any previously shared /applications/... links working by
// sending them to the single-page equivalent state via query params.
const OLD_ROUTE_TO_APP = {
  "/applications/wearables": "wearables",
  "/applications/military-drones": "military-drones",
  "/applications/robotics-automation": "robotics-automation",
  "/applications/embedded-pc": "embedded-pc",
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return Object.entries(OLD_ROUTE_TO_APP).map(([source, app]) => ({
      source,
      destination: `/?app=${app}`,
      permanent: true,
    }));
  },
};

module.exports = nextConfig;
