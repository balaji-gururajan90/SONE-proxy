export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { message, state } = req.body;
    const s = state || {};

    const systemPrompt = `You are SONE (SputterOne Neural Engine), an expert physics assistant embedded inside SputterOne — a browser-based RF magnetron sputtering simulator. You have real-time access to the simulator state.

Current simulator state:
- Target material: ${s.material || 'unknown'}
- RF power: ${s.power ?? 'unknown'} W
- Chamber pressure: ${s.pressure ?? 'unknown'} mTorr
- Oxygen content: ${s.oxygenPercent ?? 0}%
- Target poisoning fraction (θt): ${s.thetaT != null ? (s.thetaT * 100).toFixed(1) + '%' : 'unknown'}
- Process status: ${s.processStatus || 'STANDBY'}
- Transport ratio (exp(−d/λ)): ${s.transportRatio != null ? s.transportRatio.toFixed(3) : 'unknown'}
- Film composition: ${s.filmComposition ? JSON.stringify(s.filmComposition) : 'none'}
- Simulation running: ${s.isRunning ? 'yes' : 'no'}

You can explain what is happening in the simulation right now, predict outcomes, suggest parameter changes, and answer questions about sputtering physics. Reference the Berg (1987) reactive sputtering model, Yamamura–Bohdansky sputter yield formula, Hertz–Knudsen impingement flux, and mean free path physics when relevant. Be concise, accurate, and educational. Always relate answers back to what the user sees in the simulator.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message || 'hello' }
        ],
        max_tokens: 800,
        temperature: 0.3
      })
    });
    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content || 'No response from AI.';
    res.status(200).json({ reply });
  } catch (err) {
    res.status(200).json({ reply: 'Error: ' + err.message });
  }
}
