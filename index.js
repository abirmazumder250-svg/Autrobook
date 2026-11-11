export default {
  async fetch(request) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS", 
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (request.method === "POST") {
      const { text } = await request.json();
      const API_KEY = "AQ.Ab8RN6IWa9_pFqulhP43dYy-AWsXsWhFx0dBj3lNt_o2IGLBrQ";
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: text }] }] })
      });
      
      const data = await response.json();
      return new Response(JSON.stringify({ reply: data.candidates[0].content.parts[0].text }), { headers });
    }
    
    return new Response("Use POST", { headers });
  }
}
