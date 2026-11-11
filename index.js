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
      try {
        const { text } = await request.json();
        const API_KEY = "AQ.Ab8RN6IWa9_pFqulhP43dYy-AWsXsWhFx0dBj3lNt_o2IGLBrQ";
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: text }] }] })
        });
        
        const data = await response.json();
        
        if (!data.candidates) {
          return new Response(JSON.stringify({ reply: "Error: Gemini থেকে উত্তর আসেনি" }), { headers });
        }

        return new Response(JSON.stringify({ reply: data.candidates[0].content.parts[0].text }), { headers });

      } catch (err) {
        return new Response(JSON.stringify({ reply: "Error: " + err.message }), { headers });
      }
    }
    
    return new Response(JSON.stringify({ reply: "Use POST method" }), { headers });
  }
            }
