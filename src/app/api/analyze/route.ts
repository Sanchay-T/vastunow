import { NextRequest, NextResponse } from 'next/server';
import { parseFloorPlan } from '@/lib/llm/parse-floorplan';
import { uploadFloorPlan } from '@/lib/supabase/storage';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const log = (step: string, data?: Record<string, unknown>) =>
    console.log(`[ANALYZE] ${step}`, data ? JSON.stringify(data) : '');

  try {
    const formData = await req.formData();
    const file = formData.get('floorplan') as File;
    const facingDirection = formData.get('facing') as string;

    log('1_RECEIVED', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      facingDirection_raw: facingDirection,
      facingDirection_length: facingDirection?.length,
      facingDirection_charCodes: facingDirection ? [...facingDirection].map(c => c.charCodeAt(0)) : [],
    });

    if (!file || !facingDirection) {
      log('1_REJECTED', { reason: 'missing fields', hasFile: !!file, hasDirection: !!facingDirection });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;

    // Upload to storage
    let imageUrl = '';
    try {
      imageUrl = await uploadFloorPlan(buffer, fileName, file.type);
      log('2_STORAGE_OK', { imageUrl: imageUrl.substring(0, 80) });
    } catch (storageErr) {
      log('2_STORAGE_FAIL', { error: String(storageErr) });
      imageUrl = `data:${file.type};base64,${buffer.toString('base64').substring(0, 100)}...`;
    }

    // Encode + detect type
    const base64 = buffer.toString('base64');
    const isPdf = file.type === 'application/pdf';
    log('3_PRE_LLM', {
      facingDirection,
      isPdf,
      base64Length: base64.length,
      promptWillContain: `main door faces ${facingDirection}`,
    });

    // Call Claude Sonnet
    const parsedPlan = await parseFloorPlan(base64, facingDirection, isPdf);
    const t1 = Date.now();

    log('4_LLM_RESPONSE', {
      llmLatencyMs: t1 - t0,
      confidence: parsedPlan.confidence,
      error: parsedPlan.error,
      totalRooms: parsedPlan.total_rooms,
      planShape: parsedPlan.plan_shape,
      entranceDirection: parsedPlan.entrance?.compass_direction,
      entranceSide: parsedPlan.entrance?.side,
      rooms: parsedPlan.rooms?.map(r => ({
        name: r.name,
        type: r.type,
        dir: r.compass_direction,
        grid: `${r.grid_row},${r.grid_col}`,
      })),
    });

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

    const response = {
      parsed_floorplan: parsedPlan,
      image_url: imageUrl,
      facing_direction: facingDirection,
      confidence: parsedPlan.confidence
    };

    log('5_RESPONSE', {
      facingDirection_in_response: response.facing_direction,
      totalLatencyMs: Date.now() - t0,
    });

    return NextResponse.json(response);

  } catch (error) {
    log('ERROR', { error: String(error), stack: (error as Error).stack?.substring(0, 300) });
    return NextResponse.json({ error: 'Failed to read your floor plan. Please try again.' }, { status: 500 });
  }
}
