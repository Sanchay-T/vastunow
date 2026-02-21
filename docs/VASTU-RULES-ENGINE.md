# Vastu Rules Engine -- Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Direction Metadata -- The 9 Vastu Zones](#direction-metadata----the-9-vastu-zones)
4. [Room Types and Rule Table](#room-types-and-rule-table)
5. [Scoring Algorithm -- Worst Score Wins](#scoring-algorithm----worst-score-wins)
6. [Score Ranges and Severity Levels](#score-ranges-and-severity-levels)
7. [Grading System](#grading-system)
8. [Weighted Overall Score Calculation](#weighted-overall-score-calculation)
9. [LLM-Assisted Rule Matching](#llm-assisted-rule-matching)
10. [How to Add New Rules](#how-to-add-new-rules)

---

## Overview

The Vastu Rules Engine is a deterministic scoring system that evaluates how well a floor plan conforms to Vastu Shastra principles. It works by:

1. Taking a parsed floor plan (rooms with compass directions) as input.
2. Matching each room against a rule set defined in `rules-data.json`.
3. Scoring each room based on its compass zone placement (ideal, acceptable, bad, or critical).
4. Using a **worst-score-wins** algorithm to collapse multiple rules per room into a single score.
5. Computing a **weighted overall score** across all rooms, where weights reflect each room type's Vastu importance.
6. Producing a letter grade (A through F), a list of critical issues, and positive aspects.

### Key Source Files

| File | Purpose |
|------|---------|
| `src/lib/vastu/types.ts` | TypeScript types for rules, scores, and analysis results |
| `src/lib/vastu/rules-data.json` | Rule definitions and direction metadata (the knowledge base) |
| `src/lib/vastu/scoring.ts` | Core scoring logic: per-room scoring, weighted aggregation, grading |
| `src/lib/vastu/rule-matcher.ts` | LLM-assisted fallback for unknown room types |

---

## Architecture

```
Floor Plan (ParsedFloorPlan)
        |
        v
+-----------------+
|  analyzeVastu() |  <-- scoring.ts (entry point)
+-----------------+
        |
        |--- For each room:
        |       |
        |       v
        |   scoreRoom(room, direction, rules)
        |       |
        |       |--- Filter rules by room_type
        |       |--- Score direction against each rule
        |       |--- Return worst score (pessimistic)
        |       |
        |       v
        |   RoomScore { score, severity, issues, remedies }
        |
        |--- For entrance (if present):
        |       |
        |       v
        |   scoreRoom(entrance, direction, entrance-rules)
        |
        v
Aggregate weighted scores --> overall_score --> grade
        |
        v
VastuAnalysis { overall_score, grade, room_scores, critical_issues, positive_aspects }
```

When a room type is `"unknown"`, the system can optionally call `matchUnknownRoomType()` from `rule-matcher.ts` to use an LLM to classify it into a known category before scoring.

---

## Direction Metadata -- The 9 Vastu Zones

Vastu Shastra divides any space into 9 directional zones, each governed by a specific element, deity, and life domain. These are defined in the `direction_metadata` section of `rules-data.json`.

| Direction | Code | Element | Deity | Governs |
|-----------|------|---------|-------|---------|
| North | `N` | Water | Kubera | Wealth & Opportunities |
| Northeast | `NE` | Water/Ether | Ishanya (Shiva) | Spirituality & Clarity |
| East | `E` | Fire/Light | Indra/Surya | Social Connections & Growth |
| Southeast | `SE` | Fire | Agni | Energy & Cash Flow |
| South | `S` | Earth/Fire | Yama | Fame & Relaxation |
| Southwest | `SW` | Earth | Pitru/Nairutya | Relationships & Stability |
| West | `W` | Air/Space | Varuna | Gains & Profits |
| Northwest | `NW` | Air | Vayu | Support & Networking |
| Center | `CENTER` | Ether/Space | Brahma | Overall Balance |

### Zone Logic in Rules

Each rule categorizes all 9 directions into one of four tiers for a given room type:

- **Ideal** -- The room's element aligns perfectly with the zone's element (e.g., Kitchen in SE, where Agni governs fire).
- **Acceptable** -- Not optimal but harmonious enough to avoid problems.
- **Bad** -- The room's purpose conflicts with the zone's energy.
- **Critical** -- A severe Vastu dosha (defect); the room's presence in this zone is considered highly inauspicious.

Directions not listed in any of the four tiers receive a default score of 50 (neutral).

---

## Room Types and Rule Table

The engine supports 15 room type identifiers: `kitchen`, `master_bedroom`, `bedroom`, `bathroom`, `living_room`, `dining_room`, `pooja_room`, `balcony`, `storage`, `corridor`, `study`, `utility`, `hall`, `drawing_room`, and `unknown`.

Of these, 12 have explicit rules defined in `rules-data.json`. The remaining types (`corridor`, `utility`, `unknown`) have no rules and receive a default score of 70.

### Complete Rule Table

| Room Type | ID | Ideal | Acceptable | Bad | Critical | Weight | Source |
|-----------|----|-------|------------|-----|----------|--------|--------|
| Kitchen | `kitchen-001` | SE | S, E, NW | W, SW, CENTER | NE, N | 9 | consensus |
| Master Bedroom | `master_bedroom-001` | SW | S, W | NE, E, N | SE | 8 | consensus |
| Bathroom | `bathroom-001` | NW, W | N, S | E, SE, SW | NE, CENTER | 9 | consensus |
| Pooja Room | `pooja_room-001` | NE | N, E | S, SW, W, SE | NW | 7 | consensus |
| Living Room | `living_room-001` | N, NE, E | NW, CENTER | SW, S | _(none)_ | 6 | consensus |
| Main Entrance/Hall | `entrance-001` | N, NE, E | NW, SE | W, S | SW | 10 | consensus |
| Bedroom (secondary) | `bedroom-001` | S, SW, W, NW | CENTER | N, NE, E | SE | 5 | consensus |
| Study | `study-001` | NE, N, E, NW | W | S, SW, SE | _(none)_ | 5 | consensus |
| Dining Room | `dining_room-001` | W, E | N, S, CENTER | NE, SW | _(none)_ | 4 | consensus |
| Balcony | `balcony-001` | N, NE, E | NW, SE | SW | _(none)_ | 3 | consensus |
| Storage | `storage-001` | SW, S, W, NW | CENTER | NE, N, E | _(none)_ | 3 | consensus |
| Drawing Room | `drawing_room-001` | N, NE, E | NW, CENTER | SW, S | _(none)_ | 5 | consensus |

### Weight Interpretation

Weight is a value from 1 to 10 that indicates the Vastu significance of the room type. Higher weight means the room contributes more to the overall score.

| Weight Range | Significance | Examples |
|-------------|-------------|----------|
| 9--10 | Critical importance | Main Entrance (10), Kitchen (9), Bathroom (9) |
| 7--8 | High importance | Master Bedroom (8), Pooja Room (7) |
| 5--6 | Moderate importance | Living Room (6), Study (5), Bedroom (5), Drawing Room (5) |
| 3--4 | Lower importance | Dining Room (4), Balcony (3), Storage (3) |

---

## Scoring Algorithm -- Worst Score Wins

The core per-room scoring function uses a **pessimistic (worst-score-wins) strategy**. When multiple rules apply to a single room, the lowest score among all rules determines the room's final score. This ensures that a single severe violation is never masked by other favorable rules.

### Score Assignment Per Rule

For each applicable rule, the room's actual compass direction is checked against the four direction tiers:

| Tier | Score | Severity | Issues Generated |
|------|-------|----------|------------------|
| `ideal_directions` | 95 | `positive` | None |
| `acceptable_directions` | 70 | `minor` | "{room} is in {direction} -- acceptable but not ideal." |
| `bad_directions` | 35 | `major` | "{room} in {direction} is not recommended." |
| `critical_directions` | 10 | `critical` | "{room} in {direction} is a severe Vastu dosha." |
| _(not listed in any tier)_ | 50 | `minor` | None (implicit neutral) |

### Algorithm Walkthrough

```typescript
// Pseudocode of the worst-score-wins logic
let worstScore = 100;      // start optimistic
let worstSeverity = 'positive';

for (const rule of applicableRules) {
    let ruleScore = 50;    // default for unlisted directions
    let ruleSeverity = 'minor';

    if (rule.ideal_directions.includes(direction)) {
        ruleScore = 95;
        ruleSeverity = 'positive';
    } else if (rule.acceptable_directions.includes(direction)) {
        ruleScore = 70;
        ruleSeverity = 'minor';
    } else if (rule.critical_directions.includes(direction)) {
        ruleScore = 10;
        ruleSeverity = 'critical';
    } else if (rule.bad_directions.includes(direction)) {
        ruleScore = 35;
        ruleSeverity = 'major';
    }

    // Worst score wins
    if (ruleScore < worstScore) {
        worstScore = ruleScore;
        worstSeverity = ruleSeverity;
    }
}
```

### Worked Example

**Scenario:** A kitchen is placed in the NE zone.

1. Rule `kitchen-001` applies (room_type = `kitchen`).
2. Check NE against each tier:
   - `ideal_directions`: `[SE]` -- NE is not here.
   - `acceptable_directions`: `[S, E, NW]` -- NE is not here.
   - `critical_directions`: `[NE, N]` -- **Match!**
3. Score = 10, severity = `critical`.
4. Issue: "Kitchen in the NE zone is a severe Vastu dosha. This should ideally be in SE."
5. Remedy: "Place a red or orange light in the SE corner of the kitchen..."

Since this is the only applicable rule, worstScore = 10 (critical).

**Scenario:** A bedroom is placed in the CENTER zone.

1. Rule `bedroom-001` applies.
2. Check CENTER:
   - `ideal_directions`: `[S, SW, W, NW]` -- no.
   - `acceptable_directions`: `[CENTER]` -- **Match!**
3. Score = 70, severity = `minor`.

### No Rules Found

If no rules match a room type (e.g., `corridor`, `utility`, `unknown`), the room receives a **default score of 70** with severity `minor` and no issues.

```typescript
if (applicableRules.length === 0) {
    return {
        score: 70,
        severity: 'minor',
        issues: [],
        remedies: [],
        // ...
    };
}
```

---

## Score Ranges and Severity Levels

### Per-Room Score Ranges

| Score Range | Label | Severity | Meaning |
|-------------|-------|----------|---------|
| 0--49 | Problem | `critical` or `major` | The room placement has a significant Vastu defect. Remedies are strongly recommended. |
| 50--79 | Attention | `minor` | The placement is neutral or acceptable but not ideal. Minor adjustments may help. |
| 80--100 | Good | `positive` | The room is well placed according to Vastu principles. |

### Fixed Score Values

The engine uses fixed scores rather than a continuous scale:

| Placement | Exact Score |
|-----------|-------------|
| Ideal | 95 |
| Acceptable | 70 |
| Neutral (unlisted) | 50 |
| Bad | 35 |
| Critical | 10 |
| No rules found | 70 (default) |

---

## Grading System

The overall weighted score is converted to a letter grade using the following thresholds:

| Grade | Score Range | Interpretation |
|-------|------------|----------------|
| **A** | 85--100 | Excellent Vastu compliance. Most rooms are ideally placed. |
| **B** | 70--84 | Good compliance. Some rooms may be in acceptable but not ideal zones. |
| **C** | 55--69 | Average. Multiple rooms are in suboptimal zones. Remedies recommended. |
| **D** | 40--54 | Poor. Several significant Vastu defects present. |
| **F** | 0--39 | Severe violations. Multiple critical defects detected. |

```typescript
let grade: 'A' | 'B' | 'C' | 'D' | 'F';
if (overallScore >= 85) grade = 'A';
else if (overallScore >= 70) grade = 'B';
else if (overallScore >= 55) grade = 'C';
else if (overallScore >= 40) grade = 'D';
else grade = 'F';
```

---

## Weighted Overall Score Calculation

The overall score is not a simple average. Each room's score is multiplied by its rule weight before averaging. This ensures that high-importance rooms (entrance, kitchen, bathroom) influence the final score more than lower-importance rooms (balcony, storage).

### Formula

```
overall_score = round( SUM(room_score_i * weight_i) / SUM(weight_i) )
```

### Implementation

```typescript
const totalWeight = roomScores.reduce((sum, rs) => {
    const rule = rules.find(r => r.room_type === rs.room_type);
    return sum + (rule?.weight || 5);  // default weight = 5 for unmatched types
}, 0);

const weightedSum = roomScores.reduce((sum, rs) => {
    const rule = rules.find(r => r.room_type === rs.room_type);
    return sum + rs.score * (rule?.weight || 5);
}, 0);

const overallScore = Math.round(weightedSum / totalWeight);
```

### Worked Example

Consider a floor plan with 4 rooms:

| Room | Direction | Placement Tier | Score | Weight |
|------|-----------|---------------|-------|--------|
| Main Entrance | NE | Ideal | 95 | 10 |
| Kitchen | SE | Ideal | 95 | 9 |
| Bathroom | NE | Critical | 10 | 9 |
| Bedroom | S | Ideal | 95 | 5 |

**Calculation:**

```
weightedSum = (95 * 10) + (95 * 9) + (10 * 9) + (95 * 5)
            = 950 + 855 + 90 + 475
            = 2370

totalWeight = 10 + 9 + 9 + 5 = 33

overallScore = round(2370 / 33) = round(71.8) = 72

grade = 'B'
```

Even though 3 out of 4 rooms are ideally placed, the critical bathroom placement (NE, score 10) with its high weight (9) drags the overall score from a potential A down to a B. This demonstrates how the weighted system properly reflects the severity of a single critical defect.

### Special Handling

- **Entrance:** The main entrance is scored as room type `hall` using rules with IDs starting with `entrance`. It carries the highest weight (10) in the system.
- **Default weight:** Room types without matching rules receive a default weight of 5.

---

## LLM-Assisted Rule Matching

When a floor plan contains a room with a type that does not match any of the 15 known categories (e.g., "pantry", "guest suite", "home office"), the `matchUnknownRoomType()` function in `rule-matcher.ts` uses an LLM to classify it.

### How It Works

1. The function receives the room's `name` and `type` strings.
2. It sends a request to **Claude Haiku 4.5** via AWS Bedrock with `temperature: 0` (fully deterministic).
3. The system prompt instructs the model to return exactly one of the known categories.
4. The model's response is used as the room type for rule lookup.
5. If the model fails to respond, the fallback is `"storage"` (the most generic low-weight category).

### System Prompt

```
You match unknown room types to the closest Vastu rule category.
Available categories: kitchen, master_bedroom, bedroom, bathroom, living_room,
dining_room, pooja_room, balcony, storage, corridor, study, utility, hall, drawing_room.
Return ONLY the category name, nothing else.
```

### User Prompt Template

```
Room name: "{roomName}", detected type: "{roomType}". What is the closest Vastu category?
```

### Example Mappings

| Unknown Room | Expected LLM Match | Reasoning |
|-------------|-------------------|-----------|
| "Pantry" | `storage` or `kitchen` | Depends on context; food storage near kitchen |
| "Home Office" | `study` | Work and concentration space |
| "Guest Suite" | `bedroom` | Sleeping quarters |
| "Meditation Room" | `pooja_room` | Spiritual/contemplative space |
| "Terrace" | `balcony` | Open outdoor space |
| "Foyer" | `hall` | Entry area |
| "Washroom" | `bathroom` | Sanitary facility |
| "Lounge" | `living_room` | Social/relaxation space |

### Configuration

The function uses AWS Bedrock and requires the following environment:

- `AWS_REGION` environment variable (defaults to `us-east-1`).
- Valid AWS credentials with Bedrock `InvokeModel` permissions.
- Model ID: `us.anthropic.claude-haiku-4-5-v1:0`.

---

## How to Add New Rules

### Step 1: Define the Room Type

If the room type does not already exist in the `RoomType` union type, add it to `src/lib/vastu/types.ts`:

```typescript
// Before
export type RoomType = 'kitchen' | 'master_bedroom' | 'bedroom' | /* ... */ | 'unknown';

// After
export type RoomType = 'kitchen' | 'master_bedroom' | 'bedroom' | /* ... */ | 'garage' | 'unknown';
```

### Step 2: Add the Rule to rules-data.json

Add a new entry to the `rules` array in `src/lib/vastu/rules-data.json`:

```json
{
    "id": "garage-001",
    "room_type": "garage",
    "ideal_directions": ["NW", "SE"],
    "acceptable_directions": ["W", "S"],
    "bad_directions": ["NE", "E"],
    "critical_directions": ["CENTER"],
    "weight": 4,
    "remedy": "Keep the garage clean and well-ventilated. Avoid storing broken items.",
    "source": "consensus",
    "description": "Garage aligns with the air element (NW) for vehicles or fire element (SE) for machinery."
}
```

### Rule Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier. Convention: `{room_type}-{NNN}` (e.g., `garage-001`). |
| `room_type` | RoomType | Yes | Must match a value in the `RoomType` union. |
| `ideal_directions` | Direction[] | Yes | Directions that score 95. |
| `acceptable_directions` | Direction[] | Yes | Directions that score 70. |
| `bad_directions` | Direction[] | Yes | Directions that score 35. |
| `critical_directions` | Direction[] | Yes | Directions that score 10. Can be empty `[]`. |
| `weight` | number (1--10) | Yes | Importance for weighted overall score. |
| `remedy` | string | No | Suggested remedy text shown to users when the room is not ideally placed. |
| `source` | string | Yes | Origin of the rule (e.g., `"consensus"`, name of a specific text). |
| `description` | string | Yes | Human-readable explanation of why this rule exists. |

### Step 3: Validate Direction Coverage

Ensure that every rule accounts for all 9 directions. The four tier arrays should ideally cover all directions, though any direction not listed will receive a neutral score of 50. Verify that no direction appears in more than one tier for the same rule.

### Step 4: Test

After adding a rule, verify the scoring by creating a test floor plan with the new room type placed in each of the 9 directions and confirming the expected scores (95, 70, 50, 35, or 10).

### Adding Multiple Rules Per Room Type

A single room type can have multiple rules (e.g., `kitchen-001`, `kitchen-002`). The worst-score-wins algorithm will evaluate all applicable rules and take the minimum score. This is useful when different Vastu texts prescribe different constraints and you want to enforce all of them.

---

## Appendix: Type Definitions

### VastuRule

```typescript
interface VastuRule {
    id: string;
    room_type: RoomType;
    ideal_directions: Direction[];
    acceptable_directions: Direction[];
    bad_directions: Direction[];
    critical_directions: Direction[];
    weight: number;
    remedy?: string;
    source: string;
    description: string;
}
```

### RoomScore

```typescript
interface RoomScore {
    room_name: string;
    room_type: RoomType;
    actual_direction: Direction;
    ideal_directions: Direction[];
    score: number;
    severity: Severity;
    issues: string[];
    remedies: string[];
    rule_ids: string[];
}
```

### VastuAnalysis

```typescript
interface VastuAnalysis {
    overall_score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    room_scores: RoomScore[];
    critical_issues: string[];
    positive_aspects: string[];
    summary: string;
}
```

### Direction and Severity

```typescript
type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'CENTER';
type Severity = 'critical' | 'major' | 'minor' | 'positive';
```
