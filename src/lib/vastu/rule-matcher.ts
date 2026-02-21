import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({ region: (process.env.AWS_REGION || 'us-east-1').trim() });

export async function matchUnknownRoomType(
  roomName: string,
  roomType: string
): Promise<string> {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
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
  };

  const command = new InvokeModelCommand({
    modelId: 'us.anthropic.claude-haiku-4-5-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload)
  });

  const response = await bedrock.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const textBlock = responseBody.content.find((block: { type: string }) => block.type === 'text');
  return textBlock?.text?.trim() || 'storage';
}
