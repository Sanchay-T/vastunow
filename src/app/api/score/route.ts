import { NextRequest, NextResponse } from 'next/server';
import { analyzeVastu } from '@/lib/vastu/scoring';
import { generateReport } from '@/lib/llm/generate-report';
import { matchUnknownRoomType } from '@/lib/vastu/rule-matcher';
import { supabase } from '@/lib/supabase/client';
import type { ParsedFloorPlan } from '@/lib/llm/parse-floorplan';
import { randomUUID } from 'crypto';

export const maxDuration = 60;

const KNOWN_TYPES = new Set([
  'kitchen', 'master_bedroom', 'bedroom', 'bathroom', 'living_room',
  'dining_room', 'pooja_room', 'balcony', 'storage', 'corridor',
  'study', 'utility', 'hall', 'drawing_room'
]);

function isKnownType(type: string): boolean {
  return KNOWN_TYPES.has(type);
}

function applyCorrections(
  plan: ParsedFloorPlan,
  corrections: { rooms?: Array<{ index: number; name?: string; type?: string }> }
): ParsedFloorPlan {
  const corrected = { ...plan, rooms: [...plan.rooms] };
  if (corrections.rooms) {
    for (const correction of corrections.rooms) {
      if (corrected.rooms[correction.index]) {
        if (correction.name) corrected.rooms[correction.index].name = correction.name;
        if (correction.type) corrected.rooms[correction.index].type = correction.type;
      }
    }
  }
  return corrected;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const log = (step: string, data?: Record<string, unknown>) =>
    console.log(`[SCORE] ${step}`, data ? JSON.stringify(data) : '');

  try {
    const body = await req.json();
    const { parsed_floorplan, image_url, facing_direction, language, user_corrections } = body;

    log('1_RECEIVED', {
      facing_direction,
      facing_direction_type: typeof facing_direction,
      facing_direction_length: facing_direction?.length,
      language,
      hasCorrections: !!user_corrections,
      correctionCount: user_corrections?.rooms?.length,
      roomCount: parsed_floorplan?.rooms?.length,
      entranceDir: parsed_floorplan?.entrance?.compass_direction,
      roomDirs: parsed_floorplan?.rooms?.map((r: { name: string; compass_direction: string }) => `${r.name}=${r.compass_direction}`),
    });

    // 1. Apply user corrections
    const finalPlan = user_corrections
      ? applyCorrections(parsed_floorplan, user_corrections)
      : parsed_floorplan;

    if (user_corrections) {
      log('2_CORRECTIONS_APPLIED', {
        correctedRooms: finalPlan.rooms.map((r: { name: string; type: string; compass_direction: string }) => `${r.name}(${r.type})=${r.compass_direction}`),
      });
    }

    // 2. Handle unknown room types
    for (const room of finalPlan.rooms) {
      if (room.type === 'unknown' || !isKnownType(room.type)) {
        const originalType = room.type;
        room.type = await matchUnknownRoomType(room.name, room.type);
        log('3_RULE_MATCH', { roomName: room.name, from: originalType, to: room.type });
      }
    }

    // 3. Run rules engine
    const vastuAnalysis = analyzeVastu(finalPlan, facing_direction);

    log('4_RULES_ENGINE', {
      facing_direction_used: facing_direction,
      overallScore: vastuAnalysis.overall_score,
      grade: vastuAnalysis.grade,
      roomScores: vastuAnalysis.room_scores.map(rs => ({
        room: rs.room_name,
        dir: rs.actual_direction,
        ideal: rs.ideal_directions,
        score: rs.score,
        severity: rs.severity,
      })),
      criticalIssueCount: vastuAnalysis.critical_issues.length,
      positiveCount: vastuAnalysis.positive_aspects.length,
    });

    // 4. Generate report
    let reportContent;
    try {
      reportContent = await generateReport(vastuAnalysis, language || 'English');
      log('5_REPORT_OK', { latencyMs: Date.now() - t0, language: language || 'English' });
    } catch (reportError) {
      log('5_REPORT_FAIL', { error: String(reportError) });
      reportContent = null;
    }

    // 5. Store in Supabase
    let analysisId = randomUUID();
    try {
      const { data: analysis, error: dbError } = await supabase
        .from('analyses')
        .insert({
          image_url,
          facing_direction,
          language: language || 'en',
          parsed_floorplan: finalPlan,
          user_corrections: user_corrections || null,
          vastu_analysis: vastuAnalysis,
          overall_score: vastuAnalysis.overall_score,
          grade: vastuAnalysis.grade,
          report_content: reportContent,
          report_language: language || 'en',
          ip_hash: req.headers.get('x-forwarded-for') || 'unknown'
        })
        .select()
        .single();

      if (!dbError && analysis) {
        analysisId = analysis.id;
        log('6_DB_OK', { id: analysisId });
      } else {
        log('6_DB_FAIL', { error: dbError?.message, usingLocalId: analysisId });
      }
    } catch (dbErr) {
      log('6_DB_ERROR', { error: String(dbErr), usingLocalId: analysisId });
    }

    log('7_RESPONSE', {
      id: analysisId,
      overallScore: vastuAnalysis.overall_score,
      grade: vastuAnalysis.grade,
      facing_in_schematic: facing_direction,
      totalLatencyMs: Date.now() - t0,
    });

    return NextResponse.json({
      id: analysisId,
      overall_score: vastuAnalysis.overall_score,
      grade: vastuAnalysis.grade,
      room_scores: vastuAnalysis.room_scores,
      critical_issues: vastuAnalysis.critical_issues,
      positive_aspects: vastuAnalysis.positive_aspects,
      report: reportContent,
      report_available: reportContent !== null,
      image_url,
      schematic_data: {
        rooms: finalPlan.rooms,
        entrance: finalPlan.entrance,
        facing: facing_direction,
        scores: vastuAnalysis.room_scores
      }
    });

  } catch (error) {
    log('ERROR', { error: String(error), stack: (error as Error).stack?.substring(0, 300) });
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
