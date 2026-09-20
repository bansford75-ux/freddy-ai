export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "Invalid messages" });
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions: "You are Freddy, a friendly, smart, concise AI assistant. Help with studying, coding, writing, brainstorming and everyday questions. Be natural and conversational.",
        input: messages
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "OpenAI request failed" });
    return res.status(200).json({ reply: data.output_text || "I didn't get a response." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
