import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const extra = {
    ...config.extra,
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || config.extra?.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || config.extra?.SUPABASE_ANON_KEY,
    API_BASE_URL: process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || config.extra?.API_BASE_URL,
  };

  return {
    ...config,
    extra,
  } as ExpoConfig;
};
