import { supabase } from './client';

export async function uploadFloorPlan(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const { error: uploadError } = await supabase.storage
    .from('floorplans')
    .upload(fileName, buffer, { contentType });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('floorplans').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function getFloorPlanUrl(fileName: string): Promise<string> {
  const { data } = supabase.storage.from('floorplans').getPublicUrl(fileName);
  return data.publicUrl;
}
