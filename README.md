# VastuNow

**Instant Vastu Shastra compliance analysis for residential floor plans, powered by AI.**

Upload a builder floor plan (PDF or image), select which direction your main door faces, and receive a detailed Vastu compliance score, room-by-room analysis, actionable remedies, and a downloadable PDF report -- all for free.

VastuNow combines computer vision (Claude Sonnet 4.6 on AWS Bedrock) with a deterministic Vastu rules engine to produce consistent, trustworthy scores. Reports are generated in English or Hindi, using authentic Sanskrit terminology with accessible explanations.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Vastu Rules Engine](#vastu-rules-engine)
- [LLM Integration](#llm-integration)
- [Deployment](#deployment)
- [Cost Estimates](#cost-estimates)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Full-stack React with serverless API routes |
| Language | TypeScript 5 | Type safety across the entire codebase |
| LLM (Vision) | Claude Sonnet 4.6 on AWS Bedrock | Floor plan parsing via multimodal vision |
| LLM (Text) | Claude Haiku 4.5 on AWS Bedrock | Report generation, unknown room type matching |
| Database | Supabase (Postgres) | Analysis storage, metadata |
| File Storage | Supabase Storage | Uploaded floor plan images/PDFs |
| Styling | Tailwind CSS 4 | Utility-first CSS with traditional Indian design motifs |
| i18n | i18next + react-i18next | English and Hindi UI; LLM generates reports in selected language |
| PDF | @react-pdf/renderer | Client-side PDF report generation |
| Animation | Framer Motion | Loading states, transitions |
| Icons | Lucide React | UI iconography |

---

## Architecture Overview

VastuNow uses a **two-phase pipeline** that separates floor plan parsing from scoring and report generation. This split enables an optional user review step between the phases.

```
+-----------------------------------------------------------------------+
|                            FRONTEND                                    |
|                     Next.js 16 (App Router)                           |
|                       PWA + i18next                                    |
|                                                                        |
|  +---------+  +-----------+  +--------+  +---------+  +-------------+ |
|  | Landing |->| Upload +  |->| Review |->| Loading |->| Report      | |
|  | Page    |  | Direction |  | Rooms  |  | Screen  |  | + PDF DL    | |
|  +---------+  +-----------+  +--------+  +---------+  +-------------+ |
+-----------------------------------------------------------------------+
                         | API calls
+-----------------------------------------------------------------------+
|                            BACKEND                                     |
|                Next.js API Routes (serverless)                        |
|                                                                        |
|  Phase 1: /api/analyze                                                |
|  +-----------------------------------------------------------------+  |
|  | 1. Receive image/PDF + facing direction                         |  |
|  | 2. Upload file to Supabase Storage                              |  |
|  | 3. Send to Claude Sonnet 4.6 Vision -> parsed rooms + dirs     |  |
|  | 4. Return parsed data for optional user review                  |  |
|  +-----------------------------------------------------------------+  |
|                                                                        |
|  Phase 2: /api/score                                                  |
|  +-----------------------------------------------------------------+  |
|  | 1. Receive confirmed rooms + direction (+ user corrections)     |  |
|  | 2. Match unknown room types via Claude Haiku 4.5               |  |
|  | 3. Run deterministic Vastu rules engine -> scores               |  |
|  | 4. Generate report via Claude Haiku 4.5                        |  |
|  | 5. Store everything in Supabase Postgres                        |  |
|  | 6. Return full analysis                                         |  |
|  +-----------------------------------------------------------------+  |
|                                                                        |
|  +----------------+  +----------------+  +------------------+          |
|  | Rules Engine   |  | Supabase       |  | AWS Bedrock      |          |
|  | (pure TS)      |  | (DB + Storage) |  | (Claude models)  |          |
|  +----------------+  +----------------+  +------------------+          |
+-----------------------------------------------------------------------+
```

### Phase 1: Parse (`/api/analyze`)

- Receives a floor plan image (JPG/PNG) or PDF along with the user-specified facing direction.
- Uploads the file to Supabase Storage for persistence.
- Sends the file (PDFs natively as document content blocks, images as image content blocks) to Claude Sonnet 4.6 Vision.
- The LLM identifies every room, determines its compass-direction Vastu zone based on the stated facing direction, and returns structured JSON.
- Returns parsed rooms for the optional review step.

### Phase 2: Score + Report (`/api/score`)

- Receives confirmed/corrected rooms from the review step (or raw LLM output if review was skipped).
- Maps any unknown room types to the nearest known Vastu category via Claude Haiku 4.5.
- Runs a deterministic rules engine that scores each room based on its compass direction vs. ideal placement. Uses **worst-score-wins** when multiple rules apply to the same room.
- Generates a natural-language report in the user's selected language via Claude Haiku 4.5, using authentic Sanskrit Vastu terminology.
- Stores the complete analysis in Supabase Postgres.
- Returns scores, report, and schematic data to the frontend.

If the user skips the review step, the frontend automatically chains Phase 1 into Phase 2.

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **npm** (comes with Node.js)
- **AWS account** with Bedrock access enabled for Claude models in `us-east-1`
- **Supabase project** with a Postgres database and Storage bucket

### Environment Setup

Create a `.env.local` file in the project root with the following variables:

```env
# AWS Bedrock credentials
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**AWS Bedrock:** You must have model access enabled for `us.anthropic.claude-sonnet-4-6` and `us.anthropic.claude-haiku-4-5-20251001-v1:0` in the `us-east-1` region. Request access through the AWS Bedrock console if not already enabled.

**Supabase:** Create a `floorplans` storage bucket (public read) and run the database migration below.

### Database Setup

Execute the following SQL in the Supabase SQL Editor:

```sql
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  image_url TEXT NOT NULL,
  facing_direction TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  parsed_floorplan JSONB,
  user_corrections JSONB,
  vastu_analysis JSONB,
  overall_score INTEGER,
  grade TEXT,
  report_content JSONB,
  report_language TEXT DEFAULT 'en',
  ip_hash TEXT,
  user_agent TEXT
);

CREATE INDEX idx_analyses_score ON analyses (overall_score);
CREATE INDEX idx_analyses_created ON analyses (created_at);
```

### Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
vastunow/
|-- public/
|   |-- manifest.json                  # PWA manifest
|   |-- sw.js                          # Service worker (install prompt only)
|   |-- icons/
|   |   |-- icon-192.svg               # App icon
|   |-- locales/
|       |-- en/common.json             # English UI strings
|       |-- hi/common.json             # Hindi UI strings
|
|-- src/
|   |-- app/
|   |   |-- layout.tsx                 # Root layout (fonts, metadata, i18n provider, nav)
|   |   |-- page.tsx                   # Landing page (direct CTA, upload above the fold)
|   |   |-- providers.tsx              # Client-side providers (i18n, etc.)
|   |   |-- globals.css                # Tailwind base + custom properties
|   |   |-- analyze/
|   |   |   |-- page.tsx               # Upload + direction select + trigger analysis
|   |   |-- review/
|   |   |   |-- page.tsx               # Optional room review step
|   |   |-- report/
|   |   |   |-- [id]/
|   |   |       |-- page.tsx           # Report page (schematic + scores + PDF download)
|   |   |-- api/
|   |       |-- analyze/
|   |       |   |-- route.ts           # Phase 1: floor plan parsing endpoint
|   |       |-- score/
|   |       |   |-- route.ts           # Phase 2: scoring + report generation endpoint
|   |       |-- report-pdf/
|   |       |   |-- route.ts           # PDF data retrieval endpoint
|   |       |-- regenerate-report/
|   |           |-- route.ts           # Language switch report regeneration
|   |
|   |-- components/
|   |   |-- ui/                        # Reusable UI primitives
|   |   |   |-- Button.tsx
|   |   |   |-- Select.tsx
|   |   |   |-- FileUpload.tsx
|   |   |   |-- LoadingSpinner.tsx
|   |   |   |-- LanguageSwitcher.tsx   # EN | HI toggle
|   |   |   |-- NavBar.tsx             # Persistent nav: logo + language switcher
|   |   |-- landing/
|   |   |   |-- UploadCTA.tsx          # Hero upload zone
|   |   |   |-- HowItWorks.tsx         # 3-step explanation
|   |   |   |-- TrustSignals.tsx       # Trust indicators
|   |   |-- analyze/
|   |   |   |-- UploadZone.tsx         # Drag & drop + file picker
|   |   |   |-- DirectionSelect.tsx    # Compass direction dropdown (8 directions)
|   |   |-- review/
|   |   |   |-- RoomReviewGrid.tsx     # Desktop: grid overlay on floor plan
|   |   |   |-- RoomReviewList.tsx     # Mobile: stacked list of rooms
|   |   |   |-- EntranceConfirm.tsx    # Entrance detection confirmation
|   |   |-- report/
|   |       |-- VastuSchematic.tsx     # SVG 3x3 grid visualization (core component)
|   |       |-- ScoreCard.tsx          # Overall score gauge (0-100) + letter grade
|   |       |-- RoomAnalysis.tsx       # Per-room breakdown cards
|   |       |-- RemedyList.tsx         # Suggested fixes per issue
|   |       |-- OriginalPlan.tsx       # Uploaded image reference
|   |       |-- AnalyzeAnother.tsx     # CTA to start a new analysis
|   |
|   |-- lib/
|   |   |-- vastu/
|   |   |   |-- rules.ts              # Rules engine (pure function, no side effects)
|   |   |   |-- rules-data.json       # All Vastu rules as structured data (12 room types)
|   |   |   |-- scoring.ts            # Score calculation (worst-score-wins)
|   |   |   |-- types.ts              # TypeScript types for rooms, rules, scores
|   |   |   |-- rule-matcher.ts       # LLM-assisted rule matching for unknown rooms
|   |   |-- llm/
|   |   |   |-- parse-floorplan.ts    # Claude Sonnet 4.6 vision call + tool_use parsing
|   |   |   |-- generate-report.ts    # Claude Haiku 4.5 report generation
|   |   |   |-- bedrock-client.ts     # Shared BedrockRuntimeClient instance
|   |   |   |-- prompts.ts           # All LLM prompts (centralized)
|   |   |-- supabase/
|   |   |   |-- client.ts            # Supabase client initialization
|   |   |   |-- storage.ts           # Image upload/retrieval helpers
|   |   |-- pdf/
|   |   |   |-- generate.ts          # PDF report data structure
|   |   |   |-- schematic-svg.ts     # SVG schematic for PDF embedding
|   |   |-- i18n/
|   |       |-- config.ts            # i18next configuration (EN + HI)
|   |
|   |-- locales/
|       |-- en/common.json           # English translations (bundled)
|       |-- hi/common.json           # Hindi translations (bundled)
|
|-- .env.local                        # Environment variables (not committed)
|-- next.config.ts                    # Next.js configuration
|-- tailwind.config.ts                # Tailwind CSS configuration
|-- tsconfig.json                     # TypeScript configuration
|-- package.json
```

---

## API Endpoints

### POST `/api/analyze`

**Phase 1: Floor Plan Parsing.** Accepts a floor plan file and facing direction, returns parsed room data.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `floorplan` | File | Yes | Floor plan image (JPG, PNG) or PDF. Max 10MB. |
| `facing` | string | Yes | Main door facing direction. One of: `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW` |

**Response (200):**

```json
{
  "parsed_floorplan": {
    "rooms": [
      {
        "name": "Kitchen",
        "type": "kitchen",
        "compass_direction": "SE",
        "grid_row": 2,
        "grid_col": 2,
        "size": "medium",
        "has_window": true,
        "has_door": true
      }
    ],
    "entrance": {
      "compass_direction": "E",
      "grid_row": 1,
      "grid_col": 2,
      "side": "east"
    },
    "total_rooms": 6,
    "plan_shape": "rectangular",
    "confidence": "high"
  },
  "image_url": "https://xxx.supabase.co/storage/v1/object/public/floorplans/...",
  "facing_direction": "E",
  "confidence": "high"
}
```

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing file or direction | `{ "error": "Missing required fields" }` |
| 422 | Image is not a floor plan | `{ "error": "Could not identify this as a floor plan..." }` |
| 422 | Multi-floor plan detected | `{ "error": "Please upload a single floor plan..." }` |
| 500 | LLM or server error | `{ "error": "Failed to read your floor plan. Please try again." }` |

---

### POST `/api/score`

**Phase 2: Scoring + Report Generation.** Accepts parsed floor plan data, runs the rules engine, generates a report, and stores the analysis.

**Request:** `application/json`

```json
{
  "parsed_floorplan": { ... },
  "image_url": "https://...",
  "facing_direction": "E",
  "language": "English",
  "user_corrections": {
    "rooms": [
      { "index": 2, "name": "Master Bedroom", "type": "master_bedroom" }
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `parsed_floorplan` | object | Yes | Output from Phase 1 |
| `image_url` | string | Yes | Supabase Storage URL from Phase 1 |
| `facing_direction` | string | Yes | Same direction as Phase 1 |
| `language` | string | No | `"English"` (default) or `"Hindi"` |
| `user_corrections` | object | No | Room corrections from the review step |

**Response (200):**

```json
{
  "id": "uuid-of-analysis",
  "overall_score": 72,
  "grade": "B",
  "room_scores": [
    {
      "room_name": "Kitchen",
      "room_type": "kitchen",
      "actual_direction": "SE",
      "ideal_directions": ["SE"],
      "score": 95,
      "severity": "positive",
      "issues": [],
      "remedies": [],
      "rule_ids": ["kitchen-001"]
    }
  ],
  "critical_issues": ["Bathroom in the NE zone is a severe Vastu dosha..."],
  "positive_aspects": ["Kitchen is perfectly placed in the SE zone (Southeast / Agni)"],
  "report": {
    "summary": "...",
    "overall_interpretation": "...",
    "room_details": [
      {
        "room_name": "Kitchen",
        "finding": "...",
        "impact": "...",
        "remedy": null
      }
    ],
    "top_priorities": ["..."],
    "positive_notes": ["..."],
    "general_tips": ["..."]
  },
  "report_available": true,
  "image_url": "https://...",
  "schematic_data": {
    "rooms": [...],
    "entrance": {...},
    "facing": "E",
    "scores": [...]
  }
}
```

If report generation fails, `report` will be `null` and `report_available` will be `false`. The scores and schematic data are still returned (partial results).

---

### POST `/api/regenerate-report`

**Language Switch.** Re-generates the report text in a different language for an existing analysis.

**Request:** `application/json`

```json
{
  "analysis_id": "uuid-of-analysis",
  "language": "Hindi"
}
```

**Response (200):**

```json
{
  "report": {
    "summary": "...",
    "overall_interpretation": "...",
    "room_details": [...],
    "top_priorities": [...],
    "positive_notes": [...],
    "general_tips": [...]
  }
}
```

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| 404 | Analysis ID not found | `{ "error": "Analysis not found" }` |
| 500 | LLM or server error | `{ "error": "Failed to regenerate report" }` |

---

### GET `/api/report-pdf`

**PDF Data Retrieval.** Fetches the full analysis data for client-side PDF rendering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | UUID of the analysis |

**Response (200):**

```json
{
  "analysis": {
    "id": "uuid",
    "created_at": "2026-02-21T...",
    "facing_direction": "E",
    "overall_score": 72,
    "grade": "B",
    "vastu_analysis": { ... },
    "report_content": { ... },
    "parsed_floorplan": { ... },
    "image_url": "https://..."
  }
}
```

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing ID parameter | `{ "error": "Missing analysis ID" }` |
| 404 | Analysis not found | `{ "error": "Analysis not found" }` |
| 500 | Database error | `{ "error": "Failed to fetch analysis data" }` |

---

## Vastu Rules Engine

The rules engine is fully deterministic -- no LLM involvement. It lives in `src/lib/vastu/` and consists of:

### Rules Data (`rules-data.json`)

A structured JSON file containing 12 rules covering all common room types. Each rule specifies:

- **`ideal_directions`** -- Where the room should be for maximum Vastu compliance.
- **`acceptable_directions`** -- Okay but not ideal.
- **`bad_directions`** -- Problematic placement.
- **`critical_directions`** -- Severe Vastu dosha (defect).
- **`weight`** (1-10) -- How important this room's placement is. Entrance has weight 10 (highest).
- **`remedy`** -- Actionable fix if the room is in a non-ideal zone.

Covered room types: kitchen, master_bedroom, bedroom, bathroom, pooja_room, living_room, hall/entrance, study, dining_room, balcony, storage, drawing_room.

### Direction Metadata

Each compass direction is mapped to its Vastu element, presiding deity, and governing aspect:

| Direction | Element | Deity | Governs |
|-----------|---------|-------|---------|
| N | Water | Kubera | Wealth and Opportunities |
| NE | Water/Ether | Ishanya (Shiva) | Spirituality and Clarity |
| E | Fire/Light | Indra/Surya | Social Connections and Growth |
| SE | Fire | Agni | Energy and Cash Flow |
| S | Earth/Fire | Yama | Fame and Relaxation |
| SW | Earth | Pitru/Nairutya | Relationships and Stability |
| W | Air/Space | Varuna | Gains and Profits |
| NW | Air | Vayu | Support and Networking |
| CENTER | Ether/Space | Brahma | Overall Balance |

### Scoring Logic (`scoring.ts`)

1. Each room is evaluated against all applicable rules for its room type.
2. **Worst-score-wins:** If multiple rules apply, the lowest score dominates.
3. Scoring tiers:
   - **Ideal direction:** 95 points
   - **Acceptable direction:** 70 points
   - **Unclassified direction:** 50 points (default)
   - **Bad direction:** 35 points
   - **Critical direction:** 10 points
4. The overall score is a **weighted average** of all room scores, where each room's contribution is proportional to its rule weight.
5. Letter grades: A (85+), B (70-84), C (55-69), D (40-54), F (<40).

### Unknown Room Types

Room types not covered by the rules (e.g., "servant quarters", "terrace", "wash area") are handled via LLM-assisted matching in `rule-matcher.ts`. Claude Haiku 4.5 maps the unknown type to the closest known Vastu category with a single-token response.

---

## LLM Integration

All LLM calls go through AWS Bedrock. Two models are used, each for a specific purpose.

### Claude Sonnet 4.6 -- Floor Plan Parsing

- **Model ID:** `us.anthropic.claude-sonnet-4-6`
- **Purpose:** Multimodal vision analysis of floor plan images and PDFs.
- **What it does:** Receives the floor plan file plus the user's stated facing direction. Identifies every room, determines its compass-direction Vastu zone, estimates room size, detects windows/doors, and locates the main entrance.
- **Output:** Structured JSON via the `tool_use` API pattern, ensuring reliable parsing.
- **Temperature:** 0.1 (low, for consistent structured output).
- **PDF handling:** PDFs are sent natively as `document` content blocks -- no image conversion libraries needed. Claude reads all pages and identifies the floor plan page automatically.

### Claude Haiku 4.5 -- Report Generation and Rule Matching

- **Model ID (report):** `us.anthropic.claude-haiku-4-5-20251001-v1:0`
- **Model ID (rule matcher):** `us.anthropic.claude-haiku-4-5-v1:0`
- **Purpose:** Natural language report generation and unknown room type classification.
- **Report generation:** Receives the full Vastu analysis (scores, issues, remedies) and produces a warm, actionable report using original Sanskrit/Hindi Vastu terms with English explanations. Supports English and Hindi output.
- **Rule matching:** Given an unknown room name and type, returns the closest known Vastu category in a single token.
- **Temperature:** 0.4 for reports (some creative variation), 0 for rule matching (deterministic).

### Structured Output via Tool Use

Both LLM calls use Claude's `tool_use` API pattern to guarantee structured JSON responses. A tool schema matching the expected TypeScript interface is provided with `tool_choice: { type: "tool", name: "..." }`, forcing the model to respond with a well-formed JSON object.

---

## Deployment

### Vercel (Recommended)

VastuNow is designed for Vercel deployment. Key considerations:

1. **Serverless function timeouts:** Both `/api/analyze` and `/api/score` routes set `maxDuration = 60` (seconds). The Vercel Hobby plan has a 10-second timeout, which is insufficient for Claude Sonnet 4.6 vision calls. **A Vercel Pro plan (or higher) is required** for production use.

2. **Environment variables:** Set all variables from `.env.local` in the Vercel dashboard under Settings > Environment Variables.

3. **External packages:** The `next.config.ts` already includes `@aws-sdk/client-bedrock-runtime` in `serverExternalPackages` to ensure proper server-side bundling.

4. **Supabase image domains:** The Next.js config includes a remote pattern for `*.supabase.co` to allow image optimization for stored floor plans.

### Deploy Command

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Timeout Configuration Reference

| Route | `maxDuration` | Typical Latency | Notes |
|-------|--------------|-----------------|-------|
| `/api/analyze` | 60s | 5-15s | Claude Sonnet 4.6 vision processing |
| `/api/score` | 60s | 3-8s | Rules engine (instant) + Claude Haiku 4.5 report |
| `/api/regenerate-report` | 30s | 2-5s | Claude Haiku 4.5 only |
| `/api/report-pdf` | default | <1s | Database read only |

---

## Cost Estimates

VastuNow is completely free for users. All costs are infrastructure.

### Per-Analysis Cost Breakdown

| Component | Model / Service | Cost per Call |
|-----------|----------------|--------------|
| Floor plan parsing | Claude Sonnet 4.6 (vision) | $0.005 - $0.02 |
| Report generation | Claude Haiku 4.5 | $0.001 - $0.003 |
| Rule matching (if needed) | Claude Haiku 4.5 | <$0.001 |
| PDF with multiple pages | Claude Sonnet 4.6 (vision) | $0.02 - $0.05 |
| **Total per analysis** | | **$0.01 - $0.03** |

### Monthly Cost Projections

| Daily Volume | Claude (Sonnet + Haiku) | Supabase | Vercel | Total |
|-------------|------------------------|----------|--------|-------|
| 10/day | ~$3-6/mo | Free tier | Free tier* | ~$5-10/mo |
| 100/day | ~$30-60/mo | Free tier | Pro ($20/mo) | ~$50-80/mo |
| 1,000/day | ~$300-600/mo | ~$25/mo | Pro ($20/mo) | ~$350-650/mo |

*Free tier requires Pro upgrade for production due to timeout limits.

---

## License

This is a private project. All rights reserved.
