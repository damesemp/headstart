# Headstart Application Maps

## Deploy (Vercel, ~5 min)

1. Unzip this folder, open a terminal inside it.
2. `npm install -g vercel` (if not already installed)
3. `vercel login` — follow the browser prompt
4. `vercel` — press enter through the setup prompts (defaults are fine)
5. In the Vercel dashboard for this project: **Settings > Environment Variables**
   Add one variable:
   - Name: `AIRTABLE_TOKEN`
   - Value: an Airtable Personal Access Token with `data.records:read`, `data.records:write`, and `schema.bases:read` scope, granted access to base `app2N1SillR5AqtSC`.
   Create one at https://airtable.com/create/tokens if you don't have one.
6. `vercel --prod` to redeploy with the env var live.
7. Vercel gives you a URL — that's the link to hand out.

## What it does

- Manufacturer and Used In fields are live search against your real Airtable data.
- "Already mapped" panel loads once a manufacturer is picked — shows up to 5 live Application Mapping rows and 5 pending Application Map Requests, scrollable.
- Submit writes a new row into Application Map Requests with Status = Needs Review. Nothing here writes to Application Mapping directly.
- The Airtable token lives only in Vercel's server environment — never sent to the browser.
