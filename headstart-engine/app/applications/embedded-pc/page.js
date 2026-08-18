import EmbeddedPCMap from "../../components/EmbeddedPCMap";

// Step 4 — fourth and last map: Embedded PC. Separate rendering system
// from the hotspot map (see EmbeddedPCMap.js header) — no device image, no
// hotspots, synthesised from all manufacturers grouped by category.
export default function EmbeddedPCPage() {
  return <EmbeddedPCMap />;
}
