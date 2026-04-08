import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const IMAGE_BUCKET = "recipe-images";

export async function uploadRecipeImage(
  file: File,
  userId: string,
): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return null;
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteRecipeImage(
  imageUrl: string | null | undefined,
): Promise<void> {
  if (!imageUrl) return;
  const marker = `/object/public/${IMAGE_BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return;
  await supabase.storage
    .from(IMAGE_BUCKET)
    .remove([imageUrl.slice(idx + marker.length)]);
}
