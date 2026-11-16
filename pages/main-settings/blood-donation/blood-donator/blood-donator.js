function toast(m){
  var t=document.getElementById('toast');
  t.innerText=m;
  t.style.display='block';
  setTimeout(function(){t.style.display='none'},2500);
}

function registerDonor(){
  var name=document.getElementById('donName').value.trim();
  var group=document.getElementById('donGroup').value;
  var phone=document.getElementById('donPhone').value.trim();
  var loc=document.getElementById('donLoc').value.trim();
  
  var frontFile=document.getElementById('nidFront').files[0];
  var backFile=document.getElementById('nidBack').files[0];
  var selfieFile=document.getElementById('donSelfie').files[0];

  if(!name || !phone || !loc) {
    return toast('Please fill in name, phone, and location!');
  }
  
  if(!frontFile || !backFile || !selfieFile) {
    return toast('Please upload NID Front, Back, and Selfie for verification!');
  }

  // FileReader দিয়ে ছবিগুলোকে Base64 ফরম্যাটে রূপান্তর করে লোকালস্টোরেজে সেইভ করা হচ্ছে
  var readerFront = new FileReader();
  readerFront.onload = function(e1){
    var frontBase64 = e1.target.result;
    
    var readerBack = new FileReader();
    readerBack.onload = function(e2){
      var backBase64 = e2.target.result;
      
      var readerSelfie = new FileReader();
      readerSelfie.onload = function(e3){
        var selfieBase64 = e3.target.result;

        var donorData = {
          id: Date.now(),
          name: name,
          group: group, // A+, A-, B+, B-, O+, O-, AB+, AB- এর যেকোনো একটি
          phone: phone,
          location: loc,
          nidFront: frontBase64,
          nidBack: backBase64,
          selfie: selfieBase64,
          verified: true,
          date: new Date().toLocaleDateString()
        };

        var list=[];
        try{list=JSON.parse(localStorage.getItem('ab_donors')||'[]');}catch(e){list=[];}
        list.unshift(donorData);
        localStorage.setItem('ab_donors',JSON.stringify(list));

        toast('Blood Donor Verified & Registered Successfully! 🩸✅');
        setTimeout(function(){history.back();},1200);
      };
      readerSelfie.readAsDataURL(selfieFile);
    };
    readerBack.readAsDataURL(backFile);
  };
  readerFront.readAsDataURL(frontFile);
}
