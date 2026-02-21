import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrock } from './bedrock-client';
import { FLOORPLAN_PARSE_PROMPT } from './prompts';

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'CENTER';

export interface ParsedRoom {
  name: string;
  type: string;
  compass_direction: Direction;
  grid_row: number;
  grid_col: number;
  size: 'small' | 'medium' | 'large';
  has_window: boolean;
  has_door: boolean;
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

const floorPlanTool = {
  name: 'parse_floorplan',
  description: 'Output the parsed floor plan data as structured JSON',
  input_schema: {
    type: 'object' as const,
    properties: {
      rooms: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['kitchen', 'master_bedroom', 'bedroom', 'bathroom', 'living_room', 'dining_room', 'pooja_room', 'balcony', 'storage', 'corridor', 'study', 'utility', 'hall', 'drawing_room', 'unknown'] },
            compass_direction: { type: 'string', enum: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'CENTER'] },
            grid_row: { type: 'number' },
            grid_col: { type: 'number' },
            size: { type: 'string', enum: ['small', 'medium', 'large'] },
            has_window: { type: 'boolean' },
            has_door: { type: 'boolean' }
          },
          required: ['name', 'type', 'compass_direction', 'grid_row', 'grid_col', 'size', 'has_window', 'has_door']
        }
      },
      entrance: {
        type: 'object',
        properties: {
          compass_direction: { type: 'string', enum: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'CENTER'] },
          grid_row: { type: 'number' },
          grid_col: { type: 'number' },
          side: { type: 'string' }
        },
        required: ['compass_direction', 'grid_row', 'grid_col', 'side']
      },
      total_rooms: { type: 'number' },
      plan_shape: { type: 'string' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      error: { type: 'string' },
      message: { type: 'string' }
    },
    required: ['rooms', 'entrance', 'total_rooms', 'plan_shape', 'confidence']
  }
};

export async function parseFloorPlan(
  fileBase64: string,
  facingDirection: string,
  isPdf: boolean = false
): Promise<ParsedFloorPlan> {
  const t0 = Date.now();
  const log = (step: string, data?: Record<string, unknown>) =>
    console.log(`[LLM_PARSE] ${step}`, data ? JSON.stringify(data) : '');

  // Build prompt with direction substituted
  const prompt = FLOORPLAN_PARSE_PROMPT.replace('{facing_direction}', facingDirection);

  log('1_PROMPT_BUILT', {
    facingDirection_input: facingDirection,
    facingDirection_inPrompt: prompt.includes(`faces ${facingDirection}`),
    promptFirstLine: prompt.split('\n')[1], // "The homeowner has indicated that their main door faces X."
    isPdf,
    imageBase64Length: fileBase64.length,
  });

  const fileContentBlock = isPdf
    ? {
        type: 'document' as const,
        source: {
          type: 'base64' as const,
          media_type: 'application/pdf' as const,
          data: fileBase64
        }
      }
    : {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data: fileBase64
        }
      };

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 2000,
    temperature: 0.1,
    tools: [floorPlanTool],
    tool_choice: { type: 'tool' as const, name: 'parse_floorplan' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          fileContentBlock
        ]
      }
    ]
  };

  log('2_BEDROCK_CALL', {
    model: 'us.anthropic.claude-sonnet-4-6',
    temperature: 0.1,
    maxTokens: 2000,
    toolChoice: 'parse_floorplan',
    contentBlocks: 2,
    textBlockPreview: prompt.substring(0, 120),
  });

  const command = new InvokeModelCommand({
    modelId: 'us.anthropic.claude-sonnet-4-6',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload)
  });

  const response = await bedrock.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  log('3_BEDROCK_RESPONSE', {
    latencyMs: Date.now() - t0,
    stopReason: responseBody.stop_reason,
    contentBlockCount: responseBody.content?.length,
    contentTypes: responseBody.content?.map((b: { type: string }) => b.type),
    inputTokens: responseBody.usage?.input_tokens,
    outputTokens: responseBody.usage?.output_tokens,
  });

  const toolUseBlock = responseBody.content.find(
    (block: { type: string }) => block.type === 'tool_use'
  );

  if (!toolUseBlock) {
    log('3_ERROR_NO_TOOL_USE', {
      fullResponse: JSON.stringify(responseBody).substring(0, 500),
    });
    throw new Error('LLM did not return a tool_use block');
  }

  const result = toolUseBlock.input as ParsedFloorPlan;

  log('4_PARSED_RESULT', {
    confidence: result.confidence,
    error: result.error,
    totalRooms: result.total_rooms,
    entranceDir: result.entrance?.compass_direction,
    entranceSide: result.entrance?.side,
    roomDirections: result.rooms?.map(r => `${r.name}=${r.compass_direction}`),
  });

  return result;
}
