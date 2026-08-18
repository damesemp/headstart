import HotspotMap from "../../components/HotspotMap";
import { COMBAT_DRONE_IMAGE_SRC, SURVEILLANCE_DRONE_IMAGE_SRC } from "../../lib/deviceImages";

// Step 4 — third hotspot map. Military Drones has two device variants.
// Application Model string must match Application Mapping exactly:
// "Military Drones - Air" (confirmed live 18 August — note the " - Air"
// suffix, not just "Military Drones").
export default function MilitaryDronesPage() {
  return (
    <HotspotMap
      applicationModel="Military Drones - Air"
      variantImages={{
        "Combat Drone": COMBAT_DRONE_IMAGE_SRC,
        "Surveillance Drone": SURVEILLANCE_DRONE_IMAGE_SRC,
      }}
    />
  );
}
