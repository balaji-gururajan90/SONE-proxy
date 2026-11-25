export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, state } = req.body;

    const s = state || {};
    const stateDescription = `
- Target material: ${s.material || 'unknown'}
- RF power: ${s.power ?? 'unknown'} W
- Chamber pressure: ${s.pressure ?? 'unknown'} mTorr
- Oxygen content: ${s.oxygenPercent ?? 0} %
- Target poisoning fraction (θt): ${s.thetaT != null ? (s.thetaT * 100).toFixed(1) + '%' : 'unknown'}
- Process status: ${s.processStatus || 'STANDBY'}
- Transport ratio (exp(−d/λ)): ${s.transportRatio != null ? s.transportRatio.toFixed(3) : 'unknown'}
- Film composition: ${s.filmComposition ? JSON.stringify(s.filmComposition) : 'none'}
- Simulation running: ${s.isRunning ? 'yes' : 'no'}`;

    const systemPrompt = `You are SONE (SputterOne Neural Engine), an expert physics assistant embedded inside SputterOne — a browser-based RF magnetron sputtering simulator used for education and research.

Current simulator state:
${stateDescription}

Your role:
- Answer questions about the user's current sputtering process using the state above
- Explain thin film physics, plasma physics, vacuum technology, sputtering yield, reactive sputtering, and materials science
- Reference the Berg (1987) reactive gas model, Yamamura–Bohdansky yield formula, Hertz–Knudsen impingement, and mean free path when relevant
- Keep answers concise: 2–4 sentences unless a longer explanation is clearly needed
- If asked about the current process (material, rate, pressure, poisoning), use the state values above
- If asked something unrelated to sputtering or thin films, politely redirect

Do not make up numbers not present in the simulator state.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 350,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response from AI.';
    res.status(200).json({ reply });

  } catch (err) {
    res.status(500).json({ reply: 'Proxy error: ' + err.message });
  }
}
