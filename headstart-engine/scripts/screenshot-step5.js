const { chromium } = require('/opt/node-tools/node_modules/playwright');

const mockData = {
  manufacturers: [
    { id: "m1", name: "GLF Integrated Power", linecardCategory: "Power, Energy & Batteries", subcategory: ["Batteries & Cells"], coreAdvantages: "Power management ICs." },
    { id: "m2", name: "Azoteq", linecardCategory: "Advanced Sensors & Motion", subcategory: ["Capacitive Sensing"], coreAdvantages: "Touch/haptics." },
    { id: "m3", name: "UTA Wireless", linecardCategory: "RF, Wireless & Connectivity", subcategory: ["Custom RF Modules"], coreAdvantages: "Custom wireless modules." },
    { id: "m4", name: "RLS Merilna Tehnika", linecardCategory: "Advanced Sensors & Motion", subcategory: ["Encoders"], coreAdvantages: "Magnetic encoders." },
    { id: "m5", name: "2J Antennas", linecardCategory: "RF, Wireless & Connectivity", subcategory: ["Antennas"], coreAdvantages: "Antenna systems." },
    { id: "m6", name: "Puya", linecardCategory: "Industrial Memory & Storage", subcategory: ["Flash Memory"], coreAdvantages: "Flash memory ICs." },
    { id: "m7", name: "Wago", linecardCategory: "Interconnect: Board-level", subcategory: ["Terminal Blocks"], coreAdvantages: "Connectors." },
  ],
  hotspots: [
    { id: "h1", hotspotId: "watch-display", label: "Display / HMI", x: 24, y: 50, smartZoom: 134, deviceVariant: "Smart Watch" },
    { id: "h2", hotspotId: "watch-buttons", label: "Buttons / Haptics", x: 44, y: 47, smartZoom: 134, deviceVariant: "Smart Watch" },
    { id: "h3", hotspotId: "ring-power", label: "Power Management", x: 32, y: 57, smartZoom: 134, deviceVariant: "Smart Ring" },
    { id: "h4", hotspotId: "glasses-wireless", label: "Wireless Connectivity", x: 73, y: 32, smartZoom: 134, deviceVariant: "Smart Glasses" },
    { id: "h5", hotspotId: "combat-eoir-turret", label: "EO/IR Sensor Turret", x: 14.2, y: 54.6, smartZoom: 134, deviceVariant: "Combat Drone" },
    { id: "h6", hotspotId: "surv-antenna", label: "Antenna / Comms Mast", x: 50.1, y: 36, smartZoom: 134, deviceVariant: "Surveillance Drone" },
  ],
  applicationMapping: [
    { id: "r1", applicationModel: "Wearables", hotspotId: "watch-display", relevantAstuteLine: ["m2"], fitType: "Best Fit", whyThisLineFits: "Display driver relevant.", questions: "Q1?\nQ2?", nextActions: "A1.\nA2." },
    { id: "r2", applicationModel: "Wearables", hotspotId: "ring-power", relevantAstuteLine: ["m1"], fitType: "Also Relevant", whyThisLineFits: "Power management ICs relevant.", questions: "Q3?", nextActions: "A3." },
    { id: "r3", applicationModel: "Wearables", hotspotId: "glasses-wireless", relevantAstuteLine: ["m3"], fitType: "Best Fit", whyThisLineFits: "Custom RF module relevant.", questions: "Q4?", nextActions: "A4." },
    { id: "r4", applicationModel: "Military Drones - Air", hotspotId: "combat-eoir-turret", relevantAstuteLine: ["m4"], fitType: "Best Fit", whyThisLineFits: "Encoder relevant to turret.", questions: "Q5?", nextActions: "A5." },
    { id: "r5", applicationModel: "Military Drones - Air", hotspotId: "surv-antenna", relevantAstuteLine: ["m5"], fitType: "Also Relevant", whyThisLineFits: "Antenna relevant.", questions: "Q6?", nextActions: "A6." },
  ],
  competitorTriggers: [],
  videos: [],
  manufacturerApplicationIndex: {},
  meta: {},
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));

  await page.route('**/api/reference-data', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockData) });
  });

  // 1. Directory — confirm all four applications show with Open map links
  await page.goto('http://localhost:4100/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/home/claude/step5_directory.png' });

  // 2. Wearables — variant tabs + hotspot click
  await page.goto('http://localhost:4100/applications/wearables', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/home/claude/step5_wearables_watch.png' });
  await page.click('text=Smart Ring');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/home/claude/step5_wearables_ring.png' });
  const ringDot = await page.$('.hs-hsmap-dot');
  if (ringDot) await ringDot.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/claude/step5_wearables_ring_selected.png' });

  // 3. Military Drones — variant tabs
  await page.goto('http://localhost:4100/applications/military-drones', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/home/claude/step5_drones_combat.png' });
  await page.click('text=Surveillance Drone');
  await page.waitForTimeout(300);
  const survDot = await page.$('.hs-hsmap-dot');
  if (survDot) await survDot.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/claude/step5_drones_surv_selected.png' });

  // 4. Embedded PC — category grid + click to expand
  await page.goto('http://localhost:4100/applications/embedded-pc', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/home/claude/step5_pc_default.png' });
  const box = await page.$('.hs-pc-box');
  if (box) await box.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/home/claude/step5_pc_anchored.png' });

  // 5. Robotics still works (regression)
  await page.goto('http://localhost:4100/applications/robotics-automation', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // 6. Manufacturers page (regression)
  await page.goto('http://localhost:4100/manufacturers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  console.log('CONSOLE ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
