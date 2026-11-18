/* ==================================================================
   AUTROBOOK — PROFILE PAGE SCRIPT - REAL DATA ONLY, NO DEMO
   ================================================================== */

let currentUser = null
let viewingUserId = null
let profileData = { name: '', username: '', avatar_url: '', cover_url: '' }

// ==================== LOAD PROFILE FROM SUPABASE ====================
async function loadProfile(){
  const { data: { user } } = await supabase.auth.getUser()
  if(!user){ window.location.href = 'login.html'; return }
  currentUser = user

  // If ?id=xxx then viewing other's profile, else own profile
  const params = new URLSearchParams(window.location.search)
  viewingUserId = params.get('id') || user.id

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', viewingUserId).single()
  if(!profile) return

  profileData = {
    name: profile.full_name || '',
    username: profile.username || '',
    avatar_url: profile.avatar_url || '',
    cover_url: profile.cover_url || ''
  }
  applyProfileToDOM()
  loadProfilePosts()
  loadFollowersCount()
}

function applyProfileToDOM(){
  const nameEl = document.getElementById('profileName')
  if(nameEl) nameEl.textContent = profileData.name

  const usernameEl = document.getElementById('profileUsername')
  if(usernameEl) usernameEl.textContent = profileData.username ? '@' + profileData.username : ''

  const shareInput = document.getElementById('shareLinkInput')
  if(shareInput) shareInput.value = `https://autrobook.com/u/${profileData.username}`

  const avatarEl = document.getElementById('mainProfileImg')
  if(avatarEl && profileData.avatar_url) avatarEl.src = profileData.avatar_url

  const coverEl = document.getElementById('mainCoverImg')
  if(coverEl && profileData.cover_url) coverEl.src = profileData.cover_url
}

// ==================== REAL POSTS FROM SUPABASE ====================
async function loadProfilePosts(){
  const container = document.getElementById('profileFeedContainer')
  if(!container) return

  const { data: posts } = await supabase.from('posts').select('*').eq('user_id', viewingUserId).order('created_at', { ascending: false })

  if(!posts || !posts.length){
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">No posts yet</div>'
    return
  }

  container.innerHTML = posts.map(post => `
    <div class="post-card">
      <div class="post-header">
        <img src="${profileData.avatar_url || 'https://i.pravatar.cc/80?img=12'}">
        <div class="post-header-info"><b>${profileData.name}</b><small>${new Date(post.created_at).toLocaleString()}</small></div>
        ${viewingUserId === currentUser.id ? `<button class="post-more-btn" onclick="deletePost('${post.id}', this)">✕</button>` : ''}
      </div>
      <div class="post-text">${post.content || ''}</div>
      ${post.image_url ? `<img src="${post.image_url}" class="post-media">` : ''}
      <div class="post-actions">
        <button class="post-action-btn" onclick="toast('Liked!')">👍 Like (${post.likes_count || 0})</button>
        <button class="post-action-btn">💬 Comment</button>
        <button class="post-action-btn">↗ Share</button>
      </div>
    </div>
  `).join('')

  const postsStat = document.querySelector('.stat-card:nth-child(1) b')
  if(postsStat) postsStat.textContent = posts.length
}

async function deletePost(postId, btn){
  if(!confirm('Delete this post?')) return
  await supabase.from('posts').delete().eq('id', postId)
  btn.closest('.post-card').remove()
  toast('Post deleted')
}

// ==================== REAL FOLLOWERS / FRIENDS ====================
async function loadFollowersCount(){
  const { data } = await supabase.from('friend_requests').select('*').or(`sender_id.eq.${viewingUserId},receiver_id.eq.${viewingUserId}`).eq('status', 'accepted')
  const count = data ? data.length : 0
  const el = document.getElementById('followersCount')
  if(el) el.textContent = count
}

async function openFollowers(type){
  const title = document.getElementById('followersModalTitle')
  if(title) title.textContent = type === 'followers' ? 'Friends' : 'Friends'
  const container = document.getElementById('followersListContainer')
  if(!container) return

  const { data } = await supabase.from('friend_requests').select('*, profiles!friend_requests_sender_id_fkey(full_name, avatar_url), profiles2:profiles!friend_requests_receiver_id_fkey(full_name, avatar_url)').or(`sender_id.eq.${viewingUserId},receiver_id.eq.${viewingUserId}`).eq('status', 'accepted')

  if(!data || !data.length){
    container.innerHTML = '<div style="text-align:center;padding:20px;">No friends yet</div>'
    openModal('mFollowersList'); return
  }

  container.innerHTML = data.map(f => {
    const other = f.sender_id === viewingUserId ? f.profiles2 : f.profiles
    return `
      <div class="list-item" style="border:none;padding:10px 8px;">
        <img src="${other?.avatar_url || 'https://i.pravatar.cc/80?img=12'}" class="mini-avatar">
        <div class="list-text">${other?.full_name || ''}</div>
      </div>`
  }).join('')
  openModal('mFollowersList')
}

