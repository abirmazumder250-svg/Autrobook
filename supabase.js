// supabase.js - Only for Images
const SUPABASE_URL = 'https://gemyqaniztqrsilaybtx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to upload image
async function uploadToSupabase(file) {
  const fileName = Date.now() + '-' + file.name;
  const { data, error } = await supabaseClient.storage.from('images').upload(fileName, file);
  if (error) {
    console.log(error);
    return null;
  }
  const { data: urlData } = supabaseClient.storage.from('images').getPublicUrl(fileName);
  return urlData.publicUrl;
}
