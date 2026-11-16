function toast(m){
  var t=document.getElementById('toast');
  t.innerText=m;
  t.style.display='block';
  setTimeout(function(){t.style.display='none'},2500);
}

function submitBloodRequest(){
  var name=document.getElementById('recName').value.trim();
  var address=document.getElementById('recAddress').value.trim();
  var group=document.getElementById('recGroup').value;
  var phone=document.getElementById('recPhone').value.trim();
  
  var frontFile=document.getElementById('recNidFront').files[0];
  var backFile=document.getElementById('recNidBack').files[0];

  if(!name || !address || !phone) {
    return toast('Please fill in Name, Address, and Phone Number!');
  }
  
  if(!frontFile || !backFile) {
    return toast('Please upload NID Front and Back pictures for verification!');
  }

  // FileReader দিয়ে গ্যালারি থেকে সিলেক্ট করা NID ছবিগুলো প্রসেস করা হচ্ছে
  var readerFront = new FileReader();
  readerFront.onload = function(e1){
    var frontBase64 = e1.target.result;
    
    var readerBack = new FileReader();
    readerBack.onload = function(e2){
      var backBase64 = e2.target.result;

      var requestData = {
        id: Date.now(),
        name: name,
        address: address,
        group: group,
        phone: phone,
        nidFront: frontBase64,
        nidBack: backBase64,
        date: new Date().toLocaleDateString()
      };

      // লোকালস্টোরেজে রিকোয়েস্ট সেইভ করা এবং ম্যাচিং ডোনার খুঁজে বের করা
      var requests = [];
      try{ requests = JSON.parse(localStorage.getItem('ab_blood_requests')||'[]'); }catch(e){ requests = []; }
      requests.unshift(requestData);
      localStorage.setItem('ab_blood_requests', JSON.stringify(requests));

      toast('Blood request submitted successfully! Finding matching donors...');
      
      // ম্যাচিং ডোনার ফিল্টার করে নিচে লিস্ট দেখানো
      showMatchingDonors(group);
    };
    readerBack.readAsDataURL(backFile);
  };
  readerFront.readAsDataURL(frontFile);
}

function showMatchingDonors(requiredGroup){
  var donors = [];
  try{ donors = JSON.parse(localStorage.getItem('ab_donors')||'[]'); }catch(e){ donors = []; }
  
  var matched = donors.filter(function(d){ return d.group === requiredGroup; });

  var container = document.getElementById('matchingResult');
  var html = '<h3 style="color:var(--brand);margin-bottom:10px;">Matching Donors (' + requiredGroup + ')</h3>';
  
  if(matched.length > 0){
    html += matched.map(function(d){
      return '<div class="donor-card"><div><b>' + d.name + '</b><small style="display:block;color:var(--text2)">Location: ' + d.location + ' | Verified ✓</small></div><a class="call-btn" href="tel:' + d.phone + '">📞 Call</a></div>';
    }).join('');
  } else {
    html += '<p style="color:var(--text2);background:var(--card);padding:14px;border-radius:10px;border:1px solid var(--border);">No donors found right now for ' + requiredGroup + '. Your request has been listed in the blood bank.</p>';
  }
  
  container.innerHTML = html;
}
