import type { ParsedFloorPlan, Direction, ParsedRoom, VastuAnalysis, RoomScore, SeverityLevel } from '@/lib/types/vastu';

interface RuleData {
  rules: Array<{
    id: string;
    room_type: string;
    ideal_directions: string[];
    acceptable_directions: string[];
    bad_directions: string[];
    critical_directions: string[];
    weight: number;
    remedy: string;
    description: string;
  }>;
  direction_metadata: Record<string, {
    element: string;
    deity: string;
    governs: string;
  }>;
  severity_tiers: {
    ideal: number;
    acceptable: number;
    bad: number;
    critical: number;
  };
}

const RULES_DATA: RuleData = {
  rules: [
    {
      id: 'kitchen-001',
      room_type: 'kitchen',
      ideal_directions: ['SE'],
      acceptable_directions: ['E', 'S'],
      bad_directions: ['NE', 'N', 'W', 'NW'],
      critical_directions: ['SW', 'CENTER'],
      weight: 8,
      remedy: 'Consider shifting the kitchen to the Southeast corner. If not possible, place the cooking stove in the SE quadrant of the kitchen.',
      description: 'Kitchen should be in the Southeast (Agni kon) representing the fire element.',
    },
    {
      id: 'master_bedroom-001',
      room_type: 'master_bedroom',
      ideal_directions: ['SW'],
      acceptable_directions: ['S', 'W'],
      bad_directions: ['NE', 'NW', 'E', 'SE'],
      critical_directions: ['N', 'CENTER'],
      weight: 9,
      remedy: 'The master bedroom is ideally placed in the Southwest corner for stability and restful energy. Consider relocating if possible.',
      description: 'Master bedroom in the SW (Nairutya) brings stability and restful sleep.',
    },
    {
      id: 'bathroom-001',
      room_type: 'bathroom',
      ideal_directions: ['NW', 'W'],
      acceptable_directions: ['E', 'NE'],
      bad_directions: ['N', 'S', 'SW'],
      critical_directions: ['SE', 'CENTER', 'NE'],
      weight: 6,
      remedy: 'Bathrooms should ideally face Northwest or West. Ensure bathroom doors do not open directly toward the kitchen or pooja room.',
      description: 'Bathrooms in NW/W to avoid contamination of sacred energies.',
    },
    {
      id: 'living_room-001',
      room_type: 'living_room',
      ideal_directions: ['E', 'NE'],
      acceptable_directions: ['N', 'W'],
      bad_directions: ['SW', 'S', 'SE'],
      critical_directions: ['CENTER'],
      weight: 7,
      remedy: 'Living rooms in the East or Northeast promote positive social energy. Ensure the space is clutter-free and well-lit.',
      description: 'Living room in E/NE for positive social connections and growth.',
    },
    {
      id: 'pooja_room-001',
      room_type: 'pooja_room',
      ideal_directions: ['NE'],
      acceptable_directions: ['E', 'N'],
      bad_directions: ['S', 'SW', 'W', 'SE'],
      critical_directions: ['CENTER', 'BATHROOM'],
      weight: 9,
      remedy: 'The pooja room should face Northeast (Ishanya). Keep the idol/photo facing East or West. Never place a pooja room above or below a bathroom.',
      description: 'Pooja room must be in the NE corner (Ishanya), the most sacred zone.',
    },
    {
      id: 'bedroom-001',
      room_type: 'bedroom',
      ideal_directions: ['SW', 'W', 'NW'],
      acceptable_directions: ['S'],
      bad_directions: ['NE', 'E', 'SE'],
      critical_directions: ['N', 'CENTER'],
      weight: 7,
      remedy: 'Guest or children\'s bedrooms work well in the NW or West. Avoid the NE for bedrooms.',
      description: 'Regular bedrooms in SW/W/NW for restful energy.',
    },
    {
      id: 'dining_room-001',
      room_type: 'dining_room',
      ideal_directions: ['W', 'NW'],
      acceptable_directions: ['N', 'E'],
      bad_directions: ['SW', 'S', 'SE'],
      critical_directions: ['CENTER'],
      weight: 5,
      remedy: 'Dining room in the West or Northwest. Place the dining table such that eaters face East, North, or West while eating.',
      description: 'Dining room in W/NW for healthy digestion and family bonding.',
    },
    {
      id: 'study-001',
      room_type: 'study',
      ideal_directions: ['E', 'NE'],
      acceptable_directions: ['N'],
      bad_directions: ['SW', 'W', 'NW', 'S'],
      critical_directions: ['SE', 'CENTER'],
      weight: 6,
      remedy: 'Study rooms benefit from East or Northeast facing for clarity of mind. Sit facing East or North while studying.',
      description: 'Study in E/NE for enhanced concentration and learning.',
    },
    {
      id: 'hall-001',
      room_type: 'hall',
      ideal_directions: ['N', 'NE', 'E'],
      acceptable_directions: ['W', 'NW'],
      bad_directions: ['S', 'SW'],
      critical_directions: ['CENTER'],
      weight: 10,
      remedy: 'The main hall/entrance should ideally face North, Northeast, or East. Ensure the main door opens clockwise and is the largest door in the house.',
      description: 'Main entrance is the single most important Vastu element.',
    },
    {
      id: 'balcony-001',
      room_type: 'balcony',
      ideal_directions: ['N', 'E', 'NE'],
      acceptable_directions: ['W', 'NW'],
      bad_directions: ['S', 'SW', 'SE'],
      critical_directions: [],
      weight: 3,
      remedy: 'Balconies in the North or East are ideal. Place plants in the NE corner of balconies for positive energy.',
      description: 'Balcony in N/E/NE for open positive energy flow.',
    },
    {
      id: 'storage-001',
      room_type: 'storage',
      ideal_directions: ['SW', 'W', 'NW'],
      acceptable_directions: ['S'],
      bad_directions: ['NE', 'N', 'E'],
      critical_directions: ['CENTER'],
      weight: 4,
      remedy: 'Storage rooms in SW/W/NW. Keep storage organized and avoid clutter in the Northeast.',
      description: 'Storage in SW/W/NW for grounded energy.',
    },
    {
      id: 'drawing_room-001',
      room_type: 'drawing_room',
      ideal_directions: ['N', 'NE', 'E'],
      acceptable_directions: ['W', 'NW'],
      bad_directions: ['S', 'SW', 'SE'],
      critical_directions: ['CENTER'],
      weight: 6,
      remedy: 'Drawing room in North, Northeast, or East for welcoming positive energy. Keep the space light and airy.',
      description: 'Drawing room in N/NE/E for social harmony.',
    },
  ],
  direction_metadata: {
    N: { element: 'Water', deity: 'Kubera', governs: 'Wealth and Opportunities' },
    NE: { element: 'Water/Ether', deity: 'Ishanya (Shiva)', governs: 'Spirituality and Clarity' },
    E: { element: 'Fire/Light', deity: 'Indra/Surya', governs: 'Social Connections and Growth' },
    SE: { element: 'Fire', deity: 'Agni', governs: 'Energy and Cash Flow' },
    S: { element: 'Earth/Fire', deity: 'Yama', governs: 'Fame and Relaxation' },
    SW: { element: 'Earth', deity: 'Pitru/Nairutya', governs: 'Relationships and Stability' },
    W: { element: 'Air/Space', deity: 'Varuna', governs: 'Gains and Profits' },
    NW: { element: 'Air', deity: 'Vayu', governs: 'Support and Networking' },
    CENTER: { element: 'Ether/Space', deity: 'Brahma', governs: 'Overall Balance' },
  },
  severity_tiers: {
    ideal: 95,
    acceptable: 70,
    bad: 35,
    critical: 10,
  },
};

