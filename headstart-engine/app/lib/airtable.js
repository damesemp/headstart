const BASE_ID = process.env.AIRTABLE_BASE_ID;

export const TABLES = {
  MANUFACTURERS: process.env.AIRTABLE_MANUFACTURERS_TABLE_ID,
  APPLICATION_MAPPING: process.env.AIRTABLE_APPLICATION_MAPPING_TABLE_ID,
  COMPETITOR_TRIGGERS: process.env.AIRTABLE_COMPETITOR_TRIGGERS_TABLE_ID,
  HOTSPOTS: process.env.AIRTABLE_HOTSPOTS_TABLE_ID,
  VIDEOS: process.env.AIRTABLE_VIDEOS_TABLE_ID,
};

// Field IDs, not names — matches the project rule that the live site must
// never depend on a field being renamed. Cross-checked against live Airtable
// on 18 August 2026 (see AI_HANDOVER_ASTUTE_HEADSTART_v8.md, Section 4.3).
// Manufacturers' three outbound-link fields and the whole Videos table were
// created directly in Airtable on 18 August 2026 as part of Step 3 — they
// did not exist before this (see HEADSTART_MASTER_HANDOVER.md Section 3,
// "Manufacturer links", and Step 3 in Section 4).
export const FIELDS = {
  MANUFACTURERS: {
    NAME: "fldm8DT9H7aFpY6rz",
    TIER: "fldqNlm3wkIIkvqQm",
    LINECARD_CATEGORY: "fldZVBYb9KyJMRiQE",
    SHORT_DESCRIPTION: "fldJfisC84i6FE9Ir",
    LONG_DESCRIPTION: "fldkYkeYbIDVa2SH4",
    KEY_PRODUCTS: "fldv07pjCmuPLj2vR",
    APPLICATIONS: "fldWD6406mCrIHYdi",
    INDUSTRIES: "fldOFAB8baamNgYkR",
    WEBSITE: "fld8lBAvPkoEkTN4G",
    CTA_TEXT: "flduoM8qBVBh1H6xE",
    FEATURED_LINK_URL: "fld5DDTqBmviA9Ma3",
    FEATURED_LINK_LABEL: "fld3rX57hSfZHy9H2",
    PDF_URL: "fldCkmDWt1qzUw4EO",
    // Added for Step 4's right-hand panel ("Manufacturer Details" card) —
    // confirmed via live schema check 18 August 2026.
    CORE_ADVANTAGES: "fldW2pEdBboSh8ehd",
  },
  APPLICATION_MAPPING: {
    MAPPING_ID: "fldxjSmK4myWDLiyc",
    APPLICATION_MODEL: "fld5QeFpEx5qKB102",
    HOTSPOT: "flddaFPCa1qcJQ6Aa",
    RELEVANT_ASTUTE_LINE: "flda7O0hgthSQWx6x",
    FIT_TYPE: "fldmXCMWm4nh444PV",
    WHY_THIS_LINE_FITS: "fldy4EZToLrk8Uae8",
    // Added for Step 4's right-hand panel ("Ask & Act" card) — confirmed
    // via live schema check 18 August 2026.
    QUESTIONS: "flde6zNaSrTsC9Jjy",
    NEXT_ACTIONS: "fldyiI1IcF3UqOHaT",
    SHOW_IN_MODEL: "fldXiU3cY2dMm2kBO",
    REVIEW_STATUS: "fldq2WQe81jdvtBLJ",
    CONFIDENCE_PRIORITY: "fldjSjfzFTABt6hXt",
  },
  COMPETITOR_TRIGGERS: {
    TRIGGER: "fld02PnFlQiUIsRUL",
    ALIASES: "fldtjIbypfa6cyi0x",
    PRODUCT_TERMS: "fldiTjPzu5L50k30i",
    CATEGORY: "fldphlKq6qNIjBwFs",
    RELEVANT_ASTUTE_LINES: "fldP6VGWfE2y6GE1H",
  },
  HOTSPOTS: {
    LABEL: "fldTgNaYTbo59xabZ",
    HOTSPOT_ID: "fldPVvojgFaqPWLBo",
    // Linked-record field (multipleRecordLinks to Application Models), not
    // text — cannot be filtered by application name via the Airtable API's
    // structured filters. Not used for that; hotspot-to-application
    // resolution goes through Application Mapping's own Hotspot link
    // instead (see mappingShape in api/reference-data/route.js). Kept here
    // only in case a future feature needs the raw linked record IDs.
    APPLICATION_MODEL: "fldjztMJyC7qPKvAr",
    X: "fldMu4vMPUmgtJIRL",
    Y: "fldetMIPHPsQ9BoYP",
    // Added for Step 4's pan/zoom-on-click and hotspot label placement —
    // confirmed via live schema check 18 August 2026.
    SMART_ZOOM: "fldTCU5qAqlA8kwnk",
    LABEL_X: "fldxqL3GAGxzUmAhz",
    LABEL_Y: "fldIXgZ7aEeUd9LJO",
    LABEL_SIDE: "fldVaTm8r4NGXSTum",
    DEVICE_VARIANT: "fldy0FnATnScnAg6v",
  },
  VIDEOS: {
    APPLICATION_MODEL: "fldtDwenmLLaehnCP",
    TITLE: "fldpfByLgopvjvD79",
    DESCRIPTION: "fld34XmU8eDTx9DEz",
    FILE_URL: "fldPRwARIpJDFiGVs",
    INTERNAL_ONLY: "fld1jwNlRxY6py42s",
  },
};

// Fetches every record from a table, following Airtable's pagination
// automatically. Always live — no caching layer here, matches the rule
// that the site must never serve a stale copy of Show in Model.
export async function airtableFetchAll(tableId, { filterByFormula } = {}) {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error("AIRTABLE_TOKEN is not set");
  if (!BASE_ID) throw new Error("AIRTABLE_BASE_ID is not set");
  if (!tableId) throw new Error("A required Airtable table ID environment variable is not set");

  const records = [];
  let offset;

  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`);
    // Without this, Airtable keys each record's fields by field NAME, not
    // field ID — silently breaking every lookup in this file, which reads
    // fields by ID on purpose (see the FIELDS export above).
    url.searchParams.set("returnFieldsByFieldId", "true");
    if (filterByFormula) url.searchParams.set("filterByFormula", filterByFormula);
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable ${res.status} on ${tableId}: ${text}`);
    }

    const data = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}
