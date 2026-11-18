async function loadFriendRequests(){
  const { data: { user } } = await supabase.auth.getUser()
  if(!user) return

  const listEl = document.getElementById('friend-list')
  if(listEl) listEl.innerHTML = `<div class="card" style="text-align:center;">Loading...</div>`

  // 1. INCOMING - Who sent TO me
  const { data: incoming, error: err1 } = await supabase.from('friend_requests')
    .select('*')
    .eq('receiver_id', user.id).eq('status', 'pending')
    .order('created_at', { ascending: false })

  // 2. OUTGOING - I sent
  const { data: outgoing } = await supabase.from('friend_requests')
    .select('*')
    .eq('sender_id', user.id).eq('status', 'pending')
    .order('created_at', { ascending: false })

  // 3. FRIENDS - BOTH SIDES - This is the main fix
  const { data: friends } = await supabase.from('friend_requests')
    .select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })

  if(err1){
    console.log('Friend load error:', err1.message)
    if(listEl) listEl.innerHTML = `<div class="card">Error: ${err1.message}</div>`
    return
  }

  // Get all profile IDs we need
  const allIds = new Set()
  ;(incoming||[]).forEach(f => allIds.add(f.sender_id))
  ;(outgoing||[]).forEach(f => allIds.add(f.receiver_id))
  ;(friends||[]).forEach(f => {
    allIds.add(f.sender_id)
    allIds.add(f.receiver_id)
  })
  allIds.delete(user.id)

  // Fetch profiles in ONE query - No FK join problem
  let profilesMap = {}
  if(allIds.size > 0){
    const { data: profiles } = await supabase.from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', [...allIds])
    ;(profiles||[]).forEach(p => profilesMap[p.id] = p)
  }

  const getPhoto = (id) => profilesMap[id]?.avatar_url || 'https://i.pravatar.cc/80?img=12'
  const getName = (id) => profilesMap[id]?.full_name || 'User'

  let html = ''

  // INCOMING
  html += `<h3 style="margin:12px 0;">Friend Requests</h3>`
  if(!incoming || !incoming.length){
    html += `<div class="card" style="text-align:center;color:var(--secondary-text)">No new friend requests</div>`
  } else {
    html += incoming.map(f => {
      const otherId = f.sender_id
      const photo = getPhoto(otherId)
      const name = getName(otherId)
      return `
      <div class="friend-card">
        <img src="${photo}" onerror="this.src='https://i.pravatar.cc/80?img=12'" onclick="window.location.href='profile.html?id=${otherId}'" style="cursor:pointer;">
        <div><b>${name}</b><p style="color:var(--secondary-text);font-size:13px;">Sent you a friend request</p></div>
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
      const otherId = f.receiver_id
      const photo = getPhoto(otherId)
      const name = getName(otherId)
      return `
      <div class="friend-card">
        <img src="${photo}" onerror="this.src='https://i.pravatar.cc/80?img=12'" onclick="window.location.href='profile.html?id=${otherId}'" style="cursor:pointer;">
        <div><b>${name}</b><p style="color:var(--secondary-text);font-size:13px;">Request pending</p></div>
        <div class="actions"><button class="btn-gray" onclick="cancelRequest('${f.id}', this)">Cancel Request</button></div>
      </div>`
    }).join('')
  }

  // FRIENDS - Fixed: Shows both sides
  html += `<h3 style="margin:20px 0 12px;">Friends (${friends?.length || 0})</h3>`
  if(!friends || !friends.length){
    html += `<div class="card" style="text-align:center;color:var(--secondary-text)">No friends yet</div>`
  } else {
    html += friends.map(f => {
      // If I am sender, friend is receiver. If I am receiver, friend is sender.
      const otherId = f.sender_id === user.id ? f.receiver_id : f.sender_id
      const photo = getPhoto(otherId)
      const name = getName(otherId)
      return `
      <div class="friend-card">
        <img src="${photo}" onerror="this.src='https://i.pravatar.cc/80?img=12'" onclick="window.location.href='profile.html?id=${otherId}'" style="cursor:pointer;">
        <div><b>${name}</b><p style="color:var(--secondary-text);font-size:13px;">Friend</p></div>
        <div class="actions"><button class="btn-gray" onclick="unfriend('${f.id}', this)">Unfriend</button></div>
      </div>`
    }).join('')
  }

  if(listEl) listEl.innerHTML = html
}

async function acceptRequest(id, btn){
  if(btn.disabled) return
  btn.disabled = true
  btn.innerText = 'Accepting...'
  const { error } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', id)
  if(error){
    alert(error.message)
    btn.disabled = false
    btn.innerText = 'Confirm'
    return
  }
  loadFriendRequests()
}

async function deleteRequest(id, btn){
  if(btn.disabled) return
  btn.disabled = true
  const { error } = await supabase.from('friend_requests').delete().eq('id', id)
  if(error){ alert(error.message); return }
  loadFriendRequests()
}

async function cancelRequest(id, btn){
  if(btn.disabled) return
  btn.disabled = true
  const { error } = await supabase.from('friend_requests').delete().eq('id', id)
  if(error){ alert(error.message); return }
  loadFriendRequests()
}

async function unfriend(id, btn){
  if(!confirm('Unfriend this person?')) return
  const { error } = await supabase.from('friend_requests').delete().eq('id', id)
  if(error){ alert(error.message); return }
  loadFriendRequests()
}

loadFriendRequests()
