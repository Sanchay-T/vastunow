import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrock } from './bedrock-client';
import { REPORT_GENERATION_PROMPT } from './prompts';
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
  name: 'generate_report',
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

export async function generateReport(
  analysis: VastuAnalysis,
  language: string = 'English'
): Promise<ReportContent> {
  const prompt = REPORT_GENERATION_PROMPT.replace('{language}', language);

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 3000,
    temperature: 0.4,
    system: prompt,
    tools: [reportTool],
    tool_choice: { type: 'tool' as const, name: 'generate_report' },
    messages: [
      {
        role: 'user',
        content: `Here is the Vastu analysis data:\n${JSON.stringify(analysis, null, 2)}`
      }
    ]
  };

  const command = new InvokeModelCommand({
    modelId: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload)
  });

  const response = await bedrock.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  const toolUseBlock = responseBody.content.find(
    (block: { type: string }) => block.type === 'tool_use'
  );
  return toolUseBlock.input as ReportContent;
}
