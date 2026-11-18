async function loadStories(){
  const { data: { user } } = await supabase.auth.getUser()
  let myAvatar = 'https://i.pravatar.cc/80?img=12'

  if(user){
    const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
    if(profile?.avatar_url) myAvatar = profile.avatar_url
  }

  // 1. Your story - only logged in user, no fake name
  let html = `
    <div class="story-card" onclick="addStory()">
      <img src="${myAvatar}">
      <div class="story-gradient"></div>
      <img class="story-avatar my-story-avatar" src="${myAvatar}">
      <div class="story-plus">+</div>
      <div class="story-user">Your story</div>
    </div>`

  // 2. Real stories from Supabase - no demo names
  const { data: stories } = await supabase.from('stories').select('*, profiles(full_name, avatar_url)').order('created_at', { ascending: false })

  if(stories && stories.length){
    html += stories.map(s => `
      <div class="story-card">
        <img src="${s.image_url}">
        <div class="story-gradient"></div>
        <img class="story-avatar" src="${s.profiles?.avatar_url || 'https://i.pravatar.cc/80?img=12'}">
        <div class="story-user">${s.profiles?.full_name || ''}</div>
      </div>
    `).join('')
  }

  document.getElementById('story-section').innerHTML = html
}
function addStory(){
  const file = prompt('Paste image URL for your story')
  if(file) alert('Story upload code will be added here')
}
loadStories()
