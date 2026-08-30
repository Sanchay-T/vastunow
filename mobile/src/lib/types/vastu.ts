// Vastu direction type
export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'CENTER';

export const ALL_DIRECTIONS: Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export const DIRECTION_LABELS: Record<string, string> = {
  N: 'North',
  NE: 'Northeast',
  E: 'East',
  SE: 'Southeast',
  S: 'South',
  SW: 'Southwest',
  W: 'West',
  NW: 'Northwest',
};

export const DIRECTION_GRID: Direction[][] = [
  ['NW', 'N', 'NE'],
  ['W', 'CENTER', 'E'],
  ['SW', 'S', 'SE'],
];

export const DIRECTION_METADATA: Record<Direction, { element: string; deity: string; governs: string }> = {
  N: { element: 'Water', deity: 'Kubera', governs: 'Wealth & Opportunities' },
  NE: { element: 'Water/Ether', deity: 'Ishanya (Shiva)', governs: 'Spirituality & Clarity' },
  E: { element: 'Fire/Light', deity: 'Indra/Surya', governs: 'Social Connections & Growth' },
  SE: { element: 'Fire', deity: 'Agni', governs: 'Energy & Cash Flow' },
  S: { element: 'Earth/Fire', deity: 'Yama', governs: 'Fame & Relaxation' },
  SW: { element: 'Earth', deity: 'Pitru/Nairutya', governs: 'Relationships & Stability' },
  W: { element: 'Air/Space', deity: 'Varuna', governs: 'Gains & Profits' },
  NW: { element: 'Air', deity: 'Vayu', governs: 'Support & Networking' },
  CENTER: { element: 'Ether/Space', deity: 'Brahma', governs: 'Overall Balance' },
};

export interface ParsedRoom {
  name: string;
  type: string;
  compass_direction: Direction;
  grid_row: number;
  grid_col: number;
  size: 'small' | 'medium' | 'large';
  has_window: boolean;
  has_door: boolean;
  pos_x_pct?: number;
  pos_y_pct?: number;
  bbox?: { x: number; y: number; w: number; h: number };
  user_added?: boolean;
}

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

export interface RoomScore {
  room_name: string;
  room_type: string;
  actual_direction: Direction;
  ideal_directions: Direction[];
  acceptable_directions?: Direction[];
  score: number;
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
  issues: string[];
  remedies: string[];
  rule_ids: string[];
}

export interface VastuAnalysis {
  overall_score: number;
  grade: string;
  room_scores: RoomScore[];
  critical_issues: string[];
  positive_aspects: string[];
}

export interface ReportContent {
  summary: string;
  overall_interpretation: string;
  room_details: Array<{
    room_name: string;
    finding: string;
    impact: string;
    remedy: string | null;
  }>;
  top_priorities: string[];
  positive_notes: string[];
  general_tips: string[];
}

export interface AnalysisResult {
  id: string;
  overall_score: number;
  grade: string;
  room_scores: RoomScore[];
  critical_issues: string[];
  positive_aspects: string[];
  report: ReportContent | null;
  report_available: boolean;
  image_url: string;
  schematic_data: {
    rooms: ParsedRoom[];
    entrance: {
      compass_direction: Direction;
      grid_row: number;
      grid_col: number;
      side: string;
    };
    facing: string;
    scores: RoomScore[];
  };
}

export type SeverityLevel = 'positive' | 'neutral' | 'warning' | 'critical';
