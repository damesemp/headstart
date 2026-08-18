import HotspotMap from "../../components/HotspotMap";
import { ROBOTICS_AUTOMATION_IMAGE_SRC } from "../../lib/deviceImages";

// Step 4 — first hotspot map, Robotics & Automation. Application Model
// string must match Application Mapping's Application Model field exactly
// ("Robotics & Automation"), since that's how HotspotMap resolves which
// hotspots and manufacturers belong to this page.
export default function RoboticsAutomationPage() {
  return (
    <HotspotMap
      applicationModel="Robotics & Automation"
      imageSrc={ROBOTICS_AUTOMATION_IMAGE_SRC}
    />
  );
}
