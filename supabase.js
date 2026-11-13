// supabase.js - For Image Upload to Supabase Storage

const SUPABASE_URL = 'https://gemyqaniztqrsilaybtx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';

// Create Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to upload image to 'images' bucket
async function uploadToSupabase(file) {
  if (!file) return null;
  
  const fileName = Date.now() + '-' + file.name.replace(/\s/g, '_'); // space remove
  
  const { data, error } = await supabaseClient.storage
    .from('images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Supabase Upload Error:', error);
    alert('Image upload failed: ' + error.message);
    return null;
  }
  
  // Get Public URL
  const { data: urlData } = supabaseClient.storage
    .from('images')
    .getPublicUrl(fileName);
    
  return urlData.publicUrl;
}
