const BASE_ID = "app2N1SillR5AqtSC";

export const TABLES = {
  MANUFACTURERS: "tblPus2aWrpNy5pwB",
  APPLICATION_AREAS: "tblZAviGraX2g9vO2",
  APPLICATION_MAPPING: "tblL0yz7X2bKBXY2M",
  APPLICATION_MAP_REQUESTS: "tbltYrKYfGVkWwdR1",
};

export const FIELDS = {
  MANUFACTURERS: {
    NAME: "fldm8DT9H7aFpY6rz",
    KEY_PRODUCTS: "fldR10c2IqF9MOYSJ",
  },
  APPLICATION_AREAS: {
    FULL_PATH: "fld71trL4N7jI30nj",
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
};

export async function airtableFetch(path, options = {}) {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error("AIRTABLE_TOKEN is not set");
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
