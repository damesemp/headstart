// Embedded PC diagram (Step 4) — taxonomy/layout constants, ported directly
// from the offline reference file's PC_ATTACH / PC_LAYOUT / CATEGORY_COLORS.
//
// Why these are hardcoded rather than read live, unlike everything else in
// this build: the reference file's own comments record that this exact
// structure was already migrated to Airtable's "Linecard Categories" table
// on 2026-07-07 as a source-of-truth move, with PC_LAYOUT/CATEGORY_COLORS
// deliberately left out of that migration (fixed spatial arrangement and
// approved colour system, not editable content). PC_ATTACH below was
// cross-checked against a live fetch of that Airtable table on 18 August
// 2026 (Step 4) and found to match exactly, category-for-category,
// companion-for-companion — no drift. What genuinely changes over time
// (which manufacturers sit in which category/subcategory, and how many)
// is NOT hardcoded here — that comes live from /api/reference-data.
export const CATEGORY_COLORS = {
  "RF, Wireless & Connectivity": { accent: "#1D5FA0", text: "#123A5F", bg: "rgba(29,95,160,0.10)", subBg: "rgba(29,95,160,0.16)" },
  "Power, Energy & Batteries": { accent: "#A62F2F", text: "#6B1E1E", bg: "rgba(166,47,47,0.10)", subBg: "rgba(166,47,47,0.16)" },
  "Interconnect: Rugged & Harsh Environments": { accent: "#9C4A1E", text: "#652F13", bg: "rgba(156,74,30,0.10)", subBg: "rgba(156,74,30,0.16)" },
  "Edge AI & System Solutions": { accent: "#5B4AA8", text: "#39306B", bg: "rgba(91,74,168,0.10)", subBg: "rgba(91,74,168,0.16)" },
  "Optoelectronics, Displays, HMI": { accent: "#A5385F", text: "#6B233D", bg: "rgba(165,56,95,0.10)", subBg: "rgba(165,56,95,0.16)" },
  "Semiconductor & IC Solutions": { accent: "#12735A", text: "#0B4A3A", bg: "rgba(18,115,90,0.10)", subBg: "rgba(18,115,90,0.16)" },
  "Industrial Memory & Storage": { accent: "#3E4A9E", text: "#282F65", bg: "rgba(62,74,158,0.10)", subBg: "rgba(62,74,158,0.16)" },
  "Cyber & Trusted Hardware": { accent: "#384A56", text: "#232F37", bg: "rgba(56,74,86,0.10)", subBg: "rgba(56,74,86,0.16)" },
  "Circuit Protection & Magnetics": { accent: "#93711B", text: "#5F4912", bg: "rgba(147,113,27,0.10)", subBg: "rgba(147,113,27,0.16)" },
  "Thermal & Enclosures": { accent: "#B15A16", text: "#733A0E", bg: "rgba(177,90,22,0.10)", subBg: "rgba(177,90,22,0.16)" },
  "Advanced Sensors & Motion": { accent: "#3E7A2C", text: "#294F1D", bg: "rgba(62,122,44,0.10)", subBg: "rgba(62,122,44,0.16)" },
  "Frequency Control & Timing": { accent: "#0E7480", text: "#0A4C53", bg: "rgba(14,116,128,0.10)", subBg: "rgba(14,116,128,0.16)" },
  "Interconnect: Board-level": { accent: "#6E4E2E", text: "#48331E", bg: "rgba(110,78,46,0.10)", subBg: "rgba(110,78,46,0.16)" },
};

// Fixed spatial arrangement (brain-in-middle block diagram).
export const PC_LAYOUT = {
  memoryBand: ["Industrial Memory & Storage"],
  leftStack: ["RF, Wireless & Connectivity", "Interconnect: Rugged & Harsh Environments", "Interconnect: Board-level"],
  brain: ["Edge AI & System Solutions", "Semiconductor & IC Solutions"],
  centreBelow: ["Cyber & Trusted Hardware", "Power, Energy & Batteries"],
  centreRow2: ["Frequency Control & Timing", "Thermal & Enclosures"],
  rightStack: ["Optoelectronics, Displays, HMI", "Advanced Sensors & Motion", "Circuit Protection & Magnetics"],
};

// Companion categories — which other boxes to highlight when one is
// selected. Cross-checked against live Airtable "Linecard Categories" 18
// August 2026 — exact match.
export const PC_ATTACH = {
  "Interconnect: Board-level": ["Edge AI & System Solutions", "Optoelectronics, Displays, HMI", "Interconnect: Rugged & Harsh Environments"],
  "Thermal & Enclosures": ["Power, Energy & Batteries", "Edge AI & System Solutions", "Interconnect: Rugged & Harsh Environments"],
  "Power, Energy & Batteries": ["Edge AI & System Solutions", "Circuit Protection & Magnetics", "Thermal & Enclosures", "Interconnect: Rugged & Harsh Environments", "Advanced Sensors & Motion"],
  "Circuit Protection & Magnetics": ["Power, Energy & Batteries", "RF, Wireless & Connectivity", "Interconnect: Rugged & Harsh Environments"],
  "RF, Wireless & Connectivity": ["Edge AI & System Solutions", "Power, Energy & Batteries", "Interconnect: Rugged & Harsh Environments", "Interconnect: Board-level"],
  "Advanced Sensors & Motion": ["Edge AI & System Solutions", "Power, Energy & Batteries", "RF, Wireless & Connectivity"],
  "Optoelectronics, Displays, HMI": ["Edge AI & System Solutions", "Power, Energy & Batteries", "Interconnect: Board-level", "Advanced Sensors & Motion"],
  "Industrial Memory & Storage": ["Edge AI & System Solutions", "Power, Energy & Batteries", "Frequency Control & Timing", "Semiconductor & IC Solutions"],
  "Cyber & Trusted Hardware": ["Edge AI & System Solutions", "Semiconductor & IC Solutions", "Industrial Memory & Storage"],
  "Edge AI & System Solutions": ["Industrial Memory & Storage", "Power, Energy & Batteries", "Advanced Sensors & Motion", "Optoelectronics, Displays, HMI", "RF, Wireless & Connectivity"],
  "Semiconductor & IC Solutions": ["Edge AI & System Solutions", "Power, Energy & Batteries", "Industrial Memory & Storage", "Optoelectronics, Displays, HMI"],
  "Frequency Control & Timing": ["Edge AI & System Solutions", "RF, Wireless & Connectivity", "Industrial Memory & Storage"],
  "Interconnect: Rugged & Harsh Environments": ["RF, Wireless & Connectivity", "Power, Energy & Batteries", "Interconnect: Board-level", "Thermal & Enclosures"],
};
