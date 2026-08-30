// NOTE: In the mobile app, the backend handles all LLM calls.
// The mobile app only calls the existing /api/analyze and /api/score endpoints.
// This file is kept as a reference for future direct LLM integration if needed.

import { Anthropic } from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

export const anthropic = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;
