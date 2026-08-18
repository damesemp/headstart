const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;
const MAPPING_TABLE = process.env.AIRTABLE_APPLICATION_MAPPING_TABLE_ID;
const SHOW_IN_MODEL_FIELD_ID = "fldXiU3cY2dMm2kBO";

async function fetchAll(tableId, filterByFormula) {
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`);
    url.searchParams.set("returnFieldsByFieldId", "true");
    if (filterByFormula) url.searchParams.set("filterByFormula", filterByFormula);
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    const data = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

async function main() {
  if (!BASE_ID || !TOKEN || !MAPPING_TABLE) {
    console.error("Missing one of AIRTABLE_BASE_ID / AIRTABLE_TOKEN / AIRTABLE_APPLICATION_MAPPING_TABLE_ID.");
    process.exit(1);
  }

  const allRows = await fetchAll(MAPPING_TABLE);
  const filteredDirectly = await fetchAll(MAPPING_TABLE, `{${SHOW_IN_MODEL_FIELD_ID}} = TRUE()`);
  const filteredByHand = allRows.filter((r) => r.fields[SHOW_IN_MODEL_FIELD_ID] === true);

  console.log(`Total Application Mapping rows: ${allRows.length}`);
  console.log(`Rows with Show in Model checked (Airtable filter): ${filteredDirectly.length}`);
  console.log(`Rows with Show in Model checked (counted by hand): ${filteredByHand.length}`);

  if (filteredDirectly.length !== filteredByHand.length) {
    console.error("FAIL: Airtable's filterByFormula result does not match a manual count.");
    process.exit(1);
  }
  if (filteredDirectly.length === allRows.length) {
    console.error("FAIL: filtered count equals total count — the filter is not doing anything.");
    process.exit(1);
  }
  console.log(`PASS: ${filteredDirectly.length} of ${allRows.length} rows are flagged Show in Model, and the filter is confirmed to be excluding rows correctly.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
