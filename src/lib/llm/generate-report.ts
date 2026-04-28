import { anthropic } from './bedrock-client';
import { REPORT_GENERATION_PROMPT } from './prompts';
import { calculateCost, type TokenUsage } from './cost-tracker';
import type { VastuAnalysis } from '../vastu/types';

export interface ReportRoomDetail {
  room_name: string;
  finding: string;
  impact: string;
  remedy: string | null;
}

export interface ReportContent {
  summary: string;
  overall_interpretation: string;
  room_details: ReportRoomDetail[];
  top_priorities: string[];
  positive_notes: string[];
  general_tips: string[];
}

const reportTool = {
  name: 'generate_report' as const,
  description: 'Output the Vastu report as structured JSON',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: { type: 'string' },
      overall_interpretation: { type: 'string' },
      room_details: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            room_name: { type: 'string' },
            finding: { type: 'string' },
            impact: { type: 'string' },
            remedy: { type: ['string', 'null'] }
          },
          required: ['room_name', 'finding', 'impact', 'remedy']
        }
      },
      top_priorities: { type: 'array', items: { type: 'string' } },
      positive_notes: { type: 'array', items: { type: 'string' } },
      general_tips: { type: 'array', items: { type: 'string' } }
    },
    required: ['summary', 'overall_interpretation', 'room_details', 'top_priorities', 'positive_notes', 'general_tips']
  }
};

const MODEL = 'claude-haiku-4-5-20251001';

export async function generateReport(
  analysis: VastuAnalysis,
  language: string = 'English'
): Promise<{ result: ReportContent; usage: TokenUsage }> {
  const prompt = REPORT_GENERATION_PROMPT.replace('{language}', language);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3000,
    temperature: 0.4,
    system: prompt,
    tools: [reportTool],
    tool_choice: { type: 'tool', name: 'generate_report' },
    messages: [
      {
        role: 'user',
        content: `Here is the Vastu analysis data:\n${JSON.stringify(analysis, null, 2)}`
      }
    ]
  });

  const usage = calculateCost(MODEL, response.usage.input_tokens, response.usage.output_tokens);

  const toolUseBlock = response.content.find(
    (block) => block.type === 'tool_use'
  );

  if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
    throw new Error('LLM did not return a tool_use block for report generation');
  }

  return { result: toolUseBlock.input as ReportContent, usage };
}
