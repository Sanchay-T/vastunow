import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { generatePdfBuffer } from '@/lib/pdf/generate';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing analysis ID' }, { status: 400 });
    }

    const { data: analysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const pdfBuffer = await generatePdfBuffer({
      overallScore: analysis.overall_score,
      grade: analysis.grade,
      facingDirection: analysis.facing_direction,
      createdAt: analysis.created_at,
      vastuAnalysis: analysis.vastu_analysis,
      reportContent: analysis.report_content,
      rooms: analysis.parsed_floorplan?.rooms || [],
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="vastu-report-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
