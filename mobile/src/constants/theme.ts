/**
 * Design tokens shared by every screen. Values are lifted from the website's
 * globals.css so the app and the site read as one product.
 */

export const FONTS = {
  body: 'Montserrat',
  medium: 'Montserrat-Medium',
  semibold: 'Montserrat-SemiBold',
  bold: 'Montserrat-Bold',
  serif: 'Playfair Display',
  serifBold: 'Playfair Display Bold',
} as const;

/** Header gradient stops — matches NavBar.tsx on the website. */
export const HEADER_GRADIENT = ['#6E1126', '#4a0c1a', '#1a0a20', '#283171'] as const;
export const HEADER_GRADIENT_STOPS = ['0', '0.35', '0.7', '1'] as const;
export const HEADER_HEIGHT = 68;

export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

/** The five score bands from ScoreCard.tsx. */
export function scoreBand(score: number): { color: string; label: string } {
  if (score >= 80) return { color: '#16a34a', label: 'Excellent' };
  if (score >= 70) return { color: '#65a30d', label: 'Good' };
  if (score >= 55) return { color: '#d97706', label: 'Fair' };
  if (score >= 40) return { color: '#ea580c', label: 'Below Average' };
  return { color: '#dc2626', label: 'Needs Work' };
}

/** The simpler three-way scale used by the zone map, per VastuSchematic.tsx. */
export function zoneColor(score?: number): string {
  if (score === undefined) return '#d1d5db';
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export function zoneFill(score?: number): string {
  if (score === undefined) return '#f9fafb';
  if (score >= 80) return '#f0fdf4';
  if (score >= 50) return '#fffbeb';
  return '#fef2f2';
}

export const DIRECTION_NAMES: Record<string, string> = {
  N: 'North', NE: 'North-East', E: 'East', SE: 'South-East',
  S: 'South', SW: 'South-West', W: 'West', NW: 'North-West',
};

export const DEITIES: Record<string, string> = {
  N: 'Kubera', NE: 'Ishanya', E: 'Indra', SE: 'Agni',
  S: 'Yama', SW: 'Nairutya', W: 'Varuna', NW: 'Vayu', CENTER: 'Brahma',
};

/**
 * Normalises a direction to its short code. The analyze endpoint returns a full
 * word ("north") in `facing_direction`, while room and entrance fields use codes
 * ("N"), so anything rendering either has to agree on one form.
 */
export function toDirectionCode(value?: string | null): string | undefined {
  if (!value) return undefined;
  const raw = String(value).trim().toUpperCase().replace(/[\s_-]/g, '');
  if (DIRECTION_NAMES[raw]) return raw;

  const words: Record<string, string> = {
    NORTH: 'N', NORTHEAST: 'NE', EAST: 'E', SOUTHEAST: 'SE',
    SOUTH: 'S', SOUTHWEST: 'SW', WEST: 'W', NORTHWEST: 'NW',
  };
  return words[raw];
}

/** Human label for a direction in either form; falls back to the raw value. */
export function directionLabel(value?: string | null): string | undefined {
  if (!value) return undefined;
  const code = toDirectionCode(value);
  return code ? DIRECTION_NAMES[code] : String(value);
}
