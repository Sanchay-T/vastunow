import { File as FSFile } from 'expo-file-system';
import type { AnalysisResult, ParsedFloorPlan } from '@/lib/types/vastu';

/**
 * Production API. Kept as a literal fallback because EXPO_PUBLIC_* is inlined at
 * bundle time: an OTA update built without that variable would otherwise fetch
 * relative paths, which React Native rejects with "Invalid URL".
 */
const DEFAULT_API_BASE_URL = 'https://vastunow.vercel.app';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

/** Opening this in a browser downloads the generated PDF report. */
export function reportPdfUrl(id: string): string {
  return `${API_BASE_URL}/api/report-pdf?id=${id}`;
}

export async function analyzeFloorPlan(
  file: { uri: string; name: string; type: string },
  facingDirection: string
): Promise<{ parsed_floorplan: ParsedFloorPlan; image_url: string; facing_direction: string; confidence: string }> {
  const formData = new FormData();
  formData.append('floorplan', new FSFile(file.uri) as any);
  formData.append('facing', facingDirection);

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Analysis failed' }));
    throw new Error(error.error || 'Analysis failed');
  }

  return response.json();
}

export async function scoreFloorPlan(params: {
  parsed_floorplan: ParsedFloorPlan;
  image_url: string;
  facing_direction: string;
  language: 'English' | 'Hindi';
  user_corrections?: { rooms?: Array<{ index: number; name?: string; type?: string }> };
  skipReview?: boolean;
}): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Scoring failed' }));
    throw new Error(error.error || 'Scoring failed');
  }

  return response.json();
}

export async function fetchAnalysis(id: string): Promise<{ analysis: any } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/report-pdf?id=${id}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function regenerateReport(
  analysisId: string,
  language: 'English' | 'Hindi'
): Promise<{ report: any }> {
  const response = await fetch(`${API_BASE_URL}/api/regenerate-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis_id: analysisId, language }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to regenerate report' }));
    throw new Error(error.error || 'Failed to regenerate report');
  }

  return response.json();
}
