import { anthropic } from '../llm/bedrock-client';
import { calculateCost, type TokenUsage } from '../llm/cost-tracker';

const MODEL = 'claude-haiku-4-5-20251001';

export async function matchUnknownRoomType(
  roomName: string,
  roomType: string
): Promise<{ result: string; usage: TokenUsage }> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 20,
    temperature: 0,
    system: `You match unknown room types to the closest Vastu rule category.
Available categories: kitchen, master_bedroom, bedroom, bathroom, living_room,
dining_room, pooja_room, balcony, storage, corridor, study, utility, hall, drawing_room.
Return ONLY the category name, nothing else.`,
    messages: [
      {
        role: 'user',
        content: `Room name: "${roomName}", detected type: "${roomType}". What is the closest Vastu category?`
      }
    ]
  });

  const usage = calculateCost(MODEL, response.usage.input_tokens, response.usage.output_tokens);

  const textBlock = response.content.find((block) => block.type === 'text');
  const result = (textBlock && textBlock.type === 'text') ? textBlock.text.trim() || 'storage' : 'storage';

  return { result, usage };
}
