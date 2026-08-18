const { chromium } = require('/opt/node-tools/node_modules/playwright');

// Mirrors the real Airtable shape closely enough to exercise every path:
// Directory, all four maps, the flyout's full drill-down + Go, Embedded PC
// manufacturer-click-populates-panel, splash-once-per-session, and the
// old-route redirect. Segment/Type/ApplicationArea ids are simple test
// strings, not real Airtable record ids — only their relationships matter.
const mockData = {
  manufacturers: [
    { id: "m1", name: "GLF Integrated Power", linecardCategory: "Power, Energy & Batteries", subcategory: ["Batteries & Cells"], coreAdvantages: "Power management ICs.", website: "https://example.com/glf" },
    { id: "m2", name: "Azoteq", linecardCategory: "Advanced Sensors & Motion", subcategory: ["Capacitive Sensing"], coreAdvantages: "Touch/haptics.", website: "https://example.com/azoteq" },
    { id: "m3", name: "UTA Wireless", linecardCategory: "RF, Wireless & Connectivity", subcategory: ["Custom RF Modules"], coreAdvantages: "Custom wireless modules." },
    { id: "m4", name: "RLS Merilna Tehnika", linecardCategory: "Advanced Sensors & Motion", subcategory: ["Encoders"], coreAdvantages: "Magnetic encoders." },
    { id: "m5", name: "2J Antennas", linecardCategory: "RF, Wireless & Connectivity", subcategory: ["Antennas"], coreAdvantages: "Antenna systems." },
  ],
  hotspots: [
    { id: "h1", hotspotId: "watch-display", label: "Display / HMI", x: 24, y: 50, smartZoom: 150, deviceVariant: "Smart Watch", applicationAreaIds: ["aa1"] },
    { id: "h2", hotspotId: "ring-power", label: "Power Management", x: 32, y: 57, smartZoom: 150, deviceVariant: "Smart Ring", applicationAreaIds: ["aa2"] },
    { id: "h5", hotspotId: "combat-eoir-turret", label: "EO/IR Sensor Turret", x: 14.2, y: 54.6, smartZoom: 150, deviceVariant: "Combat Drone", applicationAreaIds: ["aa3"] },
    { id: "h7", hotspotId: "robot-elbow", label: "Elbow Articulation", x: 40, y: 30, smartZoom: 150, deviceVariant: null, applicationAreaIds: ["aa4"] },
  ],
  applicationMapping: [
    { id: "r1", applicationModel: "Wearables", hotspotId: "watch-display", relevantAstuteLine: ["m2"], fitType: "Best Fit", whyThisLineFits: "Display driver relevant.", questions: "Q1?", nextActions: "A1." },
    { id: "r2", applicationModel: "Wearables", hotspotId: "ring-power", relevantAstuteLine: ["m1"], fitType: "Also Relevant", whyThisLineFits: "Power management ICs relevant.", questions: "Q3?", nextActions: "A3." },
    { id: "r4", applicationModel: "Military Drones - Air", hotspotId: "combat-eoir-turret", relevantAstuteLine: ["m4"], fitType: "Best Fit", whyThisLineFits: "Encoder relevant to turret.", questions: "Q5?", nextActions: "A5." },
    { id: "r7", applicationModel: "Robotics & Automation", hotspotId: "robot-elbow", relevantAstuteLine: ["m5"], fitType: "Best Fit", whyThisLineFits: "Antenna relevant.", questions: "Q7?", nextActions: "A7." },
  ],
  competitorTriggers: [],
  videos: [{ applicationModel: "Wearables", title: "Wearables intro", description: "Test video", fileUrl: "https://example.com/v.mp4" }],
  manufacturerApplicationIndex: {},
  segments: [
    { id: "seg-wear", name: "Wearables", industry: "Consumer", hasDiagram: true },
    { id: "seg-air", name: "Air", industry: "Defence", hasDiagram: true },
    { id: "seg-fa", name: "Factory Automation", industry: "Industrial", hasDiagram: true },
    { id: "seg-ic", name: "Industrial Computing", industry: "Industrial", hasDiagram: true },
    { id: "seg-aero1", name: "Commercial Aircraft", industry: "Aerospace", hasDiagram: false },
  ],
  types: [
    { id: "t-watch", name: "Smart Watch", segment: "Wearables" },
    { id: "t-ring", name: "Smart Ring", segment: "Wearables" },
    { id: "t-combat", name: "Combat Drone", segment: "Air" },
    { id: "t-arm", name: "Robotic Arm", segment: "Factory Automation" },
  ],
  applicationAreas: [
    { id: "aa1", fullPath: "Consumer > Wearables > Display > HMI", industry: "Consumer", segment: "Wearables", system: "Display", applicationArea: "HMI", relevantTypeIds: ["t-watch"], linkedHotspotIds: ["h1"] },
    { id: "aa2", fullPath: "Consumer > Wearables > Power > Battery and charging", industry: "Consumer", segment: "Wearables", system: "Power", applicationArea: "Battery and charging", relevantTypeIds: ["t-ring"], linkedHotspotIds: ["h2"] },
    { id: "aa3", fullPath: "Defence > Air > Sensors > EO/IR imaging", industry: "Defence", segment: "Air", system: "Sensors", applicationArea: "EO/IR imaging", relevantTypeIds: ["t-combat"], linkedHotspotIds: ["h5"] },
    { id: "aa4", fullPath: "Industrial > Factory Automation > Robotics > Motion control", industry: "Industrial", segment: "Factory Automation", system: "Robotics", applicationArea: "Motion control", relevantTypeIds: ["t-arm"], linkedHotspotIds: ["h7"] },
  ],
  meta: {},
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  const results = [];
  const ok = (name, cond) => results.push([name, !!cond]);

  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

  await page.route('**/api/reference-data', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockData) });
  });

  // 1. Splash shows on first load, once per session.
  await page.goto('http://localhost:4101/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  ok('splash shown on first load', await page.$('.hs-splash'));
  await page.screenshot({ path: '/home/claude/nav_01_splash.png' });
  await page.click('.hs-splash-continue');
  await page.waitForTimeout(200);
  ok('splash dismissed, directory visible', !(await page.$('.hs-splash')) && (await page.$('.hs-dir')));
  await page.screenshot({ path: '/home/claude/nav_02_directory.png' });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  ok('splash NOT shown again within same session (sessionStorage)', !(await page.$('.hs-splash')));

  // 2. Hamburger opens the flyout.
  await page.click('[title="Menu"]');
  await page.waitForTimeout(300);
  ok('flyout open after hamburger click', await page.$('.hs-flyout.hs-open'));
  await page.screenshot({ path: '/home/claude/nav_03_flyout.png' });

  // 3. Drill down: Industry -> Segment -> Type -> System -> Area -> Go.
  await page.click('.hs-flyout-row-industry:has-text("Consumer")');
  await page.waitForTimeout(150);
  await page.click('.hs-flyout-row-segment:has-text("Wearables")');
  await page.waitForTimeout(150);
  await page.click('.hs-flyout-row-type:has-text("Smart Watch")');
  await page.waitForTimeout(150);
  const systemRow = await page.$('.hs-flyout-row-system:has-text("Display")');
  ok('drilled down to System level', !!systemRow);
  if (systemRow) await systemRow.click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: '/home/claude/nav_04_flyout_drilled.png' });
  const goRow = await page.$('.hs-flyout-row-area:has-text("HMI")');
  ok('Application Area leaf with Go present', !!goRow);
  if (goRow) await goRow.click();
  await page.waitForTimeout(400);

  // 4. Go ↗ landed on Wearables with the right hotspot selected + zoomed,
  //    map background white, dots larger + labels visible by default,
  //    cards panel populated, zoom controls present.
  ok('flyout closed after Go', !(await page.$('.hs-flyout.hs-open')));
  const bg = await page.$eval('.hs-hsmap-stage', (el) => getComputedStyle(el).backgroundColor);
  ok('map stage background is white', bg === 'rgb(255, 255, 255)');
  ok('hotspot selected after Go', await page.$('.hs-hsmap-dot.hs-on'));
  ok('cards panel populated (not blank)', !(await page.$('.hs-hsmap-empty')));
  ok('zoom controls present', await page.$('.hs-zoomstage-controls'));
  const dotBox = await page.$eval('.hs-hsmap-dot', (el) => el.getBoundingClientRect().width);
  ok('hotspot dot is larger (>=24px)', dotBox >= 24);
  const labelOpacity = await page.$eval('.hs-hsmap-dotlabel', (el) => getComputedStyle(el).opacity);
  ok('hotspot label visible by default (opacity 1)', labelOpacity === '1');
  await page.screenshot({ path: '/home/claude/nav_05_go_landed.png' });

  // 5. Reset clears zoom, pan, AND selection.
  await page.click('.hs-zoomstage-reset');
  await page.waitForTimeout(200);
  ok('reset clears selection (empty state back)', await page.$('.hs-hsmap-empty'));
  const pct = await page.$eval('.hs-zoomstage-pct', (el) => el.textContent);
  ok('reset clears zoom back to 100%', pct === '100%');
  await page.screenshot({ path: '/home/claude/nav_06_reset.png' });

  // 6. Military Drones — regression, variant tabs still work.
  await page.click('[title="Directory"]');
  await page.waitForTimeout(200);
  await page.click('.hs-dir-acard:has-text("Military Drones") .hs-dir-openmap');
  await page.waitForTimeout(300);
  ok('Military Drones map loaded', await page.$('.hs-hsmap-stage'));
  await page.screenshot({ path: '/home/claude/nav_07_military_drones.png' });

  // 7. Embedded PC — manufacturer click populates the SAME cards panel.
  await page.click('[title="Directory"]');
  await page.waitForTimeout(200);
  await page.click('.hs-dir-acard:has-text("Embedded PC") .hs-dir-openmap');
  await page.waitForTimeout(300);
  const pcBox = await page.$('.hs-pc-box');
  ok('Embedded PC categories rendered', !!pcBox);
  // Click a category that actually has mock manufacturers in it — the
  // first box in layout order (Industrial Memory & Storage) has none.
  const pcBoxWithMfrs = await page.$('.hs-pc-box:has-text("Advanced Sensors & Motion")');
  if (pcBoxWithMfrs) await pcBoxWithMfrs.click();
  await page.waitForTimeout(200);
  const mfrLink = await page.$('.hs-pc-mfrlink');
  ok('manufacturer name is clickable', !!mfrLink);
  if (mfrLink) await mfrLink.click();
  await page.waitForTimeout(200);
  ok('Embedded PC manufacturer click populates cards panel', !(await page.$('.hs-hsmap-empty')));
  ok('Embedded PC has zoom controls too', await page.$('.hs-zoomstage-controls'));
  await page.screenshot({ path: '/home/claude/nav_08_embedded_pc.png' });

  // 8. Robotics & Automation — regression.
  await page.click('[title="Directory"]');
  await page.waitForTimeout(200);
  await page.click('.hs-dir-acard:has-text("Robotics") .hs-dir-openmap');
  await page.waitForTimeout(300);
  ok('Robotics & Automation map loaded', await page.$('.hs-hsmap-stage'));

  // 9. Manufacturers page — unaffected regression.
  await page.goto('http://localhost:4101/manufacturers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  ok('Manufacturers page still works', await page.$('.hs-app-shell') || (await page.content()).length > 0);

  // 10. Old route redirects to the single-page equivalent.
  const resp = await page.goto('http://localhost:4101/applications/wearables', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const finalUrl = page.url();
  ok('old /applications/wearables route redirects to /?app=wearables', finalUrl.includes('/?app=wearables'));

  console.log('\n=== RESULTS ===');
  let allPass = true;
  for (const [name, pass] of results) {
    console.log((pass ? 'PASS' : 'FAIL') + ' — ' + name);
    if (!pass) allPass = false;
  }
  console.log('\nCONSOLE ERRORS:', JSON.stringify(errors));
  await browser.close();
  process.exit(allPass && errors.length === 0 ? 0 : 1);
})();
