async function loadFriendRequests(){
  const { data: { user } } = await supabase.auth.getUser()
  if(!user) return

  // 1. INCOMING - Who sent request TO me - SHOW THEIR PHOTO
  const { data: incoming } = await supabase.from('friend_requests')
    .select('*, profiles!friend_requests_sender_id_fkey(id, full_name, avatar_url)')
    .eq('receiver_id', user.id).eq('status', 'pending')

  // 2. OUTGOING - I sent request - SHOW THEIR PHOTO
  const { data: outgoing } = await supabase.from('friend_requests')
    .select('*, profiles!friend_requests_receiver_id_fkey(id, full_name, avatar_url)')
    .eq('sender_id', user.id).eq('status', 'pending')

  // 3. FRIENDS - SHOW THEIR PHOTO
  const { data: friends } = await supabase.from('friend_requests')
    .select('*, profiles!friend_requests_receiver_id_fkey(id, full_name, avatar_url)')
    .eq('sender_id', user.id).eq('status', 'accepted')

  let html = ''

  // INCOMING
  html += `<h3 style="margin:12px 0;">Friend Requests</h3>`
  if(!incoming || !incoming.length){
    html += `<div class="card" style="text-align:center;color:var(--secondary-text)">No new friend requests</div>`
  } else {
    html += incoming.map(f => {
      const photo = f.profiles?.avatar_url || 'https://i.pravatar.cc/80?img=12'
      return `
      <div class="friend-card">
        <img src="${photo}" onerror="this.src='https://i.pravatar.cc/80?img=12'" onclick="window.location.href='profile.html?id=${f.profiles?.id || ''}'">
        <div><b>${f.profiles?.full_name || ''}</b><p style="color:var(--secondary-text);font-size:13px;">Sent you a friend request</p></div>
        <div class="actions">
          <button class="btn-green" onclick="acceptRequest('${f.id}', this)">Confirm</button>
          <button class="btn-gray" onclick="deleteRequest('${f.id}', this)">Delete</button>
        </div>
      </div>`
    }).join('')
  }

  // OUTGOING
  html += `<h3 style="margin:20px 0 12px;">Sent Requests</h3>`
  if(!outgoing || !outgoing.length){
    html += `<div class="card" style="text-align:center;color:var(--secondary-text)">You haven't sent any requests</div>`
  } else {
    html += outgoing.map(f => {
      const photo = f.profiles?.avatar_url || 'https://i.pravatar.cc/80?img=12'
      return `
      <div class="friend-card">
        <img src="${photo}" onerror="this.src='https://i.pravatar.cc/80?img=12'">
        <div><b>${f.profiles?.full_name || ''}</b><p style="color:var(--secondary-text);font-size:13px;">Request pending</p></div>
        <div class="actions"><button class="btn-gray" onclick="cancelRequest('${f.id}', this)">Cancel Request</button></div>
      </div>`
    }).join('')
  }

  // FRIENDS
  html += `<h3 style="margin:20px 0 12px;">Friends</h3>`
  if(!friends || !friends.length){
    html += `<div class="card" style="text-align:center;color:var(--secondary-text)">No friends yet</div>`
  } else {
    html += friends.map(f => {
      const photo = f.profiles?.avatar_url || 'https://i.pravatar.cc/80?img=12'
      return `
      <div class="friend-card">
        <img src="${photo}" onerror="this.src='https://i.pravatar.cc/80?img=12'">
        <div><b>${f.profiles?.full_name || ''}</b></div>
        <div class="actions"><button class="btn-gray" onclick="unfriend('${f.id}', this)">Unfriend</button></div>
      </div>`
    }).join('')
  }

  document.getElementById('friend-list').innerHTML = html
}

async function acceptRequest(id, btn){
  await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', id)
  btn.innerText = 'Accepted'; btn.disabled = true
  loadFriendRequests()
}
async function deleteRequest(id, btn){
  await supabase.from('friend_requests').delete().eq('id', id)
  btn.closest('.friend-card').remove()
}
async function cancelRequest(id, btn){
  await supabase.from('friend_requests').delete().eq('id', id)
  btn.closest('.friend-card').remove()
}
async function unfriend(id, btn){
  if(!confirm('Unfriend this person?')) return
  await supabase.from('friend_requests').delete().eq('id', id)
  btn.closest('.friend-card').remove()
}
loadFriendRequests()
