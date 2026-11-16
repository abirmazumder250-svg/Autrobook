// ============================================================
// SUPABASE IMAGE UPLOAD SERVICE
// ============================================================

// Corrected URL and Key based on your Supabase Project
const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';

// Initialize Supabase Client (Make sure the Supabase SDK is loaded in your HTML)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Uploads a file to the 'images' bucket in Supabase Storage.
 * @param {File} file - The file object from an <input type="file">
 * @returns {Promise<string|null>} - Returns the Public URL of the uploaded image, or null if failed.
 */
async function uploadToSupabase(file) {
  if (!file) return null;
  
  // Create a unique filename (Timestamp + Sanitized original name)
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  
  try {
    // 1. Upload the file to the 'images' bucket
    const { data, error } = await supabaseClient.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false // Prevents overwriting existing files
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      alert('Image upload failed: ' + error.message);
      return null;
    }
    
    // 2. Get the Public URL for the uploaded file
    const { data: urlData } = supabaseClient.storage
      .from('images')
      .getPublicUrl(fileName);
      
    return urlData.publicUrl;
    
  } catch (err) {
    console.error('Network or Server Error:', err);
    alert('Network error while uploading image. Please check your connection.');
    return null;
  }
}
