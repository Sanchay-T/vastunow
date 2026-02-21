import type { ParsedFloorPlan, ParsedRoom } from '../llm/parse-floorplan';
import type { VastuRule, RoomScore, VastuAnalysis, Severity, Direction } from './types';
import rulesData from './rules-data.json';

function scoreRoom(room: ParsedRoom, direction: Direction, rules: VastuRule[]): RoomScore {
  const applicableRules = rules.filter(r => r.room_type === room.type);

  if (applicableRules.length === 0) {
    return {
      room_name: room.name,
      room_type: room.type as RoomScore['room_type'],
      actual_direction: direction,
      ideal_directions: [],
      score: 70,
      severity: 'minor',
      issues: [],
      remedies: [],
      rule_ids: []
    };
  }

  let worstScore = 100;
  let worstSeverity: Severity = 'positive';
  const issues: string[] = [];
  const remedies: string[] = [];
  const ruleIds: string[] = [];

  for (const rule of applicableRules) {
    ruleIds.push(rule.id);
    let ruleScore = 50;
    let ruleSeverity: Severity = 'minor';

    if (rule.ideal_directions.includes(direction)) {
      ruleScore = 95;
      ruleSeverity = 'positive';
    } else if (rule.acceptable_directions.includes(direction)) {
      ruleScore = 70;
      ruleSeverity = 'minor';
      issues.push(`${room.name} is in the ${direction} zone (${getDirectionName(direction)}) — acceptable but not ideal. Best placement: ${rule.ideal_directions.join(', ')}`);
      if (rule.remedy) remedies.push(rule.remedy);
    } else if (rule.critical_directions.includes(direction)) {
      ruleScore = 10;
      ruleSeverity = 'critical';
      issues.push(`${room.name} in the ${direction} zone is a severe Vastu dosha. This should ideally be in ${rule.ideal_directions.join(', ')}`);
      if (rule.remedy) remedies.push(rule.remedy);
    } else if (rule.bad_directions.includes(direction)) {
      ruleScore = 35;
      ruleSeverity = 'major';
      issues.push(`${room.name} in the ${direction} zone is not recommended. Best placement: ${rule.ideal_directions.join(', ')}`);
      if (rule.remedy) remedies.push(rule.remedy);
    }

    if (ruleScore < worstScore) {
      worstScore = ruleScore;
      worstSeverity = ruleSeverity;
    }
  }

  return {
    room_name: room.name,
    room_type: room.type as RoomScore['room_type'],
    actual_direction: direction,
    ideal_directions: applicableRules[0]?.ideal_directions || [],
    score: worstScore,
    severity: worstSeverity,
    issues,
    remedies,
    rule_ids: ruleIds
  };
}

function getDirectionName(dir: Direction): string {
  const names: Record<Direction, string> = {
    'N': 'North / Kubera', 'NE': 'Northeast / Ishanya', 'E': 'East / Indra',
    'SE': 'Southeast / Agni', 'S': 'South / Yama', 'SW': 'Southwest / Nairutya',
    'W': 'West / Varuna', 'NW': 'Northwest / Vayu', 'CENTER': 'Center / Brahma'
  };
  return names[dir] || dir;
}

export { getDirectionName };

export function analyzeVastu(
  floorPlan: ParsedFloorPlan,
  facingDirection: string
): VastuAnalysis {
  const rules = rulesData.rules as VastuRule[];
  const roomScores: RoomScore[] = [];

  for (const room of floorPlan.rooms) {
    const roomScore = scoreRoom(room, room.compass_direction, rules);
    roomScores.push(roomScore);
  }

  if (floorPlan.entrance) {
    const entranceRules = rules.filter(r => r.id.startsWith('entrance'));
    const entranceScore = scoreRoom(
      {
        name: 'Main Entrance',
        type: 'hall',
        compass_direction: floorPlan.entrance.compass_direction,
        grid_row: floorPlan.entrance.grid_row,
        grid_col: floorPlan.entrance.grid_col,
        size: 'small',
        has_window: false,
        has_door: true
      },
      floorPlan.entrance.compass_direction,
      entranceRules
    );
    roomScores.push(entranceScore);
  }

  const totalWeight = roomScores.reduce((sum, rs) => {
    const rule = rules.find(r => r.room_type === rs.room_type);
    return sum + (rule?.weight || 5);
  }, 0);

  const weightedSum = roomScores.reduce((sum, rs) => {
    const rule = rules.find(r => r.room_type === rs.room_type);
    return sum + rs.score * (rule?.weight || 5);
  }, 0);

  const overallScore = Math.round(weightedSum / totalWeight);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 55) grade = 'C';
  else if (overallScore >= 40) grade = 'D';
  else grade = 'F';

  const criticalIssues = roomScores
    .filter(rs => rs.severity === 'critical')
    .flatMap(rs => rs.issues);

  const positiveAspects = roomScores
    .filter(rs => rs.severity === 'positive')
    .map(rs => `${rs.room_name} is perfectly placed in the ${rs.actual_direction} zone (${getDirectionName(rs.actual_direction)})`);

  return {
    overall_score: overallScore,
    grade,
    room_scores: roomScores,
    critical_issues: criticalIssues,
    positive_aspects: positiveAspects,
    summary: ''
  };
}
