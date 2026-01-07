import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'journey-uploads';

/**
 * Uploads a file (base64 data URI or Blob) to Supabase Storage
 * Returns the public URL
 * Files are stored in user-specific folders for RLS enforcement
 */
export async function uploadToStorage(
  dataOrBlob: string | Blob,
  fileName: string,
  isVideo = false
): Promise<string | null> {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Storage upload error: User not authenticated');
      return null;
    }

    let blob: Blob;

    if (typeof dataOrBlob === 'string') {
      // Convert data URI to blob
      const response = await fetch(dataOrBlob);
      blob = await response.blob();
    } else {
      blob = dataOrBlob;
    }

    // Generate unique file path scoped to user
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const extension = isVideo ? 'mp4' : 'jpg';
    // Store files in user-specific folder for RLS
    const filePath = `${user.id}/${timestamp}-${randomId}-${fileName}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: isVideo ? 'video/mp4' : 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log('Uploaded to storage:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload to storage:', err);
    return null;
  }
}

/**
 * Deletes a file from Supabase Storage by its public URL
 * Only the file owner can delete their files
 */
export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Storage delete error: User not authenticated');
      return false;
    }

    // Extract file path from public URL
    const urlParts = publicUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];
    
    // Verify the file belongs to the user (path starts with user ID)
    if (!filePath.startsWith(user.id)) {
      console.error('Storage delete error: Cannot delete files owned by other users');
      return false;
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to delete from storage:', err);
    return false;
  }
}
