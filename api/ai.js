<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Autro AI - Autrobook</title>
<script src="https://google.com" async defer></script> 
<style>
:root{ --bg:#18191a; --card:#242526; --text:#e4e6eb; --border:#3a3b3c; --blue:#1877f2; --brand:#4caf50; }
*{margin:0;padding:0;box-sizing:border-box;font-family:Arial, sans-serif;}
body{background:var(--bg);color:var(--text);display:flex;flex-direction:column;height:100vh;}
.header{display:flex;align-items:center;padding:12px 16px;background:var(--card);border-bottom:1px solid var(--border);}
.header span{cursor:pointer;font-size:20px;padding-right:10px;}
.header b{flex:1;text-align:center;font-size:18px;margin-right:20px;}
.chat-container{flex:1;overflow-y:auto;padding:16px;}
.ai-msg, .user-msg{margin:8px 0;display:flex;gap:8px;}
.ai-msg{align-items:flex-start;}
.user-msg{justify-content:flex-end;}
.bubble{max-width:75%;padding:10px 14px;border-radius:18px;font-size:15px;line-height:1.4;white-space:pre-wrap;word-wrap:break-word;}
.ai-bubble{background:var(--card);border-bottom-left-radius:4px;}
.user-bubble{background:var(--blue);border-bottom-right-radius:4px;}
.avatar{width:32px;height:32px;border-radius:50%;overflow:hidden;background:var(--brand);display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;font-size:14px;flex-shrink:0;}
.avatar img{width:100%;height:100%;object-fit:cover;}
.input-area{display:flex;gap:8px;padding:12px;background:var(--card);border-top:1px solid var(--border);}
.input-area input{flex:1;background:#3a3b3c;border:none;border-radius:20px;padding:10px 14px;color:var(--text);font-size:15px;outline:none;}
.input-area button{background:var(--blue);border:none;border-radius:50%;width:40px;height:40px;color:white;font-size:18px;cursor:pointer;}
.input-area button:disabled{opacity:0.5;cursor:not-allowed;}
.loading{opacity:0.6;font-style:italic;}
.grecaptcha-badge{visibility:hidden;}
</style>
</head>
<body>
<div class="header">
<span onclick="history.back()">←</span>
<b>Autro AI Assistant</b>
</div>
<div class="chat-container" id="chatBox">
<div class="ai-msg">
<div class="avatar"><img src="https://githubusercontent.com" onerror="this.style.display='none';this.parentElement.innerText='AI';"></div>
<div class="bubble ai-bubble">Hello! I'm Autro AI 👋<br>I am your personal AI assistant for Autrobook. Ask me anything about any country or topic in any language!</div>
</div>
</div>
<div class="input-area">
<input type="text" id="userInput" placeholder="Ask Autro AI anything..." onkeypress="if(event.key==='Enter') sendMsg()">
<button id="sendBtn" onclick="sendMsg()">➤</button>
</div>

<script> 
let chatBox = document.getElementById('chatBox');
let isSending = false;

// সম্পূর্ণ ইংরেজিতে সিস্টেম নির্দেশনা, শিক্ষাগত তথ্য ও সব দেশের সাপোর্ট
let chatHistory = [
  {
    role: "system", 
    content: "You are Autro AI, the official global assistant for Autrobook, founded by Abir Mazumder (Born: 10 June 2003, Only child, Father: Babul Kumar Mazumder, Mother: Monika Mitra, Religion: Sanatani, Education: Studies at Dhaka Central University, Lives in: Dhaka, Bangladesh). Your primary and default language is English. However, you are fluent in all languages across every country in the world (such as Bengali, Hindi, Arabic, Spanish, French, Urdu, Russian, Chinese, Japanese, Korean, German, Portuguese, Turkish, Italian, etc.). Always detect the exact language the user writes in and reply strictly in that same language. If a message is short or ambiguous, always respond in English. You also possess complete, accurate, and detailed knowledge about all 195+ countries worldwide, including their capitals, currencies, languages, population, geography, history, culture, and general facts. Provide complete, helpful, and friendly answers."
  }
];

async function getRecaptchaToken() {
  try {
    if (window.grecaptcha && window.grecaptcha.execute) {
      return await window.grecaptcha.execute('6LdCzRsuAAAAAO_hrnS7t-D5-k2tP57eoIRzkIM-', {action: 'sendMessage'});
    }
  } catch (e) {}
  return "instant-token";
}

async function sendMsg(){
  if (isSending) return;
  
  let input = document.getElementById('userInput');
  let sendBtn = document.getElementById('sendBtn');
  let text = input.value.trim();
  if(text === '') return;

  isSending = true;
  sendBtn.disabled = true;

  addMessage(text, 'user');
  chatHistory.push({role: "user", content: text});
  input.value = '';
  
  let loadingId = addMessage("Typing...", 'ai', true);

  const token = await getRecaptchaToken();
  let reply = await getAIResponse(token);
  
  const loadingEl = document.getElementById(loadingId);
  if (loadingEl) loadingEl.remove();
  
  addMessage(reply, 'ai');
  chatHistory.push({role: "assistant", content: reply});

  isSending = false;
  sendBtn.disabled = false;
  input.focus();
}

function addMessage(text, sender, isLoading=false){
  let id = 'msg-' + Date.now() + Math.floor(Math.random() * 1000);
  let msgDiv = document.createElement('div');
  msgDiv.id = id;
  msgDiv.className = sender === 'user' ? 'user-msg' : 'ai-msg ' + (isLoading ? 'loading' : '');

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = sender === 'ai' ? 'bubble ai-bubble' : 'bubble user-bubble';
  bubbleDiv.textContent = text;

  if(sender === 'ai'){
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar';
    avatarDiv.innerHTML = `<img src="https://githubusercontent.com" onerror="this.style.display='none';this.parentElement.innerText='AI';">`;
    msgDiv.appendChild(avatarDiv);
  }
  
  msgDiv.appendChild(bubbleDiv);
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return id;
}

async function getAIResponse(token){
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ history: chatHistory, recaptchaToken: token })
    });
    if(!response.ok) throw new Error("Server Error " + response.status);
    const data = await response.json();
    return data.reply;
  } catch(e) {
    return `Error: Could not connect to server. (${e.message})`;
  }
}

if (window.top !== window.self) {
  window.top.location = window.self.location;
}
</script> 
</body> 
</html>
