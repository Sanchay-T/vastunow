# VastuNow Frontend Documentation

## Table of Contents

1. [Design System Overview](#design-system-overview)
2. [Component Hierarchy and Data Flow](#component-hierarchy-and-data-flow)
3. [UI Components](#ui-components)
4. [Landing Components](#landing-components)
5. [Analyze Components](#analyze-components)
6. [Review Components](#review-components)
7. [Report Components](#report-components)
8. [Page-by-Page User Flow](#page-by-page-user-flow)
9. [State Management Approach](#state-management-approach)
10. [Internationalization (i18n)](#internationalization-i18n)
11. [Responsive Design Approach](#responsive-design-approach)
12. [SVG Vastu Schematic Deep Dive](#svg-vastu-schematic-deep-dive)
13. [CSS Custom Properties and Tailwind Configuration](#css-custom-properties-and-tailwind-configuration)

---

## Design System Overview

### Color Palette

All colors are defined as CSS custom properties in `/src/app/globals.css` and bridged into the Tailwind theme via the `@theme inline` directive.

| Token               | CSS Variable             | Hex Value   | Usage                                   |
|----------------------|--------------------------|-------------|-----------------------------------------|
| Primary              | `--primary`              | `#c2410c`   | Burnt orange. CTA buttons, icons, accents. Evokes traditional Indian earth tones. |
| Primary Light        | `--primary-light`        | `#ea580c`   | Lighter orange. Button hover states.    |
| Secondary            | `--secondary`            | `#1e3a5f`   | Deep navy. Headings, brand wordmark, north arrow in schematic. |
| Background           | `--background`           | `#faf9f6`   | Off-white / parchment. Page body color. |
| Foreground           | `--foreground`           | `#1c1917`   | Near-black. Body text.                  |
| Score Good           | `--score-good`           | `#22c55e`   | Green. Score >= 80.                     |
| Score Attention      | `--score-attention`      | `#f59e0b`   | Amber. Score 50-79.                     |
| Score Problem        | `--score-problem`        | `#ef4444`   | Red. Score < 50.                        |
| Card Background      | `--card-bg`              | `#ffffff`   | White. Card surfaces.                   |
| Border               | `--border`               | `#e5e2de`   | Warm gray. Borders and dividers.        |

### Typography

- **Sans-serif (body):** Geist, loaded via `next/font/google` and assigned to `--font-geist-sans`. Falls back to the system sans-serif stack.
- **Serif (headings):** Georgia, Cambria, and generic serif, defined as `--font-serif`. Applied inline via `style={{ fontFamily: 'var(--font-serif)' }}` on `<h1>`, `<h2>`, and `<h3>` elements across pages.
- **Body default:** `Arial, Helvetica, sans-serif` is set on the `body` element in `globals.css`.

The serif font is used exclusively for display headings (tagline, page titles, section headers) to evoke a classical, authoritative tone aligned with the Vastu Shastra domain.

### Motifs

- **Mandala background pattern:** A subtle SVG-based concentric circle pattern embedded as a CSS `background-image` on `.mandala-bg`. It uses the primary color at 3% opacity, creating a barely-visible texture reminiscent of traditional mandala patterns. Applied to the Landing and Analyze pages.
- **Compass iconography:** The `Compass` icon from `lucide-react` appears alongside direction selectors throughout the application.
- **House logo:** A custom inline SVG in `NavBar` renders a simple house icon (path + polyline) in white on a primary-colored rounded square.
- **North arrow:** The `VastuSchematic` SVG includes a directional north arrow (filled triangle + "N" label) at the top center, rendered in the secondary navy color.

---

## Component Hierarchy and Data Flow

```
RootLayout (layout.tsx)
  |-- <html> + <body> (Geist font variable, antialiased)
  |-- ClientProviders (providers.tsx)
        |-- NavBar
        |     |-- LanguageSwitcher
        |-- <main>
              |-- [Page Content]

Landing Page (/)
  |-- UploadCTA
  |     |-- FileUpload
  |     |-- Select (direction)
  |     |-- Button
  |-- HowItWorks
  |-- TrustSignals

Analyze Page (/analyze)
  |-- UploadZone
        |-- FileUpload
        |-- Select (direction)
        |-- Button

Review Page (/review)
  |-- EntranceConfirm
  |-- RoomReviewGrid (desktop, hidden on mobile)
  |-- RoomReviewList (mobile, hidden on desktop)
  |-- LoadingSpinner (when processing)
  |-- Button (x2: "Looks Good" + "Skip Review")

Report Page (/report/[id])
  |-- ScoreCard
  |-- VastuSchematic
  |-- RoomAnalysis
  |-- RemedyList
  |-- OriginalPlan
  |-- AnalyzeAnother
  |-- Button (Download PDF)
  |-- LoadingSpinner (when loading/regenerating)
```

### Data Flow Summary

1. **Landing/Analyze** -- User uploads a floor plan image and selects a compass direction. The file and direction are POSTed to `/api/analyze`.
2. **API response** -- The API returns `{ parsed_floorplan, image_url, facing_direction, confidence }`. This is stored in `sessionStorage` under the key `vastuData`.
3. **Review** -- Reads `vastuData` from `sessionStorage`. User may edit room names/types. On confirmation, the data (with optional corrections) is POSTed to `/api/score` along with the selected i18n language.
4. **Score API response** -- Returns `{ id, overall_score, grade, room_scores, report, ... }`. Stored in `sessionStorage` under the key `vastuResult`. Router navigates to `/report/{id}`.
5. **Report** -- Reads `vastuResult` from `sessionStorage` first. If not found (e.g., direct URL access, page refresh), falls back to fetching from `/api/report-pdf?id={id}`.
6. **Language change on Report** -- Triggers a POST to `/api/regenerate-report` with the analysis ID and new language. Only the `report` field in the result state is replaced; scores and schematic data remain unchanged.

---

## UI Components

### Button

**File:** `/src/components/ui/Button.tsx`

**Purpose:** General-purpose button with variant theming, size options, and a built-in loading spinner. Extends native `<button>` HTML attributes.

**Props:**

| Prop       | Type                                              | Default     | Description                                     |
|------------|---------------------------------------------------|-------------|-------------------------------------------------|
| `variant`  | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Visual style variant.                           |
| `size`     | `'sm' \| 'md' \| 'lg'`                             | `'md'`      | Controls padding and font size.                 |
| `children` | `ReactNode`                                       | (required)  | Button content.                                 |
| `loading`  | `boolean`                                         | `undefined` | Shows an animated SVG spinner and disables the button. |
| `disabled` | `boolean`                                         | `undefined` | Standard HTML disabled attribute.               |
| `className`| `string`                                          | `''`        | Additional CSS classes.                         |
| `...props` | `ButtonHTMLAttributes<HTMLButtonElement>`          | --          | All other native button attributes.             |

**Variant styles:**

| Variant     | Appearance                                                        |
|-------------|-------------------------------------------------------------------|
| `primary`   | Solid burnt-orange background, white text.                        |
| `secondary` | Solid navy background, white text.                                |
| `outline`   | Transparent with burnt-orange border, fills on hover.             |
| `ghost`     | Transparent, subtle gray hover background.                        |

**Usage:** Used across all pages for primary actions ("Analyze", "Looks Good -- Show My Score"), secondary actions ("Skip Review"), outline actions ("Analyze Another Floor Plan"), and PDF download.

---

### Select

**File:** `/src/components/ui/Select.tsx`

**Purpose:** Styled select dropdown with optional label and helper text. Extends native `<select>` HTML attributes.

**Props:**

| Prop         | Type                                      | Default     | Description                          |
|--------------|-------------------------------------------|-------------|--------------------------------------|
| `label`      | `string`                                  | `undefined` | Label displayed above the select.    |
| `options`    | `{ value: string; label: string }[]`      | (required)  | Array of option objects.             |
| `helperText` | `string`                                  | `undefined` | Small text displayed below the select. |
| `className`  | `string`                                  | `''`        | Additional CSS classes.              |
| `...props`   | `SelectHTMLAttributes<HTMLSelectElement>`  | --          | All other native select attributes.  |

**Usage:** Used by `DirectionSelect`, `UploadCTA`, and `UploadZone` for the compass direction picker. Always prefixed with a placeholder "Select..." option.

---

### FileUpload

**File:** `/src/components/ui/FileUpload.tsx`

**Purpose:** Drag-and-drop file upload zone with validation. Supports JPG, PNG, and PDF files up to 10MB. Shows a selected-file preview state with file name, size, and a clear button.

**Props:**

| Prop           | Type                  | Default     | Description                                 |
|----------------|-----------------------|-------------|---------------------------------------------|
| `onFileSelect` | `(file: File) => void`| (required)  | Callback when a valid file is selected.     |
| `selectedFile` | `File \| null`        | (required)  | Currently selected file (controls display). |
| `onClear`      | `() => void`          | (required)  | Callback to remove the selected file.       |

**Internal behavior:**
- Accepted MIME types: `image/jpeg`, `image/png`, `application/pdf`.
- Maximum file size: 10MB (10 * 1024 * 1024 bytes).
- Drag-over state scales the container to 101% and highlights the border.
- File icon changes based on type: `FileText` for PDFs, `Image` for images (from `lucide-react`).
- Validation errors display below the upload zone in red.
- All visible strings use i18n translation keys (`drag_drop`, `or`, `browse_files`, `accepted_formats`, `max_file_size`).

---

### LoadingSpinner

**File:** `/src/components/ui/LoadingSpinner.tsx`

**Purpose:** Full-page loading state with an animated mandala spinner, a two-step progress indicator, and rotating Vastu trivia facts. Used during the analyze-to-review and review-to-report transitions.

**Props:**

| Prop   | Type     | Default | Description                                    |
|--------|----------|---------|------------------------------------------------|
| `step` | `number` | `1`     | Active step (1 = applying Vastu principles, 2 = generating report). |

**Internal behavior:**
- An outer circle rotates continuously (3-second period, linear easing) using `framer-motion`.
- A small dot orbits the circle as a visual indicator.
- The step indicator is a pair of pills; the active step is colored with `--primary`.
- Five Vastu facts cycle every 4 seconds with `AnimatePresence` cross-fade animation (opacity + vertical slide).
- Facts are pulled from i18n keys `vastu_fact_1` through `vastu_fact_5`.

---

### LanguageSwitcher

**File:** `/src/components/ui/LanguageSwitcher.tsx`

**Purpose:** Toggle button that switches the application language between English and Hindi.

**Props:**

| Prop               | Type                        | Default     | Description                                          |
|--------------------|-----------------------------|-------------|------------------------------------------------------|
| `onLanguageChange` | `(lang: string) => void`    | `undefined` | Optional callback fired after the language is toggled. |

**Internal behavior:**
- Reads the current language from `i18n.language`.
- Toggles between `'en'` and `'hi'` on click.
- Calls `i18n.changeLanguage(newLang)` and then fires `onLanguageChange` if provided.
- Displays a `Globe` icon and the target language code ("HI" when current is English, "EN" when current is Hindi).

---

### NavBar

**File:** `/src/components/ui/NavBar.tsx`

**Purpose:** Sticky top navigation bar containing the brand logo/wordmark and the language switcher. Present on every page via `ClientProviders`.

**Props:**

| Prop               | Type                        | Default     | Description                                              |
|--------------------|-----------------------------|-------------|----------------------------------------------------------|
| `onLanguageChange` | `(lang: string) => void`    | `undefined` | Passed through to `LanguageSwitcher`.                    |

**Layout:**
- Sticky positioned at `top-0` with `z-50`.
- Semi-transparent background (`bg-[var(--background)]/95`) with backdrop blur.
- Height: 56px (`h-14`).
- Max-width container: `max-w-5xl`.
- Left: House SVG icon (18x18, white on primary background) + "VastuNow" in serif bold.
- Right: `LanguageSwitcher` component.

---

## Landing Components

### UploadCTA

**File:** `/src/components/landing/UploadCTA.tsx`

**Purpose:** The primary call-to-action on the landing page. Combines file upload, direction selection, and the analyze button into a single form-like unit. Manages file state, direction state, loading state, and API interaction internally.

**Props:** None. This is a self-contained stateful component.

**Internal state:**

| State      | Type            | Description                              |
|------------|-----------------|------------------------------------------|
| `file`     | `File \| null`  | The selected floor plan file.            |
| `direction`| `string`        | The selected compass direction code.     |
| `loading`  | `boolean`       | Whether the analyze API call is in flight. |
| `error`    | `string \| null`| Error message from the API or network.   |

**Behavior:**
- Composes `FileUpload`, `Select`, and `Button`.
- On analyze: creates a `FormData` with the file (`floorplan`) and direction (`facing`), POSTs to `/api/analyze`.
- On success: stores the response in `sessionStorage.vastuData` and navigates to `/review`.
- On error: displays the error message in a red-tinted box.
- The "Analyze" button is disabled until both a file and direction are provided.

---

### HowItWorks

**File:** `/src/components/landing/HowItWorks.tsx`

**Purpose:** Three-step visual explainer section. Displays numbered steps with icons describing the Upload -> Review -> Report flow.

**Props:** None.

**Layout:** A responsive 3-column grid (`grid-cols-1 md:grid-cols-3`). Each step contains:
- A circular icon container (14x14, 10% primary background).
- A zero-padded step number ("01", "02", "03") in primary color.
- A title and description pulled from i18n keys (`step_1_title`, `step_1_desc`, etc.).

**Icons used:** `Upload`, `Eye`, `FileBarChart` from `lucide-react`.

---

### TrustSignals

**File:** `/src/components/landing/TrustSignals.tsx`

**Purpose:** A row of trust indicators displayed below the "How It Works" section. Reinforces credibility with three badges.

**Props:** None.

**Content:**
- "Based on traditional Vastu Shastra principles" (i18n key: `trust_signal`) with `Shield` icon.
- "5,000+ years of wisdom" (hardcoded) with `BookOpen` icon.
- "AI-powered analysis" (hardcoded) with `Sparkles` icon.

**Layout:** Flex column on mobile, flex row on `md:` breakpoint, centered.

---

## Analyze Components

### UploadZone

**File:** `/src/components/analyze/UploadZone.tsx`

**Purpose:** Standalone upload form for the `/analyze` page. Functionally identical to `UploadCTA` but styled for a dedicated page layout (wider max-width, different spacing).

**Props:** None. Self-contained stateful component.

**Internal state:** Same as `UploadCTA` -- `file`, `direction`, `loading`, `error`.

**Behavior:** Identical API call logic to `UploadCTA`. POSTs to `/api/analyze`, stores result in `sessionStorage.vastuData`, navigates to `/review`.

**Differences from UploadCTA:**
- Max-width: `max-w-xl` (versus `max-w-lg` in UploadCTA).
- Slightly different spacing (`mt-6` vs `mt-5`, `mt-4` vs `mt-3`).
- No `flex items-end gap-3` wrapper around the direction select.

---

### DirectionSelect

**File:** `/src/components/analyze/DirectionSelect.tsx`

**Purpose:** A reusable wrapper around the `Select` component, pre-configured with the eight compass directions and the Vastu-specific label/helper text.

**Props:**

| Prop       | Type                        | Default    | Description                              |
|------------|-----------------------------|------------|------------------------------------------|
| `value`    | `string`                    | (required) | Currently selected direction code.       |
| `onChange` | `(value: string) => void`   | (required) | Callback with the new direction value.   |

**Note:** This component is defined but not currently used by any page (both `UploadCTA` and `UploadZone` inline the direction options and use `Select` directly). It exists as a refactorable extraction.

---

## Review Components

### RoomReviewGrid

**File:** `/src/components/review/RoomReviewGrid.tsx`

**Purpose:** Desktop layout for reviewing detected rooms. Displays the original floor plan image side-by-side with a 3x3 compass grid where each cell shows the room mapped to that direction.

**Props:**

| Prop           | Type                                                  | Default    | Description                                         |
|----------------|-------------------------------------------------------|------------|-----------------------------------------------------|
| `rooms`        | `ParsedRoom[]`                                        | (required) | Array of rooms detected from the floor plan.        |
| `imageUrl`     | `string`                                              | (required) | URL of the uploaded floor plan image.               |
| `onRoomChange` | `(index: number, field: 'name' \| 'type', value: string) => void` | (required) | Callback when a room's name or type is edited.     |

**Internal behavior:**
- Builds a 3x3 grid array from `room.grid_row` and `room.grid_col` (0-2 range).
- Direction labels: NW, N, NE / W, CENTER, E / SW, S, SE.
- Occupied cells show an editable text input for room name and a `<select>` for room type.
- Empty cells show a gray "Empty" label.
- Each cell has a compact 10px direction label in the top-left corner.
- The floor plan image and the grid are displayed in a `flex gap-6` side-by-side layout.

**Room types available:** `kitchen`, `master_bedroom`, `bedroom`, `bathroom`, `living_room`, `dining_room`, `pooja_room`, `balcony`, `storage`, `corridor`, `study`, `utility`, `hall`, `drawing_room`, `unknown`.

---

### RoomReviewList

**File:** `/src/components/review/RoomReviewList.tsx`

**Purpose:** Mobile layout for reviewing detected rooms. Displays rooms as a vertical card list, each showing the room's compass direction badge and editable name/type fields.

**Props:**

| Prop           | Type                                                  | Default    | Description                                         |
|----------------|-------------------------------------------------------|------------|-----------------------------------------------------|
| `rooms`        | `ParsedRoom[]`                                        | (required) | Array of rooms detected from the floor plan.        |
| `onRoomChange` | `(index: number, field: 'name' \| 'type', value: string) => void` | (required) | Callback when a room's name or type is edited.     |

**Layout per card:**
- Compass direction badge (small, primary-tinted pill) with translated direction name.
- 2-column grid with room name text input and room type select dropdown.
- Cards are stacked vertically with `space-y-3` spacing.

---

### EntranceConfirm

**File:** `/src/components/review/EntranceConfirm.tsx`

**Purpose:** An amber-tinted confirmation banner asking the user to verify the detected entrance location. Includes Yes/No toggle buttons.

**Props:**

| Prop          | Type                         | Default    | Description                                    |
|---------------|------------------------------|------------|------------------------------------------------|
| `direction`   | `string`                     | (required) | Compass direction of the detected entrance.    |
| `side`        | `string`                     | (required) | Side of the building (e.g., "front", "left").  |
| `confirmed`   | `boolean`                    | (required) | Current confirmation state.                    |
| `onConfirm`   | `(confirmed: boolean) => void` | (required) | Callback to set confirmation.                 |

**Layout:**
- Amber background (`bg-amber-50`, `border-amber-200`).
- `DoorOpen` icon from `lucide-react`.
- Displays: "Detected entrance: **{direction}** ({side} side)".
- Two buttons: "Yes" (fills green when confirmed) and "No" (fills red when not confirmed).

---

## Report Components

### ScoreCard

**File:** `/src/components/report/ScoreCard.tsx`

**Purpose:** Displays the overall Vastu score as a circular gauge with an animated ring, a letter grade badge, and an optional summary paragraph.

**Props:**

| Prop      | Type     | Default     | Description                           |
|-----------|----------|-------------|---------------------------------------|
| `score`   | `number` | (required)  | Overall Vastu score (0-100).          |
| `grade`   | `string` | (required)  | Letter grade (A, B, C, D, or F).      |
| `summary` | `string` | `undefined` | Optional summary text from the report. |

**Score color mapping:**

| Score Range | Ring Color | Background Color | Text Color |
|-------------|------------|------------------|------------|
| 80-100      | `#22c55e`  | `#f0fdf4`        | `#166534`  |
| 50-79       | `#f59e0b`  | `#fffbeb`        | `#92400e`  |
| 0-49        | `#ef4444`  | `#fef2f2`        | `#991b1b`  |

**SVG gauge details:**
- Viewbox: 120x120. Circle radius: 54. Stroke width: 8.
- Background ring: `#e5e7eb`.
- Foreground ring: color-coded. Uses `stroke-dasharray` and `stroke-dashoffset` to represent the score percentage. Animated with a 1-second `ease-out` CSS transition.
- Rotation: `-90` degrees so the arc starts from the top (12 o'clock position).

---

### VastuSchematic

**File:** `/src/components/report/VastuSchematic.tsx`

**Purpose:** An SVG-based 3x3 directional grid showing room placements, scores, deity metadata, and the entrance marker. This is the central visualization of the Vastu analysis.

**Props:**

| Prop       | Type                                                                                     | Default     | Description                                  |
|------------|------------------------------------------------------------------------------------------|-------------|----------------------------------------------|
| `rooms`    | `ParsedRoom[]`                                                                           | (required)  | Parsed rooms from the floor plan.            |
| `scores`   | `RoomScore[]`                                                                            | (required)  | Computed Vastu scores per room.              |
| `entrance` | `{ compass_direction: string; grid_row: number; grid_col: number; side: string }` | `undefined` | Entrance location data.                      |

See the dedicated [SVG Vastu Schematic Deep Dive](#svg-vastu-schematic-deep-dive) section below for full implementation details.

---

### RoomAnalysis

**File:** `/src/components/report/RoomAnalysis.tsx`

**Purpose:** Expandable accordion list showing per-room Vastu findings, impacts, and remedies. Each row is color-coded by severity and can be expanded to reveal detailed analysis.

**Props:**

| Prop            | Type                  | Default     | Description                                            |
|-----------------|-----------------------|-------------|--------------------------------------------------------|
| `roomScores`    | `RoomScore[]`         | (required)  | Array of room score objects from the Vastu engine.     |
| `reportDetails` | `ReportRoomDetail[]`  | `undefined` | Optional LLM-generated detailed findings per room.     |

**Internal state:**

| State      | Type                      | Description                             |
|------------|---------------------------|-----------------------------------------|
| `expanded` | `Record<number, boolean>` | Tracks which room indexes are expanded. |

**Severity badge mapping:**

| Score Range | Label       | CSS Class                           |
|-------------|-------------|-------------------------------------|
| 80-100      | "Good"      | `bg-green-100 text-green-800`       |
| 50-79       | "Attention" | `bg-amber-100 text-amber-800`      |
| 0-49        | "Problem"   | `bg-red-100 text-red-800`          |

**Left border color mapping:**

| Score Range | Border Class          |
|-------------|----------------------|
| 80-100      | `border-l-green-500` |
| 50-79       | `border-l-amber-500` |
| 0-49        | `border-l-red-500`   |

**Expanded content:**
- If `reportDetails` is available for a room: shows "Finding", "Impact", and optionally "Remedy" (in an amber-tinted box).
- If no report detail: falls back to displaying `rs.issues` and `rs.remedies` from the rule-based scoring engine.

---

### RemedyList

**File:** `/src/components/report/RemedyList.tsx`

**Purpose:** Displays three categorized lists: priority remedial actions, positive observations, and general Vastu tips. Each list has distinct color theming.

**Props:**

| Prop            | Type       | Default     | Description                                  |
|-----------------|------------|-------------|----------------------------------------------|
| `priorities`    | `string[]` | `undefined` | Ordered list of high-priority remedies.      |
| `positiveNotes` | `string[]` | `undefined` | List of things working well in the layout.   |
| `generalTips`   | `string[]` | `undefined` | General Vastu improvement suggestions.       |

**Section styling:**

| Section           | Background    | Border          | Text Color     | Icon            |
|-------------------|---------------|-----------------|----------------|-----------------|
| Priority Actions  | `bg-red-50`   | `border-red-200`| `text-red-800` | `AlertTriangle` |
| What's Working    | `bg-green-50` | `border-green-200`| `text-green-800`| `CheckCircle` |
| General Tips      | `bg-blue-50`  | `border-blue-200`| `text-blue-800`| `Lightbulb`    |

Each section is conditionally rendered -- only shown if its data array is non-empty.

---

### OriginalPlan

**File:** `/src/components/report/OriginalPlan.tsx`

**Purpose:** Displays the originally uploaded floor plan image within a white bordered card.

**Props:**

| Prop       | Type     | Default    | Description                            |
|------------|----------|------------|----------------------------------------|
| `imageUrl` | `string` | (required) | URL of the uploaded floor plan image.  |

**Layout:** White card with rounded corners, a gray label "Uploaded Floor Plan", and the image rendered at full width.

---

### AnalyzeAnother

**File:** `/src/components/report/AnalyzeAnother.tsx`

**Purpose:** A link-wrapped outline button that navigates the user to `/analyze` to start a new analysis.

**Props:** None.

**Composition:** Wraps `Button` (variant `outline`, size `lg`) inside a `next/link` pointing to `/analyze`. Includes a `PlusCircle` icon. Button text uses the i18n key `analyze_another`.

---

## Page-by-Page User Flow

### 1. Landing Page (`/`)

**File:** `/src/app/page.tsx`

**Layout structure:**
```
<div class="mandala-bg">
  <section> Hero (tagline + subtitle + UploadCTA) </section>
  <section> HowItWorks </section>
  <section> TrustSignals </section>
  <footer> Disclaimer </footer>
</div>
```

**User actions:**
- Upload a floor plan via the drag-and-drop zone or file browser.
- Select the main door facing direction from the dropdown.
- Click "Analyze" to submit.

**On submit:** The `UploadCTA` component POSTs to `/api/analyze`, stores the response in `sessionStorage.vastuData`, and navigates to `/review`.

### 2. Analyze Page (`/analyze`)

**File:** `/src/app/analyze/page.tsx`

**Layout structure:**
```
<div class="mandala-bg min-h-screen">
  <div> Tagline + Subtitle + UploadZone </div>
</div>
```

**Purpose:** A dedicated, focused upload page (reached via "Analyze Another Floor Plan" links). Functionally identical to the Landing page's upload section but with a cleaner, single-purpose layout.

**On submit:** Same as Landing -- POSTs to `/api/analyze`, stores result, navigates to `/review`.

### 3. Review Page (`/review`)

**File:** `/src/app/review/page.tsx`

**Entry condition:** Requires `sessionStorage.vastuData` to be present. If absent, immediately redirects to `/`.

**Layout structure:**
```
<div class="max-w-4xl">
  <h1> Review title </h1>
  <p> Subtitle </p>
  <span> Confidence badge </span>
  <EntranceConfirm /> (if entrance detected)
  <RoomReviewGrid /> (desktop only: hidden md:block)
  <RoomReviewList /> (mobile only: md:hidden)
  <div> Buttons: "Looks Good" + "Skip Review" </div>
</div>
```

**User actions:**
- Edit room names (text input) and types (dropdown).
- Confirm or deny the detected entrance.
- Click "Looks Good -- Show My Score" to submit corrections.
- Click "Skip Review" to proceed without corrections.

**On submit ("Looks Good"):**
1. Builds a `corrections` object containing only rooms where name or type differs from the original parsed data.
2. POSTs to `/api/score` with `parsed_floorplan`, `image_url`, `facing_direction`, `language`, and optional `user_corrections`.
3. `LoadingSpinner` displays with step progression (step 1 -> step 2).
4. On success: stores result in `sessionStorage.vastuResult` and navigates to `/report/{id}`.

**On submit ("Skip Review"):** Same API call but `corrections` is `undefined` (no user overrides).

### 4. Report Page (`/report/[id]`)

**File:** `/src/app/report/[id]/page.tsx`

**Data loading strategy:**
1. First checks `sessionStorage.vastuResult`. If the stored `id` matches `params.id`, uses the cached data.
2. Otherwise, fetches from `/api/report-pdf?id={params.id}` and reconstructs the result object.

**Layout structure:**
```
<div class="max-w-3xl">
  <h1> "Your Vastu Analysis" </h1>
  <ScoreCard />
  <div> Partial results notice (if report not available) </div>
  <div> Regenerating overlay (if language switch in progress) </div>
  <div> Overall interpretation paragraph </div>
  <div> VastuSchematic </div>
  <div> RoomAnalysis accordion </div>
  <div> RemedyList (priorities, positives, tips) </div>
  <div> OriginalPlan </div>
  <div class="sticky bottom-0"> Download PDF + Analyze Another </div>
  <footer> Disclaimer </footer>
</div>
```

**Language switching behavior:** When the user clicks the `LanguageSwitcher` in the NavBar:
1. `i18n.changeLanguage()` fires the `'languageChanged'` event.
2. The Report page listens for this event via `i18n.on('languageChanged', handler)`.
3. The handler calls `/api/regenerate-report` with the analysis ID and the new language name.
4. On success, only the `report` field in the component state is updated. The scores, schematic data, and other computed values remain unchanged.
5. A "Regenerating report..." message is shown during the API call.

**Sticky footer:** The "Download PDF" and "Analyze Another" buttons are sticky at the bottom of the viewport with a semi-transparent blurred background, ensuring they remain accessible during scrolling.

---

## State Management Approach

VastuNow uses **no external state management library**. All cross-page state is managed through `sessionStorage`.

### sessionStorage Keys

| Key            | Set By                      | Read By                    | Contents                                                              |
|----------------|-----------------------------|----------------------------|-----------------------------------------------------------------------|
| `vastuData`    | `UploadCTA`, `UploadZone`   | Review page (`/review`)    | `{ parsed_floorplan, image_url, facing_direction, confidence }`       |
| `vastuResult`  | Review page (`/review`)     | Report page (`/report/[id]`)| `{ id, overall_score, grade, room_scores, report, image_url, schematic_data, ... }` |

### Why sessionStorage

- **No server-side state dependency for the happy path:** The user flow is sequential (Landing -> Review -> Report), and the data naturally flows forward. `sessionStorage` avoids the need for a global state store or context.
- **Tab-scoped:** Each browser tab gets its own session, so multiple analyses can run in parallel without interference.
- **Fallback on refresh:** The Report page has a fallback fetch from `/api/report-pdf?id={id}`, so a page refresh on the report URL will recover the data from the database.
- **Redirect on missing data:** The Review page redirects to `/` if `vastuData` is not found, ensuring the user cannot reach the review step without first uploading a floor plan.

### Component-Level State

Each page manages its own local state using React `useState` hooks:
- `UploadCTA` / `UploadZone`: `file`, `direction`, `loading`, `error`.
- Review page: `data`, `rooms`, `entranceConfirmed`, `loading`, `loadingStep`.
- Report page: `result`, `loading`, `regenerating`.
- `RoomAnalysis`: `expanded` (accordion toggle map).
- `FileUpload`: `dragActive`, `error`.
- `LoadingSpinner`: `factIndex` (rotating trivia index).

---

## Internationalization (i18n)

### Setup

**File:** `/src/lib/i18n/config.ts`

The app uses `i18next` with `react-i18next` bindings and `i18next-browser-languagedetector`.

**Configuration:**

| Setting            | Value                              | Description                                       |
|--------------------|------------------------------------|---------------------------------------------------|
| Supported languages| `['en', 'hi']`                     | English and Hindi.                                |
| Fallback language  | `'en'`                             | English is the default.                           |
| Detection order    | `['localStorage', 'navigator']`    | Checks localStorage first, then browser language. |
| Cache              | `['localStorage']`                 | Persists the selected language in localStorage.   |
| Escape values      | `false`                            | React handles XSS escaping.                       |

**Locale files:**
- `/src/locales/en/common.json` -- 71 keys covering all UI strings.
- `/src/locales/hi/common.json` -- Matching 71 keys in Hindi.

### Initialization

The i18n config is imported as a side-effect in `/src/app/providers.tsx`:
```typescript
import '@/lib/i18n/config';
```

This ensures i18n is initialized before any component renders.

### Language Switching

The `LanguageSwitcher` component (always visible in the NavBar) toggles between English and Hindi:

```typescript
const toggleLanguage = () => {
  const newLang = i18n.language === 'en' ? 'hi' : 'en';
  i18n.changeLanguage(newLang);
  onLanguageChange?.(newLang);
};
```

**Behavior on each page:**
- **Landing, Analyze, Review:** All UI strings update instantly because they use `t()` function calls that re-render when the language changes.
- **Report:** UI chrome (headings, labels) updates instantly. The report content (summary, findings, remedies, tips) is server-generated in the original language. When the language changes, the `languageChanged` event triggers a call to `/api/regenerate-report`, which re-invokes the LLM with the new language parameter to regenerate the report content.

### Report Regeneration on Language Switch

The Report page registers a listener on the i18n `languageChanged` event:

```typescript
useEffect(() => {
  const handler = (lng: string) => handleLanguageChange(lng);
  i18n.on('languageChanged', handler);
  return () => { i18n.off('languageChanged', handler); };
}, [i18n, handleLanguageChange]);
```

The `handleLanguageChange` function:
1. Sets `regenerating = true`.
2. Maps the i18n code to a full language name (`{ en: 'English', hi: 'Hindi' }`).
3. POSTs to `/api/regenerate-report` with `{ analysis_id, language }`.
4. On success, updates only the `report` field in the component state. The numerical scores, room positions, and schematic data remain unchanged since these are language-independent.

### Translation Key Categories

| Category      | Example Keys                          | Usage                            |
|---------------|---------------------------------------|----------------------------------|
| Navigation    | `app_name`                            | Brand name in NavBar.            |
| Landing       | `tagline`, `subtitle`, `how_it_works` | Hero, section headers.           |
| Upload        | `drag_drop`, `browse_files`, `accepted_formats` | FileUpload component.   |
| Directions    | `directions.N` through `directions.NW`| Compass direction labels.        |
| Review        | `review_title`, `room_name`, `room_type` | Review page UI.              |
| Report        | `report_title`, `overall_score`, `grade` | Report page headers.         |
| Analysis      | `finding`, `impact`, `remedy`         | RoomAnalysis accordion labels.   |
| Remedies      | `priority_actions`, `whats_working`, `general_tips` | RemedyList headers. |
| Loading       | `loading_step_1`, `loading_step_2`    | LoadingSpinner step labels.      |
| Facts         | `vastu_fact_1` through `vastu_fact_5` | LoadingSpinner rotating trivia.  |
| Errors        | `error_generic`, `error_not_floorplan`| Error messages.                  |
| Actions       | `analyze_button`, `looks_good`, `skip_review` | Button labels.            |

---

## Responsive Design Approach

### Breakpoint Strategy

The app uses Tailwind CSS v4 with its default responsive breakpoint system. The primary breakpoint used is `md:` (768px).

### Desktop vs. Mobile Layouts

#### Review Page -- Room Editing

This is the most significant responsive split in the application:

```tsx
{/* Desktop: Grid view (hidden below md) */}
<div className="hidden md:block mb-6">
  <RoomReviewGrid rooms={rooms} imageUrl={data.image_url} onRoomChange={handleRoomChange} />
</div>

{/* Mobile: List view (hidden at md and above) */}
<div className="md:hidden mb-6">
  <RoomReviewList rooms={rooms} onRoomChange={handleRoomChange} />
</div>
```

- **Desktop (`>= 768px`):** `RoomReviewGrid` renders the floor plan image and the 3x3 compass grid side-by-side using `flex gap-6`. Each cell has compact inputs (10px font for selects, 12px for text inputs).
- **Mobile (`< 768px`):** `RoomReviewList` renders a vertical stack of cards. Each card shows the compass direction badge and a 2-column grid for name/type editing. The floor plan image is not shown on mobile in the review step.

#### Other Responsive Patterns

| Component/Page     | Mobile                              | Desktop (md+)                           |
|--------------------|-------------------------------------|-----------------------------------------|
| Landing hero `<h1>`| `text-3xl`                          | `md:text-4xl`                           |
| HowItWorks grid    | `grid-cols-1` (stacked)             | `md:grid-cols-3` (3 columns)            |
| TrustSignals       | `flex-col` (stacked badges)         | `md:flex-row` (horizontal badges)       |
| ScoreCard padding  | `p-6`                               | `md:p-8`                                |
| Review buttons     | `flex-col` (stacked)                | `sm:flex-row` (side-by-side)            |
| NavBar             | Full width, same layout             | Same layout (simple enough for mobile)  |

### Container Widths

| Page/Section         | Max Width     |
|----------------------|---------------|
| NavBar               | `max-w-5xl`   |
| Landing hero         | `max-w-2xl`   |
| Landing sections     | `max-w-4xl`   |
| UploadCTA            | `max-w-lg`    |
| Analyze UploadZone   | `max-w-xl`    |
| Analyze page         | `max-w-2xl`   |
| Review page          | `max-w-4xl`   |
| Report page          | `max-w-3xl`   |
| ScoreCard summary    | `max-w-md`    |
| VastuSchematic SVG   | `max-w-[500px]` |
| Disclaimer text      | `max-w-md`    |

---

## SVG Vastu Schematic Deep Dive

**File:** `/src/components/report/VastuSchematic.tsx`

### Overview

The Vastu Schematic is a fully programmatic SVG that renders a 3x3 directional grid representing the nine Vastu zones. Each cell corresponds to a compass direction and can display a room, its score, the associated deity, and an entrance marker.

### Dimensions and Layout

| Parameter    | Value  | Description                                         |
|--------------|--------|-----------------------------------------------------|
| `cellSize`   | 140px  | Width and height of each grid cell.                 |
| `gap`        | 3px    | Spacing between cells.                              |
| `padding`    | 40px   | Padding around the grid.                            |
| `gridSize`   | 432px  | `140 * 3 + 3 * 2` = total grid dimension.          |
| `svgWidth`   | 512px  | `gridSize + padding * 2`.                           |
| `svgHeight`  | 542px  | `gridSize + padding * 2 + 30` (extra for north label). |

The SVG uses `viewBox` for responsive scaling and has `className="w-full max-w-[500px] mx-auto"`.

### Grid Mapping

The 3x3 grid maps to compass directions:

```
Row 0: NW  |  N  |  NE
Row 1:  W  | CENTER | E
Row 2: SW  |  S  |  SE
```

### Room-to-Grid Mapping

Rooms are mapped to grid positions using their `compass_direction` field:
```typescript
rooms.forEach(room => {
  const dir = room.compass_direction;
  const score = scores.find(s => s.room_name === room.name);
  roomGrid[dir] = { room, score };
});
```

If the entrance is in a direction without a room, a synthetic "Main Entrance" room of type `hall` is inserted.

### Cell Rendering (per direction)

Each cell renders the following SVG elements in order:

1. **Background rectangle:** Rounded corners (rx=8). Fill color depends on score: green-tinted (`#f0fdf4`) for >= 80, amber-tinted (`#fffbeb`) for >= 50, red-tinted (`#fef2f2`) for < 50, neutral gray (`#f9fafb`) for empty cells. Stroke color and width also vary by score.

2. **Direction label:** Top-left corner, 11px bold gray text (e.g., "NW", "CENTER").

3. **Deity name:** Below the direction label, 8px lighter gray text. Extracted from `rules-data.json` `direction_metadata`. Only the first deity name is shown (split on `/` and `(` for brevity).

4. **Room name:** Centered in the cell, 13px bold near-black text. Truncated to 12 characters with "..." if longer than 14 characters.

5. **Score circle:** Below the room name. A semi-transparent colored circle (r=14, 15% opacity) with the score number (14px bold) in the corresponding color.

6. **Entrance marker:** If the entrance is in this direction, a small navy square (12x12) with a white "D" is rendered in the top-right corner of the cell.

7. **Empty cell indicator:** If no room is mapped, a centered em-dash is displayed in light gray.

### North Arrow

Positioned at the top center of the SVG:
```xml
<polygon points="0,-12 -6,4 6,4" fill="#1e3a5f" />
<text textAnchor="middle" y="-14" fontSize="11" fontWeight="bold" fill="#1e3a5f">N</text>
```

### Legend

Positioned at the bottom of the SVG, showing three colored dots with labels:
- Green dot: "80-100 Good"
- Amber dot: "50-79 Attention"
- Red dot: "0-49 Problem"

### Score Color Functions

```typescript
function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 50) return '#f59e0b'; // amber
  return '#ef4444';                   // red
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return '#f0fdf4'; // green-50
  if (score >= 50) return '#fffbeb'; // amber-50
  return '#fef2f2';                   // red-50
}
```

### Data Dependencies

| Import                    | Source                          | Purpose                          |
|---------------------------|---------------------------------|----------------------------------|
| `RoomScore`               | `@/lib/vastu/types`            | Score data per room.             |
| `ParsedRoom`              | `@/lib/llm/parse-floorplan`    | Room location and metadata.      |
| `rulesData`               | `@/lib/vastu/rules-data.json`  | Deity/element metadata per direction. |

---

## CSS Custom Properties and Tailwind Configuration

### CSS Custom Properties

All custom properties are defined in `/src/app/globals.css` within the `:root` selector:

```css
:root {
  --primary: #c2410c;
  --primary-light: #ea580c;
  --secondary: #1e3a5f;
  --background: #faf9f6;
  --foreground: #1c1917;
  --score-good: #22c55e;
  --score-attention: #f59e0b;
  --score-problem: #ef4444;
  --card-bg: #ffffff;
  --border: #e5e2de;
}
```

### Tailwind v4 Theme Integration

Tailwind v4 uses the `@theme inline` directive (not a `tailwind.config.js` file) to bridge CSS custom properties into the Tailwind utility system:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-light: var(--primary-light);
  --color-secondary: var(--secondary);
  --color-score-good: var(--score-good);
  --color-score-attention: var(--score-attention);
  --color-score-problem: var(--score-problem);
  --color-card-bg: var(--card-bg);
  --color-border: var(--border);
  --font-sans: var(--font-geist-sans);
  --font-serif: 'Georgia', 'Cambria', serif;
}
```

This allows usage of classes like `bg-primary`, `text-secondary`, `border-border` throughout the codebase. However, in practice, most components use the CSS variable syntax directly (e.g., `bg-[var(--primary)]`, `text-[var(--secondary)]`) rather than the Tailwind theme tokens. Both approaches work; the direct variable syntax is more explicit.

### PostCSS Configuration

**File:** `/postcss.config.mjs`

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

Uses the Tailwind v4 PostCSS plugin (`@tailwindcss/postcss`) instead of the legacy `tailwindcss` plugin. This is the standard setup for Tailwind CSS v4.

### Utility Classes

#### Score color utility classes (defined in globals.css):

```css
.score-good { color: var(--score-good); }
.score-attention { color: var(--score-attention); }
.score-problem { color: var(--score-problem); }
.bg-score-good { background-color: var(--score-good); }
.bg-score-attention { background-color: var(--score-attention); }
.bg-score-problem { background-color: var(--score-problem); }
```

These utility classes are defined but not currently used in the component code (the components use inline Tailwind classes or direct hex values instead).

#### Mandala background pattern:

```css
.mandala-bg {
  background-image: url("data:image/svg+xml,...");
}
```

An inline SVG data URI encoding three concentric circles in the primary color at 3% opacity. The pattern repeats every 60x60 pixels.

### Font Loading

The Geist font is loaded via `next/font/google` in `layout.tsx`:

```typescript
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

The `--font-geist-sans` CSS variable is applied to the `<body>` element via the `geistSans.variable` class and mapped to `--font-sans` in the Tailwind theme.

### Key Dependencies

| Package                    | Version   | Role                                    |
|----------------------------|-----------|-----------------------------------------|
| `tailwindcss`              | v4        | Utility-first CSS framework.            |
| `@tailwindcss/postcss`     | v4        | PostCSS plugin for Tailwind v4.         |
| `framer-motion`            | v12.34.3  | Animation library (LoadingSpinner).     |
| `lucide-react`             | v0.575.0  | Icon library (20+ icons used).          |
| `react-i18next`            | v16.5.4   | React bindings for i18next.             |
| `i18next`                  | v25.8.13  | Core i18n framework.                    |
| `i18next-browser-languagedetector` | v8.2.1 | Auto-detects browser language.   |
| `next`                     | v16.1.6   | React framework (App Router).           |
| `react`                    | v19.2.3   | UI library.                             |

---

## Type Reference

### ParsedRoom (from `/src/lib/llm/parse-floorplan.ts`)

```typescript
interface ParsedRoom {
  name: string;
  type: string;
  compass_direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'CENTER';
  grid_row: number;  // 0-2
  grid_col: number;  // 0-2
  size: 'small' | 'medium' | 'large';
  has_window: boolean;
  has_door: boolean;
}
```

### ParsedFloorPlan (from `/src/lib/llm/parse-floorplan.ts`)

```typescript
interface ParsedFloorPlan {
  rooms: ParsedRoom[];
  entrance: {
    compass_direction: Direction;
    grid_row: number;
    grid_col: number;
    side: string;
  };
  total_rooms: number;
  plan_shape: string;
  confidence: string;  // 'high' | 'medium' | 'low'
  error?: string;
  message?: string;
}
```

### RoomScore (from `/src/lib/vastu/types.ts`)

```typescript
interface RoomScore {
  room_name: string;
  room_type: RoomType;
  actual_direction: Direction;
  ideal_directions: Direction[];
  score: number;
  severity: 'critical' | 'major' | 'minor' | 'positive';
  issues: string[];
  remedies: string[];
  rule_ids: string[];
}
```

### ReportContent (from `/src/lib/llm/generate-report.ts`)

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

### VastuAnalysis (from `/src/lib/vastu/types.ts`)

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
