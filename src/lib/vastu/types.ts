export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'CENTER';
export type Severity = 'critical' | 'major' | 'minor' | 'positive';
export type RoomType = 'kitchen' | 'master_bedroom' | 'bedroom' | 'bathroom' |
  'living_room' | 'dining_room' | 'pooja_room' | 'balcony' | 'storage' |
  'corridor' | 'study' | 'utility' | 'hall' | 'drawing_room' | 'unknown';

export interface VastuRule {
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

export interface RoomScore {
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

export interface VastuAnalysis {
  overall_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  room_scores: RoomScore[];
  critical_issues: string[];
  positive_aspects: string[];
  summary: string;
}
