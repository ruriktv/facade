# Facade

Facade is a personal, iPad-friendly dashboard for CRO leadership work. The first version is designed to bring together:

- Google Search Console signals
- GA4 campaign context
- Optimizely Web Experimentation status
- Daily utility widgets like date and weather
- Optional public cards for news, GitHub trends, WTT, and NSW/HSC resources

The current app focuses on the dashboard shell, layout system, themes, profiles, and API-ready integration boundaries so we can layer in real data safely.

## Current Features

- Responsive dashboard built with `Next.js`, `TypeScript`, and `Tailwind CSS`
- Draggable and resizable widgets with fluid vertical compaction
- iPad-friendly interaction model with editable layouts
- Multiple dashboard profiles:
  - `Chapter Overview`
  - `Campaign Watch`
  - `Personal`
- Theme switching from a settings panel
- Widget toggles for optional cards
- API route stubs for:
  - `/api/google/search-console`
  - `/api/google/ga4`
  - `/api/optimizely/experiments`
  - `/api/public/weather`

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Copy the env template:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Set these in `.env.local` for the first pass:

```bash
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
GSC_SITE_URLS=sc-domain:example.com,https://www.example.com/
GA4_PROPERTY_ID=

OPTIMIZELY_API_TOKEN=
OPTIMIZELY_PROJECT_ID=
```

## Google Setup Plan

The attached Google file is a `web` OAuth client, which is a valid starting point for this app. To use it for Search Console and GA4, you still need to:

1. Create a Google Cloud project.
2. Enable the APIs we need:
   - Search Console API
   - Google Analytics Data API
3. Configure the OAuth consent screen.
4. Add authorized redirect URIs for local and hosted environments.
5. Add your Google account as a test user while the app is unverified.
6. Make sure that Google account already has access to:
   - the required Search Console properties
   - the required GA4 property
7. Put the OAuth client values into `.env.local`

## Optimizely Setup Plan

For `Web Experimentation`, the current app is structured around:

- experiment status
- contributor / last updated by
- targeting URLs

You will need:

1. An Optimizely API token
2. The relevant project ID
3. A final decision on which endpoints or export flow best expose experiment metadata for your account setup

## Suggested Public Sources

These are the early recommendations for optional public widgets:

- `Weather`: [Open-Meteo](https://open-meteo.com/) for a clean free option
- `News`: [GNews](https://gnews.io/) or similar free-tier provider
- `GitHub trends`: [ecosyste.ms](https://ecosyste.ms/) open data endpoints
- `NSW/HSC`: NESA and NSW Education public resources
- `WTT`: likely a custom adapter after source review

## Architecture Notes

- `src/app/page.tsx` mounts the dashboard shell
- `src/components/dashboard/` contains the layout shell and widget cards
- `src/lib/dashboard-data.ts` holds profiles, themes, widgets, and starter layouts
- `src/app/api/` holds the current server-side integration entry points

`Next.js` was chosen here because it keeps us flexible for:

- API proxying
- future auth
- secret handling upgrades
- deployable hosting
- profile or user settings persistence later

## Next Steps

The most sensible next build steps are:

1. Replace the stub APIs with real Google Search Console, GA4, and Optimizely fetches.
2. Add a proper widget settings model so each profile can decide which public widgets are visible.
3. Add saved custom profiles from the UI instead of only shipped presets.
4. Add stronger secret handling and auth once you are ready to move beyond local env files.
