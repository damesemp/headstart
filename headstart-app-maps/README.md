# Headstart Application Maps

BDM intake form. Submissions land in Airtable as Application Map Requests with
Status = "Needs Review". Nothing here writes to Application Mapping directly.

**The live form is at `/application-map`.** The root path redirects to it.

## Environment variables

All five must be set in Vercel → Settings → Environment Variables. Two names
exist for the same Airtable token because the routes were written at different
times; both are required until the legacy routes are retired.

| Variable | Value | Used by |
|---|---|---|
| `AIRTABLE_API_KEY` | Airtable Personal Access Token | `reference-data`, `submit`, `mapped-for-manufacturer` |
| `AIRTABLE_TOKEN` | the same token | `manufacturers`, `key-products`, `used-in`, `already-mapped` |
| `AIRTABLE_BASE_ID` | `app2N1SillR5AqtSC` | the three routes above |
| `AIRTABLE_TABLE_ID` | `tbltYrKYfGVkWwdR1` (Application Map Requests) | `submit`, `mapped-for-manufacturer` |
| `AIRTABLE_MANUFACTURERS_TABLE_ID` | `tblPus2aWrpNy5pwB` (Manufacturers) | `reference-data`, `submit` |

The token needs `data.records:read`, `data.records:write` and
`schema.bases:read` on base `app2N1SillR5AqtSC`. Create one at
https://airtable.com/create/tokens

See `.env.example`. Miss any of these and `/application-map` will sit on
"Loading..." or show "Couldn't load form data".

## Deploy

1. `npm install -g vercel`
2. `vercel login`
3. `vercel` — defaults are fine
4. Add the five environment variables in the Vercel dashboard
5. `vercel --prod`

Pushing to `main` on GitHub redeploys automatically.

## Where the data comes from

| In the form | Airtable source |
|---|---|
| Industry, Segment | **Segments** table `tbl0gAE9zJpNath0Q` — 56 segments across 14 industries |
| "Awaiting diagram" notice | Segments → Has Diagram |
| Type | **Types** table `tblJxyqfDeygPaEYD` |
| Application area | **Application Areas** `tblZAviGraX2g9vO2`, filtered to Submission Status = "Open for submission" |
| Manufacturer, Key product | **Manufacturers** `tblPus2aWrpNy5pwB` |
| Already mapped panel | Application Map Requests, matched on manufacturer name |

Adding a segment in the Segments table makes it appear in the form. It does not
need an application area first.

## Notes

- The Airtable token stays in Vercel's server environment and is never sent to
  the browser. No `NEXT_PUBLIC_` variables exist.
- **There is no authentication on any API route.** `GET /api/reference-data`
  returns the full manufacturer list with key products to any caller, and
  `POST /api/submit` is an open write into Airtable. This is a deliberate
  choice, not an oversight.
- Routes address Airtable fields by **name**, not field ID. Renaming a field in
  Airtable will break the app silently.
- An Airtable automation promotes an approved request into Application Mapping
  rows when a reviewer sets Status to "Converted to Application Mapping". Do not
  duplicate that in code.