function getScoreForDirection(roomType: string, direction: Direction): number {
  const rule = RULES_DATA.rules.find(r => r.room_type === roomType);
  if (!rule) return 50;

  if (rule.ideal_directions.includes(direction)) return RULES_DATA.severity_tiers.ideal;
  if (rule.acceptable_directions.includes(direction)) return RULES_DATA.severity_tiers.acceptable;
  if (rule.bad_directions.includes(direction)) return RULES_DATA.severity_tiers.bad;
  if (rule.critical_directions.includes(direction)) return RULES_DATA.severity_tiers.critical;
  return 50;
}

function getSeverity(score: number): SeverityLevel {
  if (score >= 80) return 'positive';
  if (score >= 50) return 'neutral';
  if (score >= 35) return 'warning';
  return 'critical';
}

export function analyzeVastu(plan: ParsedFloorPlan): VastuAnalysis {
  const roomScores: RoomScore[] = plan.rooms.map(room => {
    const score = getScoreForDirection(room.type, room.compass_direction);
    const rule = RULES_DATA.rules.find(r => r.room_type === room.type);
    const severity = getSeverity(score);

    const issues: string[] = [];
    const remedies: string[] = [];

    if (rule) {
      if (rule.critical_directions.includes(room.compass_direction)) {
        issues.push(`Critical: ${room.name} is in the ${room.compass_direction} zone — ${rule.description}`);
        remedies.push(rule.remedy);
      } else if (rule.bad_directions.includes(room.compass_direction)) {
        issues.push(`Warning: ${room.name} in ${room.compass_direction} zone could be improved. ${rule.description}`);
        remedies.push(rule.remedy);
      } else if (rule.acceptable_directions.includes(room.compass_direction)) {
        issues.push(`Acceptable: ${room.name} is in ${room.compass_direction}. ${rule.description}`);
      } else {
        issues.push(`Ideal: ${room.name} is perfectly placed in the ${room.compass_direction} zone. ${rule.description}`);
      }
    }

    return {
      room_name: room.name,
      room_type: room.type,
      actual_direction: room.compass_direction,
      ideal_directions: rule?.ideal_directions as Direction[] || [],
      acceptable_directions: rule?.acceptable_directions as Direction[] || [],
      score,
      severity,
      issues,
      remedies,
      rule_ids: rule ? [rule.id] : [],
    };
  });

  // Weighted average score
  let totalWeight = 0;
  let weightedScore = 0;
  roomScores.forEach(rs => {
    const rule = RULES_DATA.rules.find(r => r.room_type === rs.room_type);
    const weight = rule?.weight || 5;
    weightedScore += rs.score * weight;
    totalWeight += weight;
  });

  const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  // Grade
  let grade: string;
  if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 55) grade = 'C';
  else if (overallScore >= 40) grade = 'D';
  else grade = 'F';

  // Critical issues
  const criticalIssues = roomScores
    .filter(rs => rs.severity === 'critical')
    .map(rs => rs.issues[0]);

  // Positive aspects
  const positiveAspects = roomScores
    .filter(rs => rs.severity === 'positive')
    .map(rs => `${rs.room_name} is perfectly placed in the ${rs.actual_direction} zone`);

  return {
    overall_score: overallScore,
    grade,
    room_scores: roomScores,
    critical_issues: criticalIssues,
    positive_aspects: positiveAspects,
  };
}

export function getDirectionMetadata() {
  return RULES_DATA.direction_metadata;
}

export function getRulesData() {
  return RULES_DATA;
}
