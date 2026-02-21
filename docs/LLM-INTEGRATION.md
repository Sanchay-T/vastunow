# LLM Integration Layer

Technical documentation for the VastuNow LLM integration, covering model selection,
prompt design, structured output handling, and cost considerations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [AWS Bedrock Client Configuration](#aws-bedrock-client-configuration)
3. [Floor Plan Parsing (Claude Sonnet 4.6)](#floor-plan-parsing-claude-sonnet-46)
4. [Report Generation (Claude Haiku 4.5)](#report-generation-claude-haiku-45)
5. [Rule Matching (Claude Haiku 4.5)](#rule-matching-claude-haiku-45)
6. [Cost Estimates](#cost-estimates)
7. [Temperature Settings](#temperature-settings)

---

## Architecture Overview

The application makes three distinct LLM calls during a full analysis pipeline. Each call
uses a different model selected for the specific task's requirements:

```
User uploads floor plan
        |
        v
[1] Claude Sonnet 4.6   -- Vision: parse floor plan image/PDF into structured room data
        |
        v
[2] Claude Haiku 4.5    -- Text: map any "unknown" room types to Vastu categories (conditional)
        |
        v
    Vastu Rules Engine   -- Deterministic scoring, no LLM involved
        |
        v
[3] Claude Haiku 4.5    -- Text: generate natural-language Vastu report from analysis JSON
```

### Model Selection Rationale

| Task | Model | Model ID | Why |
|------|-------|----------|-----|
| Floor plan parsing | Claude Sonnet 4.6 | `us.anthropic.claude-sonnet-4-6` | Requires strong vision capabilities to interpret architectural drawings. Sonnet balances accuracy and cost for image understanding tasks. |
| Room type matching | Claude Haiku 4.5 | `us.anthropic.claude-haiku-4-5-v1:0` | Trivial classification task -- maps a room name to a fixed category. Haiku is sufficient and keeps latency/cost minimal. |
| Report generation | Claude Haiku 4.5 | `us.anthropic.claude-haiku-4-5-20251001-v1:0` | Generates prose from structured data. The input (Vastu analysis JSON) is already well-structured, so the model only needs to produce readable text. Haiku handles this well at lower cost than Sonnet. |

All three calls go through AWS Bedrock's `InvokeModel` API, not the Messages API directly.
This means authentication is handled by AWS IAM credentials rather than Anthropic API keys.

### File Map

```
src/lib/llm/
  bedrock-client.ts    -- Shared BedrockRuntimeClient singleton
  prompts.ts           -- Prompt templates for parsing and report generation
  parse-floorplan.ts   -- Floor plan parsing with vision + tool use
  generate-report.ts   -- Report generation with tool use

src/lib/vastu/
  rule-matcher.ts      -- LLM-assisted room type classification
  types.ts             -- Shared TypeScript types (VastuAnalysis, RoomScore, etc.)
  scoring.ts           -- Deterministic Vastu scoring engine (no LLM)
```

---

## AWS Bedrock Client Configuration

**File:** `src/lib/llm/bedrock-client.ts`

```typescript
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

export const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
```

The client is a singleton exported for reuse by `parse-floorplan.ts` and
`generate-report.ts`. The `rule-matcher.ts` file creates its own separate client instance
(this is a minor inconsistency -- both use the same configuration).

**Configuration details:**

- **Region:** Reads from `AWS_REGION` environment variable, defaults to `us-east-1`.
- **Credentials:** Handled automatically by the AWS SDK credential chain (environment
  variables, IAM role, EC2 instance profile, etc.). No credentials are hardcoded.
- **API version:** All payloads set `anthropic_version: 'bedrock-2023-05-31'`, which is
  Bedrock's Anthropic provider protocol version.

**Required environment variables:**

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `AWS_REGION` | No | `us-east-1` | Bedrock endpoint region |
| `AWS_ACCESS_KEY_ID` | Yes* | -- | IAM credentials |
| `AWS_SECRET_ACCESS_KEY` | Yes* | -- | IAM credentials |

*Not needed if running on infrastructure with an IAM role (e.g., ECS, Lambda, EC2 with instance profile).

---

## Floor Plan Parsing (Claude Sonnet 4.6)

**Files:** `src/lib/llm/parse-floorplan.ts`, `src/lib/llm/prompts.ts`

This is the most complex LLM call in the system. It takes an architectural floor plan
(image or PDF) and extracts structured room data including room types, compass directions,
grid positions, and sizes.

### Function Signature

```typescript
export async function parseFloorPlan(
  fileBase64: string,
  facingDirection: string,
  isPdf: boolean = false
): Promise<ParsedFloorPlan>
```

### Prompt Design

The prompt is stored in `FLOORPLAN_PARSE_PROMPT` in `prompts.ts`. It has several
carefully designed sections:

**1. Context setting and orientation anchor:**

```
You are analyzing an architectural floor plan image.
The homeowner has indicated that their main door faces {facing_direction}.
```

The `{facing_direction}` placeholder is replaced at runtime with the user-provided compass
direction (e.g., "East", "North"). This is critical because floor plans do not carry
inherent compass orientation -- the model needs an external reference point to assign
compass zones to rooms.

**2. Extraction rules:**

```
RULES:
- Identify every distinct room, bathroom, kitchen, balcony, storage, corridor
- For each room, determine which compass zone it falls in: N, NE, E, SE, S, SW, W, NW, or CENTER
- The facing direction tells you orientation: if main door faces East, the entrance wall is on the East side
- For rooms that span multiple zones, assign the zone where the majority of the room area falls
- Estimate approximate area as: small (<100 sqft), medium (100-200 sqft), large (>200 sqft)
- Identify the main entrance door location and its compass zone
- Also provide a grid_row (0-2) and grid_col (0-2) for visualization purposes,
  where [0,0] = NW corner and [2,2] = SE corner when North is at top
```

Why each rule matters:

- **"Identify every distinct room"** -- Prevents the model from only listing major rooms
  and skipping corridors, balconies, and storage areas, which all have Vastu significance.
- **Compass zone enumeration** -- Constrains the model to exactly 9 valid values. Without
  this, the model might return "Northeast corner" or "between N and NE".
- **Facing direction = orientation rule** -- Explicitly teaches the model how to derive
  compass directions from the user's stated facing direction. This is the core spatial
  reasoning instruction.
- **Multi-zone room rule** -- Handles ambiguity for large rooms that span zones by
  specifying majority-area assignment.
- **Size estimation buckets** -- Provides concrete thresholds rather than letting the model
  invent its own scale.
- **Grid position** -- The `grid_row`/`grid_col` values (0-2 in each dimension) produce a
  3x3 grid mapping used by the frontend to render a schematic visualization of the floor
  plan layout.

**3. Allowed room types:**

```
Room types must be one of:
kitchen, master_bedroom, bedroom, bathroom, living_room, dining_room,
pooja_room, balcony, storage, corridor, study, utility, hall, drawing_room
```

This enumeration is deliberately kept in sync with the `RoomType` union in
`src/lib/vastu/types.ts`. The model also has the option to return `"unknown"` when it
cannot classify a room, which triggers the rule-matcher fallback (see
[Rule Matching](#rule-matching-claude-haiku-45)).

**4. Error sentinel values:**

```
If the image is not a floor plan, return: {"error": "not_a_floorplan"}
If the image contains multiple floors, return: {"error": "multiple_floors", "message": "..."}
```

These allow the API route to return appropriate 422 error responses to the client rather
than producing garbage analysis results.

### Tool Use / Structured Output Schema

Rather than relying on the model to produce valid JSON in its text output (which can
fail), the function uses Anthropic's **tool use** feature to guarantee structured output:

```typescript
const floorPlanTool = {
  name: 'parse_floorplan',
  description: 'Output the parsed floor plan data as structured JSON',
  input_schema: {
    type: 'object',
    properties: {
      rooms: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['kitchen', 'master_bedroom', 'bedroom', ...] },
            compass_direction: { type: 'string', enum: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'CENTER'] },
            grid_row: { type: 'number' },
            grid_col: { type: 'number' },
            size: { type: 'string', enum: ['small', 'medium', 'large'] },
            has_window: { type: 'boolean' },
            has_door: { type: 'boolean' }
          },
          required: ['name', 'type', 'compass_direction', 'grid_row', 'grid_col', 'size', 'has_window', 'has_door']
        }
      },
      entrance: { ... },
      total_rooms: { type: 'number' },
      plan_shape: { type: 'string' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      error: { type: 'string' },
      message: { type: 'string' }
    },
    required: ['rooms', 'entrance', 'total_rooms', 'plan_shape', 'confidence']
  }
};
```

The key design decisions:

- **`tool_choice: { type: 'tool', name: 'parse_floorplan' }`** -- Forces the model to
  always call this tool, ensuring structured output on every invocation. Without this, the
  model might respond with plain text.
- **`enum` constraints on `type`, `compass_direction`, `size`, `confidence`** -- The
  schema enforces valid values at the API level, preventing invalid strings from reaching
  downstream code.
- **`error` and `message` are optional properties** -- They are not in the `required`
  array, so they only appear when the model detects an error condition.

### PDF vs Image Input Handling

The function builds different content blocks depending on whether the input is a PDF or an
image:

```typescript
const fileContentBlock = isPdf
  ? {
      type: 'document' as const,
      source: {
        type: 'base64' as const,
        media_type: 'application/pdf' as const,
        data: fileBase64
      }
    }
  : {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg' as const,
        data: fileBase64
      }
    };
```

| Input Type | Content Block Type | Media Type | Notes |
|------------|-------------------|------------|-------|
| Image (JPEG, PNG, etc.) | `image` | `image/jpeg` | Uses Anthropic's vision capability directly. Note: the media type is hardcoded to `image/jpeg` -- PNG inputs will still work since Bedrock handles the actual decoding, but this could be made more precise. |
| PDF | `document` | `application/pdf` | Uses Bedrock's document understanding. PDFs are common for architectural plans exported from CAD software. |

The `isPdf` flag is determined upstream in the API route by checking `file.type === 'application/pdf'`.

### Response Parsing

```typescript
const response = await bedrock.send(command);
const responseBody = JSON.parse(new TextDecoder().decode(response.body));

const toolUseBlock = responseBody.content.find(
  (block: { type: string }) => block.type === 'tool_use'
);
return toolUseBlock.input as ParsedFloorPlan;
```

The response body from Bedrock is a byte array that must be decoded and parsed. The code
searches the `content` array for a block with `type: 'tool_use'` and extracts its `input`
field, which contains the structured data conforming to the tool schema.

Because `tool_choice` is set to force the tool call, the `tool_use` block is guaranteed
to exist in a successful response. If the Bedrock call itself fails (network error,
throttling, etc.), the error propagates as an exception caught by the API route handler.

### Error Cases

The `ParsedFloorPlan` type includes optional `error` and `message` fields. The API route
in `src/app/api/analyze/route.ts` checks for these:

```typescript
if (parsedPlan.error === 'not_a_floorplan') {
  return NextResponse.json({
    error: 'Could not identify this as a floor plan. Please upload a clear architectural layout.'
  }, { status: 422 });
}

if (parsedPlan.error === 'multiple_floors') {
  return NextResponse.json({
    error: 'Please upload a single floor plan. Multi-floor plans are not supported yet.'
  }, { status: 422 });
}
```

| Error | Trigger | HTTP Status | User-Facing Message |
|-------|---------|-------------|---------------------|
| `not_a_floorplan` | Image is a photo, diagram, or anything other than an architectural floor plan | 422 | "Could not identify this as a floor plan..." |
| `multiple_floors` | Image contains stacked multi-story plans | 422 | "Please upload a single floor plan..." |

### Output Type Definition

```typescript
export interface ParsedFloorPlan {
  rooms: ParsedRoom[];
  entrance: {
    compass_direction: Direction;
    grid_row: number;
    grid_col: number;
    side: string;
  };
  total_rooms: number;
  plan_shape: string;
  confidence: string;
  error?: string;
  message?: string;
}

export interface ParsedRoom {
  name: string;
  type: string;
  compass_direction: Direction;
  grid_row: number;
  grid_col: number;
  size: 'small' | 'medium' | 'large';
  has_window: boolean;
  has_door: boolean;
}
```

---

## Report Generation (Claude Haiku 4.5)

**Files:** `src/lib/llm/generate-report.ts`, `src/lib/llm/prompts.ts`

This call takes the structured `VastuAnalysis` object (scores, issues, remedies) and
generates a human-readable report with culturally appropriate language and actionable
advice.

### Function Signature

```typescript
export async function generateReport(
  analysis: VastuAnalysis,
  language: string = 'English'
): Promise<ReportContent>
```

### System Prompt Design

The report prompt is placed in the `system` field of the Bedrock payload (not as a user
message), establishing the model's persona and constraints:

```typescript
const payload = {
  // ...
  system: prompt,     // <-- system-level instruction
  messages: [
    {
      role: 'user',
      content: `Here is the Vastu analysis data:\n${JSON.stringify(analysis, null, 2)}`
    }
  ]
};
```

This separation matters because system prompts have stronger behavioral influence than
user messages in Claude's architecture. The analysis data is passed as the user message
since it is the "input to process" rather than an instruction.

### Tone and Language Guidelines

The prompt enforces a specific advisory tone:

```
TONE:
- Respectful and knowledgeable, like a trusted family advisor
- Never dismissive of Vastu principles
- Practical -- focus on what can actually be done
- Reassuring where things are good, honest but not fearful where things need attention
- DO NOT use extreme fear language ("your family will suffer", "this will cause disease")
- DO say things like "this placement may create challenges in..." or "for better energy flow, consider..."
```

The explicit prohibition of fear language is critical for this domain. Traditional Vastu
consultations sometimes use alarming language about consequences of violations. The prompt
steers the model toward a constructive, solution-oriented approach instead.

### Vastu Terminology Directive

```
VASTU TERMINOLOGY: Use original Sanskrit/Hindi terms with brief English explanations.
For example: "Agni kon (fire corner/SE)" or "Ishanya (northeast, the most sacred zone)".
This applies regardless of the report language.
```

This ensures cultural authenticity -- users familiar with Vastu expect Sanskrit terminology
-- while remaining accessible to those who are not. The directive applies even when the
report is generated in Hindi, because Hindi-speaking users still benefit from the
parenthetical clarifications for less common Sanskrit terms.

### Structured Output via Tool Use

Like floor plan parsing, report generation uses forced tool use for structured output:

```typescript
const reportTool = {
  name: 'generate_report',
  description: 'Output the Vastu report as structured JSON',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      overall_interpretation: { type: 'string' },
      room_details: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            room_name: { type: 'string' },
            finding: { type: 'string' },
            impact: { type: 'string' },
            remedy: { type: ['string', 'null'] }
          },
          required: ['room_name', 'finding', 'impact', 'remedy']
        }
      },
      top_priorities: { type: 'array', items: { type: 'string' } },
      positive_notes: { type: 'array', items: { type: 'string' } },
      general_tips: { type: 'array', items: { type: 'string' } }
    },
    required: ['summary', 'overall_interpretation', 'room_details',
               'top_priorities', 'positive_notes', 'general_tips']
  }
};
```

Notable schema decisions:

- **`remedy: { type: ['string', 'null'] }`** -- Rooms that are well-placed do not need
  remedies. The nullable type lets the model explicitly indicate "no remedy needed" rather
  than forcing it to invent one.
- **`top_priorities` as a separate array** -- Rather than requiring the frontend to sort
  and rank issues itself, the model is asked to prioritize, leveraging its understanding
  of Vastu severity.
- **`positive_notes` and `general_tips`** -- Ensures the report is balanced (not only
  negative findings) and includes universally applicable advice.

### Language Support

The `{language}` placeholder in the prompt supports any language the model can generate:

```
LANGUAGE: Generate the report in {language}.
```

Currently the application passes `'English'` or `'Hindi'`. The report can be regenerated
in a different language via the `/api/regenerate-report` endpoint without re-running the
analysis:

```typescript
// src/app/api/regenerate-report/route.ts
const reportContent = await generateReport(analysis.vastu_analysis, language);
```

### Output Type Definition

```typescript
export interface ReportContent {
  summary: string;
  overall_interpretation: string;
  room_details: ReportRoomDetail[];
  top_priorities: string[];
  positive_notes: string[];
  general_tips: string[];
}

export interface ReportRoomDetail {
  room_name: string;
  finding: string;
  impact: string;
  remedy: string | null;
}
```

---

## Rule Matching (Claude Haiku 4.5)

**File:** `src/lib/vastu/rule-matcher.ts`

### When It Is Triggered

This call is **conditional** -- it only fires when the floor plan parser returns a room
with a type of `"unknown"` or a type that does not match any known Vastu category. The
check happens in `src/app/api/score/route.ts`:

```typescript
const KNOWN_TYPES = new Set([
  'kitchen', 'master_bedroom', 'bedroom', 'bathroom', 'living_room',
  'dining_room', 'pooja_room', 'balcony', 'storage', 'corridor',
  'study', 'utility', 'hall', 'drawing_room'
]);

for (const room of finalPlan.rooms) {
  if (room.type === 'unknown' || !isKnownType(room.type)) {
    room.type = await matchUnknownRoomType(room.name, room.type);
  }
}
```

This means the LLM call is skipped entirely for well-parsed floor plans where every room
type is recognized. In practice, this call fires 0-2 times per analysis.

### How Unknown Room Types Are Mapped

The function uses a minimal prompt with no tool use:

```typescript
export async function matchUnknownRoomType(
  roomName: string,
  roomType: string
): Promise<string> {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 20,
    temperature: 0,
    system: `You match unknown room types to the closest Vastu rule category.
Available categories: kitchen, master_bedroom, bedroom, bathroom, living_room,
dining_room, pooja_room, balcony, storage, corridor, study, utility, hall, drawing_room.
Return ONLY the category name, nothing else.`,
    messages: [
      {
        role: 'user',
        content: `Room name: "${roomName}", detected type: "${roomType}". What is the closest Vastu category?`
      }
    ]
  };
  // ...
}
```

Design notes:

- **`max_tokens: 20`** -- The expected output is a single word (e.g., `"bedroom"`).
  Setting max_tokens low prevents the model from generating explanations.
- **`temperature: 0`** -- Deterministic output. Given the same room name and type, the
  mapping should always be the same. There is no benefit to creativity here.
- **No tool use** -- The output is a single string, not structured data. Tool use overhead
  is unnecessary. The response is parsed by extracting the text content block.
- **Fallback to `'storage'`** -- If the text block is empty or missing, the function
  returns `'storage'` as a safe default:

```typescript
const textBlock = responseBody.content.find((block: { type: string }) => block.type === 'text');
return textBlock?.text?.trim() || 'storage';
```

`'storage'` is chosen as the fallback because it has the least Vastu significance
(low weight in the rules engine), so a misclassified room defaults to having minimal
impact on the overall score.

### Example Mappings

| Room Name | Detected Type | Expected Output |
|-----------|---------------|-----------------|
| "Servant Room" | "unknown" | `bedroom` |
| "Wash Area" | "unknown" | `utility` |
| "Mandir" | "unknown" | `pooja_room` |
| "Foyer" | "unknown" | `hall` |
| "Pantry" | "unknown" | `kitchen` |

---

## Cost Estimates

All prices are based on AWS Bedrock's published pricing for Anthropic models as of early
2025. Actual costs may vary with region and negotiated pricing.

### Per-Call Estimates

| Call | Model | Input Tokens (est.) | Output Tokens (est.) | Cost per Call (est.) |
|------|-------|---------------------|----------------------|----------------------|
| Floor plan parse | Claude Sonnet 4.6 | ~1,500 text + image tokens vary by resolution | ~500 | ~$0.01 - $0.03 (depends heavily on image size) |
| Room type match | Claude Haiku 4.5 | ~120 | ~5 | ~$0.0001 |
| Report generation | Claude Haiku 4.5 | ~800 (analysis JSON) + ~300 (system prompt) | ~1,500 | ~$0.002 |

### Per-Analysis Total

A typical full analysis (one parse + zero room-type matches + one report) costs
approximately **$0.01 - $0.03**, dominated almost entirely by the Sonnet vision call.

If 1-2 room type matching calls are needed, the additional cost is negligible (<$0.001).

### Notes on Image Token Costs

Bedrock bills image inputs based on the image dimensions. A typical floor plan image
(1000x1000 to 2000x2000 pixels) may consume 1,000-4,000 tokens worth of image processing.
PDF inputs may cost more if the document contains multiple pages (though the prompt
instructs for single-floor analysis).

---

## Temperature Settings

Each LLM call uses a deliberately chosen temperature:

| Call | Temperature | Rationale |
|------|-------------|-----------|
| Floor plan parsing | **0.1** | Near-deterministic. The task is spatial analysis with a correct answer -- room positions and types should not vary between runs. A small amount of temperature (0.1 vs 0.0) allows the model slight flexibility in borderline cases (e.g., a room that sits between two compass zones) without introducing randomness in clear cases. |
| Room type matching | **0.0** | Fully deterministic. This is a pure classification task with exactly one correct answer. The same input should always produce the same output. |
| Report generation | **0.4** | Moderate creativity. The report is natural language prose that benefits from varied phrasing -- the same analysis run twice should read differently rather than being identical boilerplate. However, the temperature is kept below 0.5 to prevent the model from being overly creative with Vastu interpretations or inventing remedies not grounded in the input data. |

### Why Not Temperature 0 for Everything?

While floor plan parsing and room matching benefit from determinism, report generation at
temperature 0 would produce identical, robotic-sounding text for similar analyses. A
temperature of 0.4 gives the report a natural, conversational quality while staying
factually grounded.

### Why Not Temperature 0 for Floor Plan Parsing?

A temperature of exactly 0 can occasionally cause the model to get "stuck" in degenerate
outputs for ambiguous inputs. The 0.1 setting provides a tiny amount of noise that helps
the model navigate edge cases (e.g., an unusually shaped room, an unclear label in the
floor plan) without meaningfully affecting accuracy in clear cases.

---

## Request Payload Reference

### Floor Plan Parsing Payload

```typescript
{
  anthropic_version: 'bedrock-2023-05-31',
  max_tokens: 2000,
  temperature: 0.1,
  tools: [floorPlanTool],
  tool_choice: { type: 'tool', name: 'parse_floorplan' },
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: '<prompt with facing direction>' },
        { type: 'image' | 'document', source: { type: 'base64', media_type: '...', data: '...' } }
      ]
    }
  ]
}
```

### Report Generation Payload

```typescript
{
  anthropic_version: 'bedrock-2023-05-31',
  max_tokens: 3000,
  temperature: 0.4,
  system: '<report generation prompt with language>',
  tools: [reportTool],
  tool_choice: { type: 'tool', name: 'generate_report' },
  messages: [
    {
      role: 'user',
      content: 'Here is the Vastu analysis data:\n<JSON>'
    }
  ]
}
```

### Room Type Matching Payload

```typescript
{
  anthropic_version: 'bedrock-2023-05-31',
  max_tokens: 20,
  temperature: 0,
  system: '<classification prompt>',
  messages: [
    {
      role: 'user',
      content: 'Room name: "<name>", detected type: "<type>". What is the closest Vastu category?'
    }
  ]
}
```

---

## Pipeline Integration

The three LLM calls are orchestrated across two API routes:

### POST /api/analyze

1. Receives multipart form data (floor plan file + facing direction).
2. Calls `parseFloorPlan()` (Claude Sonnet 4.6).
3. Checks for error sentinels (`not_a_floorplan`, `multiple_floors`).
4. Returns parsed data to the client for an optional review step.

### POST /api/score

1. Receives the parsed floor plan (optionally with user corrections).
2. Applies user corrections to room names/types if provided.
3. Loops through rooms -- calls `matchUnknownRoomType()` (Claude Haiku 4.5) for any
   unrecognized types.
4. Runs the deterministic Vastu scoring engine (`analyzeVastu()`).
5. Calls `generateReport()` (Claude Haiku 4.5) to produce the narrative report.
6. Stores results in Supabase (with graceful fallback if DB is unavailable).
7. Returns the full analysis response.

### POST /api/regenerate-report

1. Fetches an existing analysis from Supabase by ID.
2. Calls `generateReport()` with a different language.
3. Updates the stored report.

This separation allows the floor plan parsing (the most expensive call) to happen once,
while report generation can be repeated cheaply in different languages.
