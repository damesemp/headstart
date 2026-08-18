const { chromium } = require('/opt/node-tools/node_modules/playwright');

const mockData = {
  manufacturers: [
    { id: "recp7UqVuRir7iwcZ", name: "Nicomatic", coreAdvantages: "Compact modular connectors." },
    { id: "recMIYfnAlKqzG2as", name: "LEMO", coreAdvantages: "Rugged circular connectors." },
    { id: "rec6wLA9CxzSIn7Wq", name: "Staubli", coreAdvantages: "High-current modular connectors." },
    { id: "rec0dBgVQWIKLt0YR", name: "Amphenol", coreAdvantages: "Rugged interconnect families." },
    { id: "rec8194zi8zbzt5H2", name: "I-PEX", coreAdvantages: "Micro-coaxial interconnect." },
    { id: "recrQzsCGhOM2Z2C3", name: "CamdenBoss", coreAdvantages: "Enclosures and DIN-rail housings." },
  ],
  hotspots: [
    { id: "recJ2CvPlJ7ItASLj", hotspotId: "cabling-harness", label: "Cabling / Harness", x: 33, y: 37, smartZoom: 140, labelX: -62, labelY: -62, labelSide: "centre" },
    { id: "recjnS8adOl86aVpy", hotspotId: "base-housing", label: "Base / Mounting", x: 42, y: 91.5, smartZoom: 130, labelX: 0, labelY: -62, labelSide: "centre" },
    { id: "recPXOtQyzkx9uNos", hotspotId: "shoulder-joint", label: "Shoulder Joint", x: 26.3, y: 16.1, smartZoom: 140, labelX: -34, labelY: -62, labelSide: "centre" },
    { id: "recQBUBJogf9HHjw1", hotspotId: "wrist-rotation", label: "Wrist / Rotation", x: 69.6, y: 9.5, smartZoom: 148, labelX: 0, labelY: -62, labelSide: "centre" },
    { id: "recDXIslpIYJGpKzx", hotspotId: "elbow-axis", label: "Elbow Articulation", x: 57, y: 15, smartZoom: 148, labelX: 0, labelY: -62, labelSide: "centre" },
    { id: "recsvDQOhpNLeWkGN", hotspotId: "lower-axis", label: "Lower joint / Main Axis", x: 38, y: 53, smartZoom: 130, labelX: -70, labelY: -62, labelSide: "centre" },
    { id: "recuCjInakAp9rJuf", hotspotId: "end-effector", label: "End / Gripper", x: 75.3, y: 4.5, smartZoom: 148, labelX: 0, labelY: -62, labelSide: "centre" },
  ],
  applicationMapping: [
    { id: "rec1", applicationModel: "Robotics & Automation", hotspotId: "cabling-harness", relevantAstuteLine: ["recp7UqVuRir7iwcZ"], fitType: "Also Relevant", whyThisLineFits: "Compact modular and board-level interconnect.", questions: "What power, signal or data lines run through the arm?\nAre connectors exposed to movement, vibration, oil, dust or washdown?", nextActions: "Ask for the connector and harness architecture.\nPosition rugged connector and cable assembly options." },
    { id: "rec2", applicationModel: "Robotics & Automation", hotspotId: "cabling-harness", relevantAstuteLine: ["recMIYfnAlKqzG2as"], fitType: "Best Fit", whyThisLineFits: "Rugged circular and push-pull interconnect.", questions: "What power, signal or data lines run through the arm?\nAre connectors exposed to movement, vibration, oil, dust or washdown?", nextActions: "Ask for the connector and harness architecture.\nPosition rugged connector and cable assembly options." },
    { id: "rec3", applicationModel: "Robotics & Automation", hotspotId: "cabling-harness", relevantAstuteLine: ["rec6wLA9CxzSIn7Wq"], fitType: "Best Fit", whyThisLineFits: "High-current modular connector content.", questions: "What power, signal or data lines run through the arm?", nextActions: "Ask for the connector and harness architecture." },
    { id: "rec4", applicationModel: "Robotics & Automation", hotspotId: "base-housing", relevantAstuteLine: ["recrQzsCGhOM2Z2C3"], fitType: "Related Opportunity", whyThisLineFits: "Enclosures and DIN-rail housings.", questions: "What voltage rails and power distribution are required at the base?", nextActions: "Qualify power input, voltage rails and protection requirements." },
  ],
  competitorTriggers: [],
  videos: [],
  manufacturerApplicationIndex: {},
  meta: {},
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.route('**/api/reference-data', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockData) });
  });

  await page.goto('http://localhost:4000/applications/robotics-automation', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/claude/hotspotmap_nothing_selected.png' });

  // Click the "Cabling / Harness" hotspot (33%, 37%)
  const stage = await page.$('.hs-hsmap-imgwrap');
  const box = await stage.boundingBox();
  await page.mouse.click(box.x + box.width * 0.33, box.y + box.height * 0.37);
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/home/claude/hotspotmap_selected.png' });

  await browser.close();
  console.log('done');
})();
