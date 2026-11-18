async function loadPosts(){
  const { data: posts } = await supabase.from('posts').select('*, profiles(full_name, avatar_url)').order('created_at',{ascending:false})
  const container = document.getElementById('post-section')

  if(!posts || !posts.length){
    container.innerHTML = `<div class="card" style="text-align:center;color:var(--secondary-text)">No posts yet. Be the first to post!</div>`
    return
  }

  container.innerHTML = posts.map((post,i) => `
    <div class="card">
      <div class="post-header">
        <img src="${post.profiles?.avatar_url || 'https://i.pravatar.cc/80?img=12'}">
        <div><b>${post.profiles?.full_name || ''}</b><div class="post-meta">${new Date(post.created_at).toLocaleString()} · 🌍</div></div>
        <span class="more">•••</span><span class="close" onclick="this.closest('.card').remove()">✕</span>
      </div>
      <div class="post-text">${post.content || ''}</div>
      ${post.image_url ? `<img class="post-image" src="${post.image_url}">` : ''}
      <div class="post-stats"><span>👍 ${post.likes_count || 0}</span><span>${post.comments_count || 0} comments</span></div>
      <div class="post-actions">
        <button onclick="this.classList.toggle('liked')">👍 Like</button>
        <button onclick="sharePost()">↗ Share</button>
      </div>
      <div id="text-comments-${i}"></div>
      <div id="voice-comments-${i}"></div>
      <div class="comment-box">
        <img class="avatar" src="${post.profiles?.avatar_url || 'https://i.pravatar.cc/80?img=12'}">
        <input id="input-${i}" placeholder="Write a comment...">
        <button class="btn-green" onclick="toggleVoice('${post.id}','voice-comments-${i}',this)">🎤</button>
        <button class="btn-green" onclick="sendTextComment('${post.id}','input-${i}','text-comments-${i}')">Send</button>
      </div>
    </div>
  `).join('')

  posts.forEach((post,i)=>{
    loadTextComments(post.id, `text-comments-${i}`)
    loadVoiceComments(post.id, `voice-comments-${i}`)
  })
  loadPeopleYouMayKnow()
}
function sharePost(){ alert('Post shared!') }
