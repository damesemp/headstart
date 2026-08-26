const BASE_ID = "app2N1SillR5AqtSC";

export const TABLES = {
  MANUFACTURERS: "tblPus2aWrpNy5pwB",
  APPLICATION_AREAS: "tblZAviGraX2g9vO2",
  APPLICATION_MAPPING: "tblL0yz7X2bKBXY2M",
  APPLICATION_MAP_REQUESTS: "tbltYrKYfGVkWwdR1",
  TYPES: "tblJxyqfDeygPaEYD",
  VIDEOS: "tblfCbuW1bZtnZrAF",
  HOTSPOTS: "tblMEqAZ4xDcbx16b",
  SEGMENTS: "tbl0gAE9zJpNath0Q",
  APPLICATION_MODELS: "tblZtjJRk54DgLIVw",
};

// A Hotspot's "Application Model" link is the fourth name the same thing goes
// by, alongside Segment, Type and view key. Types carry a Segment ("Factory
// Automation"); Hotspots link to an Application Model ("Robotics &
// Automation"). Every hotspot created before the mapper carries this link, so
// the mapper sets it too — otherwise anything grouped by application model
// quietly omits whatever the mapper placed.
export const SEGMENT_TO_APPLICATION_MODEL = {
  Wearables: "Wearables",
  Air: "Military Drones - Air",
  "Factory Automation": "Robotics & Automation",
  "Industrial Computing": "Embedded PC",
};

export const FIELDS = {
  MANUFACTURERS: {
    NAME: "fldm8DT9H7aFpY6rz",
    KEY_PRODUCTS: "fldR10c2IqF9MOYSJ",
  },
  APPLICATION_AREAS: {
    FULL_PATH: "fld71trL4N7jI30nj",
    SEGMENT: "fldjxc8vNey6YByBU",
    SYSTEM: "fld1jslYqwO6UfRGL",
    APPLICATION_AREA: "fldgLxkDOjbL5KRhs",
  },
  TYPES: {
    TYPE_NAME: "fldh7bbD34jz0FW7x",
    SEGMENT: "fld5ki4fNtyattr4B",
    APPLICATION_IMAGE_URL: "fldeMBCvQ0yYYE5LD",
  },
  // Hotspot mapper. Device Variant is ALWAYS the Type Name -- that string is
  // the join between Types, their application image, and the Engine's map.
  // Never let a user type it. Status gates visibility: the Engine renders
  // only "Live", so everything placed here starts as "Draft".
  HOTSPOTS: {
    LABEL: "fldTgNaYTbo59xabZ",
    HOTSPOT_ID: "fldPVvojgFaqPWLBo",
    X: "fldMu4vMPUmgtJIRL",
    Y: "fldetMIPHPsQ9BoYP",
    SMART_ZOOM: "fldTCU5qAqlA8kwnk",
    LABEL_X: "fldxqL3GAGxzUmAhz",
    LABEL_Y: "fldIXgZ7aEeUd9LJO",
    LABEL_SIDE: "fldVaTm8r4NGXSTum",
    DEVICE_VARIANT: "fldy0FnATnScnAg6v",
    APPLICATION_AREAS: "fld1BzL7GFuCkoFSh",
    STATUS: "fldQjJHxvawIwocKg",
    APPLICATION_MODEL: "fldjztMJyC7qPKvAr",
    // Reverse of Application Mapping's own Hotspot link. Read-only as far as
    // the mapper is concerned, but it is what makes a delete safe or unsafe:
    // these are the manufacturer matches a BDM submitted against this hotspot.
    APPLICATION_MAPPING: "fldZM3Fws2rnRlHFA",
  },
  APPLICATION_MODELS: {
    NAME: "fldFvlotvVQngQjXE",
  },
  APPLICATION_MAPPING: {
    APPLICATION_MODEL: "fld5QeFpEx5qKB102",
    HOTSPOT: "flddaFPCa1qcJQ6Aa",
    RELEVANT_LINE: "flda7O0hgthSQWx6x",
    FIT_TYPE: "fldmXCMWm4nh444PV",
    SHOW_IN_MODEL: "fldXiU3cY2dMm2kBO",
    REVIEW_STATUS: "fldq2WQe81jdvtBLJ",
  },
  APPLICATION_MAP_REQUESTS: {
    SUBMITTED_BY: "flda6If8E8kTCjGbk",
    MANUFACTURER: "flddGXaPXMv2uOAJB",
    KEY_PRODUCT: "flda5BdAGZEdLdSiJ",
    USED_IN: "fldLOa4WI0HLJATB5",
    WHY_THIS_FITS: "fldLZCgjmWWJnyYsD",
    STATUS: "fldVppAE7ff94JzNW",
    PROPOSED_NEW_AREA: "fldDLkXsTccQTNVo9",
  },
  VIDEOS: {
    TYPE: "fldLrbERhAAunyes6",
    TITLE: "fldpfByLgopvjvD79",
    DESCRIPTION: "fld34XmU8eDTx9DEz",
    FILE_URL: "fldPRwARIpJDFiGVs",
    INTERNAL_ONLY: "fld1jwNlRxY6py42s",
  },
};

export async function airtableFetch(path, options = {}) {
  const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY;
  if (!token) throw new Error("AIRTABLE_TOKEN or AIRTABLE_API_KEY is not set");
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable ${res.status}: ${text}`);
  }
  return res.json();
}
