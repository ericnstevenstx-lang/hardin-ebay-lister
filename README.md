# Hardin Electrical Group - eBay Lister

Comp pricing, SEO listing generation, and equipment scanning for the shipping department.

## Features

- **Nameplate OCR** - Scan equipment nameplates with phone camera, auto-fills all fields
- **Barcode Scanner** - Live barcode detection for catalog/part numbers
- **QR Code Scanner** - Reads QR codes on equipment labels
- **eBay Comp Pricing** - Real-time pricing from eBay Browse API by condition grade
- **Dealer Site Comps** - Google Custom Search across 18+ used equipment dealer sites
- **SEO Listing Generator** - AI-generated eBay titles, HTML descriptions, item specifics
- **Price Analysis** - Three-source pricing comparison with grade-adjusted recommendations

## Stack

- Next.js 15 (React 19)
- Supabase Edge Functions (scan-nameplate, ebay-comps, web-comps, generate-listing)
- eBay Browse API (production keys)
- Google Custom Search API (18 dealer sites)
- Anthropic Claude Haiku (OCR + listing generation)
- PWA (installable on phone homescreen)

## Deploy

Push to GitHub, connect to Vercel, auto-deploys on push. No environment variables needed on Vercel side (all secrets are in Supabase Edge Function config).

## Supabase Project

Project ID: `ulyycjtrshpsjpvbztkr`

### Edge Function Secrets Required
- `ANTHROPIC_API_KEY`
- `EBAY_APP_ID` (production)
- `EBAY_CERT_ID` (production)
- `GOOGLE_CSE_API_KEY`

### Google CSE
Engine ID: `674f026095f7344b0` (HARDIN EQUIPMENT COMPS)