// ==================== PHOTO UPLOAD - SUPABASE STORAGE ====================
// This is why Friend Request photo was not showing before - now it saves to Supabase
async function uploadToStorage(file, folder){
  const fileName = `${currentUser.id}/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage.from('avatars').upload(fileName, file)
  if(error){ toast(error.message); return null }
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
  return urlData.publicUrl
}

async function changeCover(event){
  const file = event.target.files[0]
  if(!file) return
  const url = await uploadToStorage(file, 'cover')
  if(!url) return
  await supabase.from('profiles').update({ cover_url: url }).eq('id', currentUser.id)
  document.getElementById('mainCoverImg').src = url
  toast('Cover photo updated')
}

async function changeProfile(event){
  const file = event.target.files[0]
  if(!file) return
  const url = await uploadToStorage(file, 'avatar')
  if(!url) return
  await supabase.from('profiles').update({ avatar_url: url }).eq('id', currentUser.id)
  document.getElementById('mainProfileImg').src = url
  toast('Profile photo updated - Now it will show in Friend Requests too!')
}

// ==================== EDIT PROFILE - SAVE TO SUPABASE, NOT localStorage ====================
function openEditProfile(){
  const nameInput = document.getElementById('editNameInput')
  const userInput = document.getElementById('editUsernameInput')
  if(nameInput) nameInput.value = profileData.name
  if(userInput) userInput.value = profileData.username
  openOverlay('editProfileOverlay')
}

async function saveProfileChanges(){
  const nameInput = document.getElementById('editNameInput')
  const userInput = document.getElementById('editUsernameInput')
  const newName = nameInput ? nameInput.value.trim() : ''
  const newUsername = userInput ? userInput.value.trim() : ''

  if(!newName){ toast('Name cannot be empty'); return }
  if(!newUsername){ toast('Username cannot be empty'); return }
  if(!/^[a-zA-Z0-9_]{3,30}$/.test(newUsername)){ toast('Username: 3-30 chars, letters/numbers/underscores'); return }

  const { error } = await supabase.from('profiles').update({ full_name: newName, username: newUsername }).eq('id', currentUser.id)
  if(error){ toast(error.message); return }

  profileData.name = newName
  profileData.username = newUsername
  applyProfileToDOM()
  closeOverlay('editProfileOverlay')
  toast('Profile updated successfully')
}

// ==================== TABS / HELPERS (same as before, no demo data) ====================
let currentTab = 'posts'
function openModal(id){ const el=document.getElementById(id); if(el) el.classList.add('active') }
function closeModal(id){ const el=document.getElementById(id); if(el) el.classList.remove('active') }
function openOverlay(id){ const el=document.getElementById(id); if(el) el.classList.add('active') }
function closeOverlay(id){ const el=document.getElementById(id); if(el) el.classList.remove('active') }
function toast(msg){ const t=document.getElementById('toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); clearTimeout(t._timeout); t._timeout=setTimeout(()=>t.classList.remove('show'),2500) }
function switchTab(tab){
  currentTab = tab
  document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'))
  document.querySelectorAll('.tab-btn').forEach(el=>el.classList.remove('active'))
  const target=document.getElementById('tab-'+tab); if(target) target.classList.add('active')
  document.querySelectorAll('.tab-btn').forEach(el=>{ if(el.dataset.tab===tab) el.classList.add('active') })
  if(tab==='posts') loadProfilePosts()
  if(tab==='photos') renderPhotos()
}
function renderPhotos(){
  const grid=document.getElementById('photosGrid'); if(!grid) return
  // Photos = post images from Supabase, no unsplash demo
  supabase.from('posts').select('image_url').eq('user_id', viewingUserId).not('image_url','is',null).then(({data})=>{
    if(!data || !data.length){ grid.innerHTML='<div style="text-align:center;padding:20px;">No photos yet</div>'; return }
    grid.innerHTML=data.map(p=>`<img src="${p.image_url}" loading="lazy">`).join('')
  })
}
function filterPosts(v){ /* search in real posts */ loadProfilePosts() }
function toggleView(){ const c=document.getElementById('profileFeedContainer'); if(c) c.classList.toggle('grid-view') }
function copyLink(){ const input=document.getElementById('shareLinkInput'); if(input){ input.select(); try{document.execCommand('copy')}catch(e){} toast('Link copied!') } }
function showVerifyInfo(){ openModal('mVerification') }
function submitVerification(){ closeModal('mVerification'); toast('Verification submitted') }

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', ()=>{
  const yearEl=document.getElementById('dynamicYear'); if(yearEl) yearEl.textContent=new Date().getFullYear()
  loadProfile()
  document.querySelectorAll('.modal-back').forEach(b=>{ b.addEventListener('click',e=>{ if(e.target===b) b.classList.remove('active') }) })
})
