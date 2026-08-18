import HotspotMap from "../../components/HotspotMap";
import {
  SMART_WATCH_IMAGE_SRC,
  SMART_RING_IMAGE_SRC,
  SMART_GLASSES_IMAGE_SRC,
} from "../../lib/deviceImages";

// Step 4 — second hotspot map. Wearables has three device variants, each
// with its own image and hotspot set (Airtable's Hotspots.Device Variant
// field). Application Model string must match Application Mapping exactly:
// "Wearables" (confirmed live 18 August).
export default function WearablesPage() {
  return (
    <HotspotMap
      applicationModel="Wearables"
      variantImages={{
        "Smart Watch": SMART_WATCH_IMAGE_SRC,
        "Smart Ring": SMART_RING_IMAGE_SRC,
        "Smart Glasses": SMART_GLASSES_IMAGE_SRC,
      }}
    />
  );
}
