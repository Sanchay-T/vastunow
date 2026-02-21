import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

export const bedrock = new BedrockRuntimeClient({
  region: (process.env.AWS_REGION || 'us-east-1').trim(),
});
