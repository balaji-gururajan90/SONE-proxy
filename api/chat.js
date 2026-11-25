export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { message, state } = req.body;
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: 'You are SONE, a sputtering physics assistant.' },
          { role: 'user', content: message || 'hello' }
        ],
        max_tokens: 400,
        temperature: 0.3
      })
    });
    const data = await groqResponse.json();
    // Return full Groq response for debugging
    res.status(200).json({ reply: data.choices?.[0]?.message?.content || 'No response from AI.', debug: data });
  } catch (err) {
    res.status(200).json({ reply: 'Error: ' + err.message, debug: null });
  }
}
