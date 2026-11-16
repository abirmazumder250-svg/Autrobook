function toast(m){
  var t = document.getElementById('toast');
  t.innerText = m;
  t.style.display = 'block';
  setTimeout(function(){ t.style.display = 'none'; }, 2500);
}

function postMissingAlert(){
  var name = document.getElementById('missName').value.trim();
  var desc = document.getElementById('missDesc').value.trim();
  var loc = document.getElementById('missLoc').value.trim();
  var phone = document.getElementById('missPhone').value.trim();
  var photoFile = document.getElementById('missPhoto').files[0];

  if(!name || !loc || !phone){
    return toast('Please fill in name, location, and phone number!');
  }

  // Processing photo via FileReader to store image safely
  if(photoFile){
    var reader = new FileReader();
    reader.onload = function(e){
      saveAndBroadcastAlert(name, desc, loc, phone, e.target.result);
    };
    reader.readAsDataURL(photoFile);
  } else {
    saveAndBroadcastAlert(name, desc, loc, phone, null);
  }
}

function saveAndBroadcastAlert(name, desc, loc, phone, photoBase64){
  var alertData = {
    id: Date.now(),
    name: name,
    desc: desc,
    location: loc,
    phone: phone,
    photo: photoBase64,
    date: new Date().toLocaleString()
  };

  // 1. Saving to local storage list
  var alerts = [];
  try { alerts = JSON.parse(localStorage.getItem('ab_missing_alerts') || '[]'); } catch(e) { alerts = []; }
  alerts.unshift(alertData);
  localStorage.setItem('ab_missing_alerts', JSON.stringify(alerts));

  // 2. Broadcasting as a post to Autrobook Feed with "Suggested for You" badge
  var feedPost = {
    id: Date.now(),
    author: '🚨 MISSING PERSON EMERGENCY ALERT',
    time: 'Just now • Suggested for You',
    badge: 'Suggested for You',
    content: 'URGENT ASSISTANCE NEEDED!\n\nMissing Person: ' + name + '\nDetails: ' + (desc || 'N/A') + '\nLast Seen At: ' + loc + '\n\nIf you have any information, please contact immediately: ' + phone,
    image: photoBase64,
    type: 'missing_alert',
    likes: 0,
    comments: []
  };

  var feedPosts = [];
  try { feedPosts = JSON.parse(localStorage.getItem('ab_posts') || '[]'); } catch(e) { feedPosts = []; }
  feedPosts.unshift(feedPost);
  localStorage.setItem('ab_posts', JSON.stringify(feedPosts));

  toast('Missing alert broadcasted to Autrobook Feed successfully! 🚨');
  setTimeout(function(){ renderActiveAlerts(); document.querySelector('.card').reset(); }, 1000);
}

function renderActiveAlerts(){
  var alerts = [];
  try { alerts = JSON.parse(localStorage.getItem('ab_missing_alerts') || '[]'); } catch(e) { alerts = []; }
  
  var html = alerts.length ? alerts.map(function(a){
    return '<div class="alert-box">' +
      '<span class="suggested-badge">Suggested for You • Emergency</span>' +
      '<h4 style="color:#fff; margin-top:4px;">' + a.name + '</h4>' +
      '<p style="font-size:12px; color:var(--text2); margin:4px 0;"><b>Details:</b> ' + (a.desc || 'None') + '</p>' +
      '<p style="font-size:12px; color:var(--text2); margin:4px 0;"><b>Last Seen:</b> ' + a.location + '</p>' +
      (a.photo ? '<img src="' + a.photo + '" style="width:100%; max-height:150px; object-fit:cover; border-radius:8px; margin:8px 0;">' : '') +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">' +
      '<span style="font-size:11px; color:var(--text2);">' + a.date + '</span>' +
      '<a href="tel:' + a.phone + '" style="background:var(--danger); color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:12px; font-weight:bold;">📞 Call ' + a.phone + '</a>' +
      '</div></div>';
  }).join('') : '<p style="text-align:center; color:var(--text2); padding:20px;">No active missing alerts.</p>';

  var listEl = document.getElementById('activeAlertsList');
  if(listEl) listEl.innerHTML = html;
}

renderActiveAlerts();
