// ============================================================
// SUPABASE IMAGE UPLOAD SERVICE
// ============================================================

const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';
const STORAGE_BUCKET = 'images';

let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Supabase SDK is not loaded on this page.');
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabaseClient;
}

/**
 * Uploads a file to the 'images' bucket in Supabase Storage.
 * @param {File} file - The file object from an <input type="file">
 * @returns {Promise<string|null>} - Returns the Public URL of the uploaded image, or null if failed.
 */
async function uploadToSupabase(file) {
  if (!file) return null;

  const safeName = (file.name || 'upload').replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const fileName = `${Date.now()}-${safeName}`;

  try {
    const client = getSupabaseClient();

    // 1. Upload the file to the 'images' bucket
    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      alert('Image upload failed: ' + error.message);
      return null;
    }

    // 2. Get the Public URL for the uploaded file
    const { data: urlData } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Network or SDK Error:', err);
    alert(err?.message || 'Network error while uploading image. Please check your connection.');
    return null;
  }
}
