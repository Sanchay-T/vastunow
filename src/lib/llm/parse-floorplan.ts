import { anthropic } from './bedrock-client';
import { FLOORPLAN_PARSE_PROMPT } from './prompts';
import { calculateCost, type TokenUsage } from './cost-tracker';

function detectImageType(base64: string): string {
  const header = base64.substring(0, 20);
  if (header.startsWith('/9j/')) return 'image/jpeg';
  if (header.startsWith('iVBOR')) return 'image/png';
  if (header.startsWith('R0lG')) return 'image/gif';
  if (header.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg'; // fallback
}

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
  pos_x_pct?: number;
  pos_y_pct?: number;
  bbox?: { x: number; y: number; w: number; h: number };
  user_added?: boolean;
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
  name: 'parse_floorplan' as const,
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

const MODEL = 'claude-sonnet-4-6';

export async function parseFloorPlan(
  fileBase64: string,
  facingDirection: string,
  isPdf: boolean = false
): Promise<{ result: ParsedFloorPlan; usage: TokenUsage }> {
  const t0 = Date.now();
  const log = (step: string, data?: Record<string, unknown>) =>
    console.log(`[LLM_PARSE] ${step}`, data ? JSON.stringify(data) : '');

  const prompt = FLOORPLAN_PARSE_PROMPT.replace('{facing_direction}', facingDirection);

  log('1_PROMPT_BUILT', {
    facingDirection_input: facingDirection,
    facingDirection_inPrompt: prompt.includes(`faces ${facingDirection}`),
    promptFirstLine: prompt.split('\n')[1],
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
          media_type: detectImageType(fileBase64) as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: fileBase64
        }
      };

  log('2_API_CALL', {
    model: MODEL,
    temperature: 0.1,
    maxTokens: 2000,
    toolChoice: 'parse_floorplan',
    contentBlocks: 2,
    textBlockPreview: prompt.substring(0, 120),
  });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    temperature: 0.1,
    tools: [floorPlanTool],
    tool_choice: { type: 'tool', name: 'parse_floorplan' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          fileContentBlock
        ]
      }
    ]
  });

  const usage = calculateCost(MODEL, response.usage.input_tokens, response.usage.output_tokens);

  log('3_API_RESPONSE', {
    latencyMs: Date.now() - t0,
    stopReason: response.stop_reason,
    contentBlockCount: response.content?.length,
    contentTypes: response.content?.map(b => b.type),
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cost_usd: usage.cost_usd,
  });

  const toolUseBlock = response.content.find(
    (block) => block.type === 'tool_use'
  );

  if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
    log('3_ERROR_NO_TOOL_USE', {
      fullResponse: JSON.stringify(response.content).substring(0, 500),
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

  return { result, usage };
}
