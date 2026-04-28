import { NextRequest, NextResponse } from 'next/server';
import { generateReport } from '@/lib/llm/generate-report';
import { supabase } from '@/lib/supabase/client';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { analysis_id, language } = await req.json();

    // 1. Fetch existing analysis
    const { data: analysis } = await supabase
      .from('analyses')
      .select('vastu_analysis')
      .eq('id', analysis_id)
      .single();

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // 2. Regenerate report in new language
    const { result: reportContent, usage } = await generateReport(analysis.vastu_analysis, language);

    // 3. Update stored report
    await supabase
      .from('analyses')
      .update({ report_content: reportContent, report_language: language })
      .eq('id', analysis_id);

    return NextResponse.json({
      report: reportContent,
      cost: usage,
    });
  } catch (error) {
    console.error('Regenerate report error:', error);
    return NextResponse.json({ error: 'Failed to regenerate report' }, { status: 500 });
  }
}
