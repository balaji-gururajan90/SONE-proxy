export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, state } = req.body;

    const systemPrompt = `You are SONE (SputterOne Neural Engine), an intelligent assistant embedded inside a RF magnetron sputtering simulator. 
Current simulator state: ${JSON.stringify(state)}
Answer concisely (2-4 sentences). Only answer questions related to sputtering, thin films, plasma physics, vacuum technology, and materials science. 
If asked something unrelated, politely redirect to sputtering topics.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.4
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response from AI.';
    res.status(200).json({ reply });

  } catch (err) {
    res.status(500).json({ reply: 'Proxy error: ' + err.message });
  }
}
