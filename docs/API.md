# VastuNow API Documentation

Base URL: `/api`

All endpoints are Next.js API routes served under the `/api` path prefix. The application uses server-side processing with AWS Bedrock (Claude models) for AI-powered floor plan analysis and Supabase for persistence.

---

## Table of Contents

- [POST /api/analyze](#post-apianalyze)
- [POST /api/score](#post-apiscore)
- [POST /api/regenerate-report](#post-apiregenerate-report)
- [GET /api/report-pdf](#get-apireport-pdf)
- [Pipeline Flow](#pipeline-flow)
- [Type Reference](#type-reference)
- [Error Handling](#error-handling)

---

## POST /api/analyze

Accepts a floor plan image or PDF, uploads it to storage, and uses Claude Sonnet 4.6 (via AWS Bedrock) to parse the architectural layout into structured room data.

**Max Duration:** 60 seconds

### Request

**Content-Type:** `multipart/form-data`

| Field    | Type   | Required | Description                                                                 |
|----------|--------|----------|-----------------------------------------------------------------------------|
| `floorplan` | `File` | Yes      | The floor plan image (JPEG, PNG) or PDF file.                              |
| `facing` | `string` | Yes    | Compass direction the building faces. One of: `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`. |

### Internal Steps

1. Extracts the uploaded file and facing direction from the multipart form data.
2. Converts the file to a `Buffer`.
3. Attempts to upload the file to Supabase Storage. On failure, falls back to a truncated base64 data URL.
4. Encodes the file as base64 and sends it to Claude Sonnet 4.6 via AWS Bedrock with a structured tool call (`parse_floorplan`) that forces the model to return typed JSON.
5. Checks the parsed result for known error conditions (`not_a_floorplan`, `multiple_floors`).
6. Returns the parsed floor plan data for the client-side review step.

### Response -- Success (200)

```json
{
  "parsed_floorplan": {
    "rooms": [
      {
        "name": "Master Bedroom",
        "type": "master_bedroom",
        "compass_direction": "SW",
        "grid_row": 2,
        "grid_col": 0,
        "size": "large",
        "has_window": true,
        "has_door": true
      }
    ],
    "entrance": {
      "compass_direction": "N",
      "grid_row": 0,
      "grid_col": 1,
      "side": "North wall"
    },
    "total_rooms": 6,
    "plan_shape": "rectangular",
    "confidence": "high"
  },
  "image_url": "https://your-supabase-url.co/storage/v1/object/public/floorplans/1700000000000-plan.jpg",
  "facing_direction": "N",
  "confidence": "high"
}
```

### Response -- Validation Error (400)

Returned when required fields are missing from the request.

```json
{
  "error": "Missing required fields"
}
```

### Response -- Unprocessable Entity (422)

Returned when the uploaded file is not recognized as a floor plan.

```json
{
  "error": "Could not identify this as a floor plan. Please upload a clear architectural layout."
}
```

Returned when the uploaded file contains multiple floors.

```json
{
  "error": "Please upload a single floor plan. Multi-floor plans are not supported yet."
}
```

### Response -- Server Error (500)

```json
{
  "error": "Failed to read your floor plan. Please try again."
}
```

### Example curl

```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "floorplan=@./my-floorplan.jpg" \
  -F "facing=N"
```

---

## POST /api/score

Takes the parsed floor plan data (optionally with user corrections from the review step), runs it through the Vastu rules engine, generates a natural language report via Claude Haiku 4.5, and persists the analysis to Supabase.

**Max Duration:** 60 seconds

### Request

**Content-Type:** `application/json`

```json
{
  "parsed_floorplan": { ... },
  "image_url": "string",
  "facing_direction": "string",
  "language": "string (optional, default: 'English')",
  "user_corrections": {
    "rooms": [
      {
        "index": 0,
        "name": "Kitchen (optional)",
        "type": "kitchen (optional)"
      }
    ]
  }
}
```

| Field              | Type              | Required | Description                                                                                          |
|--------------------|-------------------|----------|------------------------------------------------------------------------------------------------------|
| `parsed_floorplan` | `ParsedFloorPlan` | Yes      | The structured floor plan object returned by `/api/analyze`.                                         |
| `image_url`        | `string`          | Yes      | The image URL returned by `/api/analyze`.                                                            |
| `facing_direction` | `string`          | Yes      | Compass direction the building faces (e.g., `N`, `NE`, `E`, etc.).                                  |
| `language`         | `string`          | No       | Language for the generated report. Defaults to `"English"`. Examples: `"Hindi"`, `"Tamil"`, `"Telugu"`. |
| `user_corrections` | `object`          | No       | Corrections from the review step. Contains a `rooms` array with index-based overrides for `name` and/or `type`. |

#### user_corrections Schema

| Field           | Type    | Required | Description                                              |
|-----------------|---------|----------|----------------------------------------------------------|
| `rooms`         | `array` | No       | Array of room correction objects.                        |
| `rooms[].index` | `number`| Yes      | Zero-based index of the room in `parsed_floorplan.rooms`.|
| `rooms[].name`  | `string`| No       | Corrected room name.                                     |
| `rooms[].type`  | `string`| No       | Corrected room type. Must be a valid `RoomType`.         |

#### Valid Room Types

`kitchen`, `master_bedroom`, `bedroom`, `bathroom`, `living_room`, `dining_room`, `pooja_room`, `balcony`, `storage`, `corridor`, `study`, `utility`, `hall`, `drawing_room`

### Internal Steps

1. Parses the JSON request body.
2. If `user_corrections` is provided, applies name/type overrides to the corresponding rooms by index.
3. For any room with type `"unknown"` or an unrecognized type, calls Claude Haiku 4.5 via `matchUnknownRoomType()` to classify it into the nearest known Vastu category.
4. Passes the finalized floor plan and facing direction to the Vastu rules engine (`analyzeVastu`), which:
   - Scores each room based on its compass direction vs. ideal/acceptable/bad/critical directions from the rule set.
   - Computes a weighted overall score (0--100).
   - Assigns a letter grade (`A` >= 85, `B` >= 70, `C` >= 55, `D` >= 40, `F` < 40).
   - Collects critical issues and positive aspects.
5. Generates a structured natural language report via Claude Haiku 4.5 using the `generate_report` tool call.
6. Persists the full analysis to the Supabase `analyses` table. On failure, falls back to a locally generated UUID.
7. Returns the complete analysis result.

### Response -- Success (200)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "overall_score": 72,
  "grade": "B",
  "room_scores": [
    {
      "room_name": "Master Bedroom",
      "room_type": "master_bedroom",
      "actual_direction": "SW",
      "ideal_directions": ["SW", "S"],
      "score": 95,
      "severity": "positive",
      "issues": [],
      "remedies": [],
      "rule_ids": ["master_bedroom_direction"]
    },
    {
      "room_name": "Kitchen",
      "room_type": "kitchen",
      "actual_direction": "NW",
      "ideal_directions": ["SE"],
      "score": 35,
      "severity": "major",
      "issues": [
        "Kitchen in the NW zone is not recommended. Best placement: SE"
      ],
      "remedies": [
        "Place a red or orange light in the SE corner of the kitchen to activate the Agni element."
      ],
      "rule_ids": ["kitchen_direction"]
    }
  ],
  "critical_issues": [
    "Bathroom in the NE zone is a severe Vastu dosha. This should ideally be in NW, W"
  ],
  "positive_aspects": [
    "Master Bedroom is perfectly placed in the SW zone (Southwest / Nairutya)"
  ],
  "report": {
    "summary": "Your home scores 72/100 on Vastu compliance...",
    "overall_interpretation": "The layout has a good foundation with the master bedroom well-placed...",
    "room_details": [
      {
        "room_name": "Master Bedroom",
        "finding": "Correctly positioned in the Southwest zone.",
        "impact": "Promotes stability, strength, and restful sleep for the head of household.",
        "remedy": null
      },
      {
        "room_name": "Kitchen",
        "finding": "Located in the Northwest instead of the ideal Southeast.",
        "impact": "May lead to digestive issues and financial strain over time.",
        "remedy": "Place a red or orange light in the SE corner of the kitchen."
      }
    ],
    "top_priorities": [
      "Relocate or remediate the bathroom placement in the NE zone.",
      "Address kitchen placement with Agni-element remedies."
    ],
    "positive_notes": [
      "Master Bedroom is ideally placed in the Southwest."
    ],
    "general_tips": [
      "Keep the center (Brahmasthan) of the house open and clutter-free.",
      "Ensure the NE corner is kept clean and well-lit."
    ]
  },
  "report_available": true,
  "image_url": "https://your-supabase-url.co/storage/v1/object/public/floorplans/1700000000000-plan.jpg",
  "schematic_data": {
    "rooms": [ ... ],
    "entrance": {
      "compass_direction": "N",
      "grid_row": 0,
      "grid_col": 1,
      "side": "North wall"
    },
    "facing": "N",
    "scores": [ ... ]
  }
}
```

#### Fields

| Field               | Type            | Description                                                                |
|---------------------|-----------------|----------------------------------------------------------------------------|
| `id`                | `string (UUID)` | Analysis ID. From Supabase if persisted, otherwise a locally generated UUID. |
| `overall_score`     | `number`        | Weighted Vastu score from 0 to 100.                                        |
| `grade`             | `string`        | Letter grade: `A`, `B`, `C`, `D`, or `F`.                                 |
| `room_scores`       | `RoomScore[]`   | Per-room scoring breakdown. See [Type Reference](#type-reference).         |
| `critical_issues`   | `string[]`      | List of critical Vastu dosha descriptions.                                 |
| `positive_aspects`  | `string[]`      | List of well-placed room descriptions.                                     |
| `report`            | `ReportContent \| null` | Structured natural language report, or `null` if generation failed.  |
| `report_available`  | `boolean`       | `true` if report was successfully generated.                               |
| `image_url`         | `string`        | The floor plan image URL (passed through from input).                      |
| `schematic_data`    | `object`        | Data for rendering the schematic view on the client.                       |

### Response -- Server Error (500)

```json
{
  "error": "Analysis failed. Please try again."
}
```

### Example curl

```bash
curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "parsed_floorplan": {
      "rooms": [
        {
          "name": "Master Bedroom",
          "type": "master_bedroom",
          "compass_direction": "SW",
          "grid_row": 2,
          "grid_col": 0,
          "size": "large",
          "has_window": true,
          "has_door": true
        }
      ],
      "entrance": {
        "compass_direction": "N",
        "grid_row": 0,
        "grid_col": 1,
        "side": "North wall"
      },
      "total_rooms": 1,
      "plan_shape": "rectangular",
      "confidence": "high"
    },
    "image_url": "https://example.com/plan.jpg",
    "facing_direction": "N",
    "language": "English"
  }'
```

---

## POST /api/regenerate-report

Fetches an existing analysis from Supabase by ID and regenerates the natural language report in a different language using Claude Haiku 4.5. Updates the stored report in the database.

**Max Duration:** 30 seconds

### Request

**Content-Type:** `application/json`

```json
{
  "analysis_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "language": "Hindi"
}
```

| Field         | Type     | Required | Description                                                    |
|---------------|----------|----------|----------------------------------------------------------------|
| `analysis_id` | `string` | Yes      | UUID of the analysis record returned by `/api/score`.          |
| `language`    | `string` | Yes      | Target language for the report (e.g., `"English"`, `"Hindi"`, `"Tamil"`, `"Telugu"`). |

### Internal Steps

1. Parses the JSON request body for `analysis_id` and `language`.
2. Queries the Supabase `analyses` table for the record matching `analysis_id`, selecting only the `vastu_analysis` column.
3. If no record is found, returns 404.
4. Calls `generateReport()` with the stored Vastu analysis data and the new language.
5. Updates the Supabase record with the new `report_content` and `report_language`.
6. Returns the regenerated report.

### Response -- Success (200)

```json
{
  "report": {
    "summary": "Your home scores 72/100...",
    "overall_interpretation": "The layout has a good foundation...",
    "room_details": [
      {
        "room_name": "Master Bedroom",
        "finding": "Correctly positioned in the Southwest zone.",
        "impact": "Promotes stability and restful sleep.",
        "remedy": null
      }
    ],
    "top_priorities": [
      "Address bathroom placement in the NE zone."
    ],
    "positive_notes": [
      "Master Bedroom is ideally placed."
    ],
    "general_tips": [
      "Keep the Brahmasthan open and clutter-free."
    ]
  }
}
```

### Response -- Not Found (404)

Returned when the `analysis_id` does not match any record in the database.

```json
{
  "error": "Analysis not found"
}
```

### Response -- Server Error (500)

```json
{
  "error": "Failed to regenerate report"
}
```

### Example curl

```bash
curl -X POST http://localhost:3000/api/regenerate-report \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "language": "Hindi"
  }'
```

---

## GET /api/report-pdf

Retrieves the full analysis record from Supabase for a given analysis ID. The response provides all the data needed for client-side PDF generation using `@react-pdf/renderer`.

### Request

**Method:** `GET`

**Query Parameters:**

| Parameter | Type     | Required | Description                                           |
|-----------|----------|----------|-------------------------------------------------------|
| `id`      | `string` | Yes      | UUID of the analysis record returned by `/api/score`. |

### Internal Steps

1. Extracts the `id` query parameter from the URL.
2. If `id` is missing, returns 400.
3. Queries the Supabase `analyses` table for the full record matching the ID.
4. If no record is found, returns 404.
5. Returns a curated subset of the analysis fields needed for PDF rendering.

### Response -- Success (200)

```json
{
  "analysis": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "created_at": "2026-01-15T10:30:00.000Z",
    "facing_direction": "N",
    "overall_score": 72,
    "grade": "B",
    "vastu_analysis": {
      "overall_score": 72,
      "grade": "B",
      "room_scores": [ ... ],
      "critical_issues": [ ... ],
      "positive_aspects": [ ... ],
      "summary": ""
    },
    "report_content": {
      "summary": "...",
      "overall_interpretation": "...",
      "room_details": [ ... ],
      "top_priorities": [ ... ],
      "positive_notes": [ ... ],
      "general_tips": [ ... ]
    },
    "parsed_floorplan": {
      "rooms": [ ... ],
      "entrance": { ... },
      "total_rooms": 6,
      "plan_shape": "rectangular",
      "confidence": "high"
    },
    "image_url": "https://your-supabase-url.co/storage/v1/object/public/floorplans/1700000000000-plan.jpg"
  }
}
```

#### Fields in `analysis`

| Field               | Type              | Description                                                          |
|---------------------|-------------------|----------------------------------------------------------------------|
| `id`                | `string (UUID)`   | The analysis record ID.                                              |
| `created_at`        | `string (ISO 8601)` | Timestamp when the analysis was created.                          |
| `facing_direction`  | `string`          | The compass direction the building faces.                            |
| `overall_score`     | `number`          | Weighted Vastu score (0--100).                                       |
| `grade`             | `string`          | Letter grade (`A`, `B`, `C`, `D`, `F`).                              |
| `vastu_analysis`    | `VastuAnalysis`   | Full Vastu analysis object with room scores and issues.              |
| `report_content`    | `ReportContent`   | The generated natural language report.                               |
| `parsed_floorplan`  | `ParsedFloorPlan` | The parsed floor plan structure with room and entrance data.         |
| `image_url`         | `string`          | URL of the uploaded floor plan image.                                |

### Response -- Validation Error (400)

```json
{
  "error": "Missing analysis ID"
}
```

### Response -- Not Found (404)

```json
{
  "error": "Analysis not found"
}
```

### Response -- Server Error (500)

```json
{
  "error": "Failed to fetch analysis data"
}
```

### Example curl

```bash
curl "http://localhost:3000/api/report-pdf?id=a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

---

## Pipeline Flow

The API endpoints are designed to be called in sequence, forming a multi-step analysis pipeline. The typical user flow chains them as follows:

```
Step 1: Upload & Parse            Step 2: Review & Score           Step 3 (optional): Language Switch
========================          ========================         =================================

POST /api/analyze                 POST /api/score                  POST /api/regenerate-report
  |                                 |                                |
  |  Input:                         |  Input:                        |  Input:
  |  - floorplan (file)             |  - parsed_floorplan            |  - analysis_id
  |  - facing direction             |  - image_url                   |  - language
  |                                 |  - facing_direction            |
  |  Processing:                    |  - language (optional)         |  Processing:
  |  1. Upload to storage           |  - user_corrections (opt)      |  1. Fetch analysis from DB
  |  2. Claude Sonnet 4.6           |                                |  2. Claude Haiku 4.5
  |     parses floor plan           |  Processing:                   |     regenerates report
  |                                 |  1. Apply corrections          |  3. Update DB
  |  Output:                        |  2. Resolve unknown types      |
  |  - parsed_floorplan   --------->|  3. Vastu rules engine         |  Output:
  |  - image_url          --------->|  4. Claude Haiku 4.5           |  - report (new language)
  |  - facing_direction   --------->|     generates report           |
  |  - confidence                   |  5. Persist to Supabase        |
  v                                 |                                v
                                    |  Output:
                                    |  - id (analysis ID)  ----------+-------> GET /api/report-pdf
                                    |  - overall_score                         (Step 4: PDF Data)
                                    |  - grade                                   |
                                    |  - room_scores                             |  Input:
                                    |  - critical_issues                         |  - id (query param)
                                    |  - positive_aspects                        |
                                    |  - report                                  |  Output:
                                    |  - schematic_data                          |  - Full analysis record
                                    v                                            |    for PDF rendering
                                                                                 v
```

### Step-by-Step Walkthrough

**Step 1 -- Upload and Parse (`POST /api/analyze`)**

The user uploads a floor plan image or PDF along with the building's facing direction. The system stores the file and uses Claude Sonnet 4.6 vision to extract a structured representation of rooms, their compass positions, and the entrance location. The client receives the parsed data for review.

**Step 2 -- Review and Score (`POST /api/score`)**

The client presents the parsed rooms to the user for optional correction (renaming or re-typing rooms). The corrected data is sent back along with the original image URL and facing direction. The server resolves any unknown room types, evaluates all rooms against the Vastu rules engine, generates a natural language report, persists the result, and returns the complete analysis with scores, issues, and remedies.

**Step 3 -- Language Switch (`POST /api/regenerate-report`)** *(optional)*

If the user wants the report in a different language, the client sends the analysis ID and the desired language. The server retrieves the stored analysis, regenerates the report text via Claude Haiku 4.5, and updates the database.

**Step 4 -- PDF Export (`GET /api/report-pdf`)** *(optional)*

When the user requests a PDF download, the client fetches the full analysis record by ID. The PDF is rendered entirely on the client side using `@react-pdf/renderer`; this endpoint only supplies the data.

---

## Type Reference

### Direction

```typescript
type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'CENTER';
```

### Severity

```typescript
type Severity = 'critical' | 'major' | 'minor' | 'positive';
```

### RoomType

```typescript
type RoomType =
  | 'kitchen' | 'master_bedroom' | 'bedroom' | 'bathroom'
  | 'living_room' | 'dining_room' | 'pooja_room' | 'balcony'
  | 'storage' | 'corridor' | 'study' | 'utility'
  | 'hall' | 'drawing_room' | 'unknown';
```

### ParsedRoom

```typescript
interface ParsedRoom {
  name: string;               // Display name (e.g., "Master Bedroom")
  type: string;               // RoomType value
  compass_direction: Direction;
  grid_row: number;           // Row position in the floor plan grid
  grid_col: number;           // Column position in the floor plan grid
  size: 'small' | 'medium' | 'large';
  has_window: boolean;
  has_door: boolean;
}
```

### ParsedFloorPlan

```typescript
interface ParsedFloorPlan {
  rooms: ParsedRoom[];
  entrance: {
    compass_direction: Direction;
    grid_row: number;
    grid_col: number;
    side: string;             // e.g., "North wall"
  };
  total_rooms: number;
  plan_shape: string;         // e.g., "rectangular", "L-shaped"
  confidence: string;         // "high", "medium", or "low"
  error?: string;             // "not_a_floorplan" | "multiple_floors" (if applicable)
  message?: string;           // Human-readable error message
}
```

### RoomScore

```typescript
interface RoomScore {
  room_name: string;
  room_type: RoomType;
  actual_direction: Direction;
  ideal_directions: Direction[];
  score: number;              // 0-100
  severity: Severity;
  issues: string[];
  remedies: string[];
  rule_ids: string[];
}
```

### VastuAnalysis

```typescript
interface VastuAnalysis {
  overall_score: number;      // 0-100, weighted average
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  room_scores: RoomScore[];
  critical_issues: string[];
  positive_aspects: string[];
  summary: string;
}
```

### ReportContent

```typescript
interface ReportContent {
  summary: string;
  overall_interpretation: string;
  room_details: ReportRoomDetail[];
  top_priorities: string[];
  positive_notes: string[];
  general_tips: string[];
}

interface ReportRoomDetail {
  room_name: string;
  finding: string;
  impact: string;
  remedy: string | null;
}
```

---

## Error Handling

All endpoints return errors as JSON objects with a top-level `error` field containing a human-readable message.

### HTTP Status Codes

| Code | Meaning                | When It Occurs                                                          |
|------|------------------------|-------------------------------------------------------------------------|
| 200  | Success                | Request processed successfully.                                         |
| 400  | Bad Request            | Missing required fields (`floorplan`, `facing`, or `id` query param).   |
| 404  | Not Found              | The `analysis_id` or `id` does not match any record in the database.    |
| 422  | Unprocessable Entity   | The uploaded file is not a recognizable floor plan or contains multiple floors. |
| 500  | Internal Server Error  | Unexpected failure in parsing, scoring, report generation, or database access. |

### Graceful Degradation

The system implements graceful degradation in several places:

- **Storage upload failure:** If Supabase Storage is unavailable, the `/api/analyze` endpoint falls back to a truncated base64 data URL and continues processing.
- **Report generation failure:** If Claude Haiku 4.5 fails to generate the report during `/api/score`, the endpoint still returns the analysis with `report: null` and `report_available: false`.
- **Database persistence failure:** If the Supabase `analyses` table insert fails during `/api/score`, the endpoint falls back to a locally generated UUID and still returns the full analysis response. Note that `/api/regenerate-report` and `/api/report-pdf` will not work without a valid database record.

### AI Models Used

| Endpoint                | Model                                 | Purpose                           |
|-------------------------|---------------------------------------|-----------------------------------|
| `/api/analyze`          | Claude Sonnet 4.6 (via AWS Bedrock)   | Vision-based floor plan parsing   |
| `/api/score`            | Claude Haiku 4.5 (via AWS Bedrock)    | Unknown room type classification  |
| `/api/score`            | Claude Haiku 4.5 (via AWS Bedrock)    | Natural language report generation|
| `/api/regenerate-report`| Claude Haiku 4.5 (via AWS Bedrock)    | Report regeneration in new language|
