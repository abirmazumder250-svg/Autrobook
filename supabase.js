// ============================================================
// SUPABASE IMAGE UPLOAD SERVICE
// ============================================================

const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';
const STORAGE_BUCKET = 'images';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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
 * Uploads an image file to the 'images' bucket in Supabase Storage.
 * @param {File} file
 * @returns {Promise<string|null>}
 */
async function uploadToSupabase(file) {
  if (!file) return null;

  if (!file.type || !file.type.startsWith('image/')) {
    alert('Please select a valid image file.');
    return null;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    alert('Image size must be 5 MB or less.');
    return null;
  }

  const safeName = (file.name || 'upload')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .slice(-80);
  const fileName = `${Date.now()}-${safeName}`;

  try {
    const client = getSupabaseClient();

    // Optional: ensure user has an active session before uploading
    const { data: { session } } = await client.auth.getSession();
    if (!session || !session.user) {
      alert('Please log in first to upload an image.');
      return null;
    }

    const objectPath = `${session.user.id}/${fileName}`;

    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(objectPath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      alert('Image upload failed: ' + error.message);
      return null;
    }

    const { data: urlData } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(objectPath);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Network or SDK Error:', err);
    alert(err?.message || 'Network error while uploading image. Please check your connection.');
    return null;
  }
}
