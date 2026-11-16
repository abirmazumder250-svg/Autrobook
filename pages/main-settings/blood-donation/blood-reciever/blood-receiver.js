function toast(m){
  var t=document.getElementById('toast');
  t.innerText=m;
  t.style.display='block';
  setTimeout(function(){t.style.display='none'},2500);
}

function submitReceiverRequest(){
  var name=document.getElementById('recName').value.trim();
  var address=document.getElementById('recAddress').value.trim();
  var group=document.getElementById('recGroup').value;
  var phone=document.getElementById('recPhone').value.trim();
  
  var frontFile=document.getElementById('recNidFront').files[0];
  var backFile=document.getElementById('recNidBack').files[0];

  if(!name || !address || !phone){
    return toast('Please fill in name, address, and phone number!');
  }
  if(!frontFile || !backFile){
    return toast('Please upload NID Front and Back pictures from gallery!');
  }

  // FileReader দিয়ে NID ছবিগুলো Base64 এ রূপান্তর করা হচ্ছে
  var readerFront = new FileReader();
  readerFront.onload = function(e1){
    var frontBase64 = e1.target.result;
    
    var readerBack = new FileReader();
    readerBack.onload = function(e2){
      var backBase64 = e2.target.result;

      var receiverData = {
        id: Date.now(),
        name: name,
        address: address,
        group: group,
        phone: phone,
        nidFront: frontBase64,
        nidBack: backBase64,
        date: new Date().toLocaleDateString()
      };

      // লোকালস্টোরেজে রিকোয়েস্ট সেইভ করা
      var requests=[];
      try{requests=JSON.parse(localStorage.getItem('ab_blood_requests')||'[]');}catch(e){requests=[];}
      requests.unshift(receiverData);
      localStorage.setItem('ab_blood_requests',JSON.stringify(requests));

      // এছাড়াও Autrobook Feed-এ পোস্ট হিসেবে ব্রডকাস্ট করার ব্যবস্থা
      var feedPost = {
        id: Date.now(),
        author: '🩸 URGENT BLOOD REQUEST',
        time: 'Just now',
        content: 'URGENT BLOOD NEEDED!\n\nPatient Name: ' + name + '\nBlood Group: ' + group + '\nLocation: ' + address + '\nContact Phone: ' + phone + '\n\nPlease contact immediately if you can donate!',
        type: 'blood_request',
        likes: 0,
        comments: []
      };

      var feedPosts=[];
      try{feedPosts=JSON.parse(localStorage.getItem('ab_posts')||'[]');}catch(e){feedPosts=[];}
      feedPosts.unshift(feedPost);
      localStorage.setItem('ab_posts',JSON.stringify(feedPosts));

      toast('Blood request broadcasted successfully! 🚨');
      setTimeout(function(){history.back();},1200);
    };
    readerBack.readAsDataURL(backFile);
  };
  readerFront.readAsDataURL(frontFile);
}

// ডোনার খোঁজার ফিল্টার ফাংশন
function filterDonors(){
  var sg=document.getElementById('searchGroup').value;
  var donors=[];
  try{donors=JSON.parse(localStorage.getItem('ab_donors')||'[]');}catch(e){donors=[];}

  if(sg){
    donors=donors.filter(function(d){return d.group===sg;});
  }

  var html=donors.length ? donors.map(function(d){
    return '<div class="donor-card"><div><b>'+d.name+'</b><small style="display:block;color:var(--text2)">Group: <span style="color:var(--brand);font-weight:bold">'+d.group+'</span> | Location: '+d.location+'</small></div><a class="call-btn" href="tel:'+d.phone+'">📞 Call</a></div>';
  }).join('') : '<p style="text-align:center;color:var(--text2);padding:15px">No verified donors found.</p>';

  document.getElementById('donorResults').innerHTML=html;
}

// পেজ লোড হওয়ার সাথে সাথে সব ডোনারদের দেখাবে
filterDonors();
